"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModbusConnectionManager = exports.ModbusConnectionWrapper = exports.isConnectionError = exports.getModbusTimeoutMs = exports.ModbusDeadlineError = exports.ModbusBackoffError = void 0;
const modbus_serial_1 = __importDefault(require("modbus-serial"));
const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_BACKOFF_BASE_MS = 5000;
const DEFAULT_BACKOFF_MAX_MS = 5 * 60 * 1000;
// Margin added to the Modbus timeout before the deadline drops the connection.
const DEADLINE_MARGIN_MS = 1000;
/** Thrown without touching the network while a gateway is in backoff. */
class ModbusBackoffError extends Error {
    constructor(key, retryInMs) {
        super(`${key} unavailable, next connection attempt in ${retryInMs} ms`);
        this.name = 'ModbusBackoffError';
    }
}
exports.ModbusBackoffError = ModbusBackoffError;
/** Thrown when the library never settled a call within its deadline. */
class ModbusDeadlineError extends Error {
    constructor(key, deadlineMs) {
        super(`${key} did not answer within ${deadlineMs} ms`);
        this.name = 'ModbusDeadlineError';
    }
}
exports.ModbusDeadlineError = ModbusDeadlineError;
/**
 * Reads MODBUS_TIMEOUT (ms) from the environment.
 * A missing or invalid value falls back to the default.
 */
function getModbusTimeoutMs() {
    const value = parseInt(process.env.MODBUS_TIMEOUT, 10);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}
exports.getModbusTimeoutMs = getModbusTimeoutMs;
/**
 * True when the TCP connection can no longer be trusted. A Modbus exception or
 * a silent meter behind a gateway says nothing about the gateway itself, so the
 * connection shared with the other meters is kept in those cases.
 */
function isConnectionError(error) {
    if (error?.modbusCode !== undefined)
        return false;
    return error?.name !== 'TransactionTimedOutError';
}
exports.isConnectionError = isConnectionError;
class ModbusConnectionWrapper {
    ip;
    port;
    modbusClient = this.createClient();
    // This promise chain ensures operations execute one after the other.
    // It never rejects, so one failure cannot block the following operations.
    queue = Promise.resolve();
    failedConnections = 0;
    nextConnectionAt = 0;
    timeoutMs;
    backoffBaseMs;
    backoffMaxMs;
    constructor(ip, port, options = {}) {
        this.ip = ip;
        this.port = port;
        this.timeoutMs = options.timeoutMs ?? getModbusTimeoutMs();
        this.backoffBaseMs = options.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
        this.backoffMaxMs = options.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
    }
    get key() {
        return `${this.ip}:${this.port}`;
    }
    createClient() {
        const client = new modbus_serial_1.default();
        // Without a listener, an 'error' event would crash the whole organ.
        client.on('error', (error) => {
            console.error(`Modbus client error on ${this.key}:`, error?.message);
        });
        return client;
    }
    async withDeadline(work) {
        const deadlineMs = this.timeoutMs + DEADLINE_MARGIN_MS;
        let timer;
        const deadline = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new ModbusDeadlineError(this.key, deadlineMs)), deadlineMs);
        });
        try {
            return await Promise.race([work, deadline]);
        }
        finally {
            clearTimeout(timer);
        }
    }
    async connect() {
        if (this.modbusClient.isOpen)
            return;
        const retryInMs = this.nextConnectionAt - Date.now();
        if (retryInMs > 0)
            throw new ModbusBackoffError(this.key, retryInMs);
        try {
            await this.withDeadline(this.modbusClient.connectTCP(this.ip, {
                port: this.port,
                timeout: this.timeoutMs,
            }));
            this.modbusClient.setTimeout(this.timeoutMs);
            if (this.failedConnections > 0) {
                console.log(`Modbus connection restored on ${this.key}`);
            }
            this.failedConnections = 0;
            this.nextConnectionAt = 0;
        }
        catch (error) {
            this.nextConnectionAt = Date.now() + this.nextBackoffMs();
            this.failedConnections += 1;
            this.dropConnection();
            throw error;
        }
    }
    nextBackoffMs() {
        const backoff = this.backoffBaseMs * 2 ** this.failedConnections;
        return Math.min(backoff, this.backoffMaxMs);
    }
    /** Closes the client and replaces it, so the next call starts from a clean socket. */
    dropConnection() {
        const client = this.modbusClient;
        this.modbusClient = this.createClient();
        try {
            client.close(() => undefined);
        }
        catch (error) {
            console.error(`Failed to close Modbus client on ${this.key}:`, error);
        }
    }
    /**
     * Queues an operation. Before running the operation, ensure the connection is open
     * and set the slave ID (busAddress).
     */
    execute(busAddress, operation) {
        const run = this.queue.then(async () => {
            await this.connect();
            this.modbusClient.setID(busAddress);
            try {
                return await this.withDeadline(operation(this.modbusClient));
            }
            catch (error) {
                if (isConnectionError(error))
                    this.dropConnection();
                throw error;
            }
        });
        this.queue = run.catch(() => undefined);
        return run;
    }
    close() {
        if (this.modbusClient.isOpen) {
            this.modbusClient.close(() => {
                console.log(`Closing Modbus connection :${this.key}`);
            });
        }
    }
}
exports.ModbusConnectionWrapper = ModbusConnectionWrapper;
class ModbusConnectionManager {
    // We use a key of "ip:port" to store each persistent connection.
    connections = new Map();
    getKey(ip, port) {
        return `${ip}:${port}`;
    }
    async getConnection(ip, port) {
        const key = this.getKey(ip, port);
        if (!this.connections.has(key)) {
            const wrapper = new ModbusConnectionWrapper(ip, port);
            this.connections.set(key, wrapper);
        }
        return this.connections.get(key);
    }
    closeAll() {
        for (const wrapper of this.connections.values()) {
            wrapper.close();
        }
        this.connections.clear();
    }
}
exports.ModbusConnectionManager = ModbusConnectionManager;
//# sourceMappingURL=ModbusConnection.js.map