import ModbusRTU from 'modbus-serial';
export interface ModbusConnectionOptions {
    timeoutMs?: number;
    backoffBaseMs?: number;
    backoffMaxMs?: number;
}
/** Thrown without touching the network while a gateway is in backoff. */
export declare class ModbusBackoffError extends Error {
    constructor(key: string, retryInMs: number);
}
/** Thrown when the library never settled a call within its deadline. */
export declare class ModbusDeadlineError extends Error {
    constructor(key: string, deadlineMs: number);
}
/**
 * Reads MODBUS_TIMEOUT (ms) from the environment.
 * A missing or invalid value falls back to the default.
 */
export declare function getModbusTimeoutMs(): number;
/**
 * True when the TCP connection can no longer be trusted. A Modbus exception or
 * a silent meter behind a gateway says nothing about the gateway itself, so the
 * connection shared with the other meters is kept in those cases.
 */
export declare function isConnectionError(error: any): boolean;
export declare class ModbusConnectionWrapper {
    private ip;
    private port;
    private modbusClient;
    private queue;
    private failedConnections;
    private nextConnectionAt;
    private readonly timeoutMs;
    private readonly backoffBaseMs;
    private readonly backoffMaxMs;
    constructor(ip: string, port: number, options?: ModbusConnectionOptions);
    private get key();
    private createClient;
    private withDeadline;
    connect(): Promise<void>;
    private nextBackoffMs;
    /** Closes the client and replaces it, so the next call starts from a clean socket. */
    private dropConnection;
    /**
     * Queues an operation. Before running the operation, ensure the connection is open
     * and set the slave ID (busAddress).
     */
    execute<T>(busAddress: number, operation: (client: ModbusRTU) => Promise<T>): Promise<T>;
    close(): void;
}
export declare class ModbusConnectionManager {
    private connections;
    private getKey;
    getConnection(ip: string, port: number): Promise<ModbusConnectionWrapper>;
    closeAll(): void;
}
