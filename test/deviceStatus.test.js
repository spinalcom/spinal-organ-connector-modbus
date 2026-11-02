// Tests for A7: status attributes must only be written when they change.
const test = require('node:test');
const assert = require('node:assert');
const {
  DeviceStatusTracker,
} = require('../build/processes/status/SyncRunHandler/DeviceStatus');

const OK = { succeeded: 2, failed: 0 };
const MINUTE = 60 * 1000;

test('first cycle writes the status', () => {
  const changes = new DeviceStatusTracker().update('A', OK, 1000);
  assert.strictEqual(changes['modbus status'], 'ok');
  assert.ok(changes['modbus last success']);
});

test('a stable device writes nothing between heartbeats', () => {
  const tracker = new DeviceStatusTracker(15 * MINUTE);
  tracker.update('A', OK, 0);
  assert.deepStrictEqual(tracker.update('A', OK, 5 * MINUTE), {});
  assert.deepStrictEqual(tracker.update('A', OK, 10 * MINUTE), {});
});

test('the heartbeat only refreshes the last success date', () => {
  const tracker = new DeviceStatusTracker(15 * MINUTE);
  tracker.update('A', OK, 15 * MINUTE);
  const changes = tracker.update('A', OK, 30 * MINUTE);
  assert.deepStrictEqual(Object.keys(changes), ['modbus last success']);
});

test('a lasting failure writes once, including during backoff', () => {
  const tracker = new DeviceStatusTracker();
  tracker.update('A', OK, 0);
  const failed = { succeeded: 0, failed: 1, lastError: 'ECONNREFUSED' };

  const first = tracker.update('A', failed, MINUTE);
  assert.strictEqual(first['modbus status'], 'error');
  assert.strictEqual(first['modbus last error'], 'ECONNREFUSED');
  assert.ok(first['modbus failing since']);

  assert.deepStrictEqual(tracker.update('A', failed, 2 * MINUTE), {});
  const backoff = {
    succeeded: 0,
    failed: 1,
    lastError: 'next attempt in 1954 ms',
    skippedByBackoff: true,
  };
  assert.deepStrictEqual(tracker.update('A', backoff, 3 * MINUTE), {});
});

test('recovery clears the error and the failing date', () => {
  const tracker = new DeviceStatusTracker(15 * MINUTE);
  tracker.update('A', OK, 15 * MINUTE);
  tracker.update('A', { succeeded: 0, failed: 1, lastError: 'x' }, 16 * MINUTE);
  const changes = tracker.update('A', OK, 17 * MINUTE);
  assert.strictEqual(changes['modbus status'], 'ok');
  assert.strictEqual(changes['modbus last error'], '-');
  assert.strictEqual(changes['modbus failing since'], '-');
});

test('one refused point on a working device is reported as partial', () => {
  const changes = new DeviceStatusTracker().update(
    'A',
    { succeeded: 1, failed: 1, lastError: 'Modbus exception 2' },
    1000
  );
  assert.strictEqual(changes['modbus status'], 'partial');
  assert.ok(changes['modbus last success']);
});

test('devices are tracked separately', () => {
  const tracker = new DeviceStatusTracker();
  tracker.update('A', OK, 0);
  assert.strictEqual(tracker.update('B', OK, 1000)['modbus status'], 'ok');
});
