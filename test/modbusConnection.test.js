// Regression tests for A1 (blocked queue) and A2 (no timeout).
// Run with `npm test`: no hub, no digital twin, loopback sockets only.
const test = require('node:test');
const assert = require('node:assert');
const net = require('node:net');
const ModbusRTU = require('modbus-serial');
const {
  ModbusConnectionWrapper,
  ModbusBackoffError,
} = require('../build/processes/status/SyncRunHandler/ModbusConnection');

const OPTIONS = { timeoutMs: 300, backoffBaseMs: 200, backoffMaxMs: 400 };
const read = (client) => client.readHoldingRegisters(100, 2);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve) => {
    const probe = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function startSimulator(port) {
  return new Promise((resolve, reject) => {
    const vector = {
      getHoldingRegister(address, unitID, callback) {
        if (address >= 200) {
          const error = new Error('Illegal data address');
          error.modbusErrorCode = 2;
          return callback(error);
        }
        callback(null, 42);
      },
    };
    const server = new ModbusRTU.ServerTCP(vector, {
      host: '127.0.0.1',
      port,
      unitID: 1,
    });
    server.on('socketError', () => undefined);
    server.on('initialized', () => resolve(server));
    server.on('error', reject);
  });
}

const stop = (server) => new Promise((resolve) => server.close(resolve));

test('reads registers through the queue', async () => {
  const port = await freePort();
  const server = await startSimulator(port);
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);
  const result = await connection.execute(1, read);
  assert.deepStrictEqual(result.data, [42, 42]);
  connection.close();
  await stop(server);
});

test('A1: a connection failure does not block the queue forever', async () => {
  const port = await freePort();
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);
  await assert.rejects(connection.execute(1, read), /ECONNREFUSED/);

  const server = await startSimulator(port);
  await sleep(OPTIONS.backoffMaxMs + 50);
  const result = await connection.execute(1, read);
  assert.deepStrictEqual(result.data, [42, 42]);
  connection.close();
  await stop(server);
});

test('A1: queued operations each get their own result', async () => {
  const port = await freePort();
  const server = await startSimulator(port);
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);
  const [refused, accepted] = await Promise.allSettled([
    connection.execute(1, (client) => client.readHoldingRegisters(200, 1)),
    connection.execute(1, read),
  ]);
  assert.strictEqual(refused.status, 'rejected');
  assert.strictEqual(refused.reason.modbusCode, 2);
  assert.strictEqual(accepted.status, 'fulfilled');
  connection.close();
  await stop(server);
});

test('A2: a silent device rejects instead of hanging', async () => {
  const port = await freePort();
  // Reads requests without answering, and closes when the client closes.
  const silent = net.createServer((socket) => {
    socket.on('error', () => undefined);
    socket.resume();
  });
  await new Promise((resolve) => silent.listen(port, '127.0.0.1', resolve));
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);

  const start = Date.now();
  await assert.rejects(connection.execute(1, read), {
    name: 'TransactionTimedOutError',
  });
  assert.ok(Date.now() - start < OPTIONS.timeoutMs + 500);
  connection.close();
  silent.close();
});

test('A2: an operation that never settles hits the deadline', async () => {
  const port = await freePort();
  const server = await startSimulator(port);
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);
  await assert.rejects(connection.execute(1, () => new Promise(() => undefined)), {
    name: 'ModbusDeadlineError',
  });
  const result = await connection.execute(1, read);
  assert.deepStrictEqual(result.data, [42, 42]);
  connection.close();
  await stop(server);
});

test('A2: backoff rejects at once, then the gateway is tried again', async () => {
  const port = await freePort();
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);
  await assert.rejects(connection.execute(1, read), /ECONNREFUSED/);

  const start = Date.now();
  await assert.rejects(connection.execute(1, read), ModbusBackoffError);
  assert.ok(Date.now() - start < 50);

  await sleep(OPTIONS.backoffMaxMs + 50);
  await assert.rejects(connection.execute(1, read), /ECONNREFUSED/);
});

test('A1: reconnects after the gateway drops the connection', async () => {
  const port = await freePort();
  let server = await startSimulator(port);
  const connection = new ModbusConnectionWrapper('127.0.0.1', port, OPTIONS);
  await connection.execute(1, read);

  await stop(server);
  await sleep(50);
  await assert.rejects(connection.execute(1, read));

  server = await startSimulator(port);
  await sleep(OPTIONS.backoffMaxMs + 50);
  const result = await connection.execute(1, read);
  assert.deepStrictEqual(result.data, [42, 42]);
  connection.close();
  await stop(server);
});
