import ModbusRTU from 'modbus-serial';

const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_BACKOFF_BASE_MS = 5000;
const DEFAULT_BACKOFF_MAX_MS = 5 * 60 * 1000;
// Margin added to the Modbus timeout before the deadline drops the connection.
const DEADLINE_MARGIN_MS = 1000;

export interface ModbusConnectionOptions {
  timeoutMs?: number;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
}

/** Thrown without touching the network while a gateway is in backoff. */
export class ModbusBackoffError extends Error {
  constructor(key: string, retryInMs: number) {
    super(`${key} unavailable, next connection attempt in ${retryInMs} ms`);
    this.name = 'ModbusBackoffError';
  }
}

/** Thrown when the library never settled a call within its deadline. */
export class ModbusDeadlineError extends Error {
  constructor(key: string, deadlineMs: number) {
    super(`${key} did not answer within ${deadlineMs} ms`);
    this.name = 'ModbusDeadlineError';
  }
}

/**
 * Reads MODBUS_TIMEOUT (ms) from the environment.
 * A missing or invalid value falls back to the default.
 */
export function getModbusTimeoutMs(): number {
  const value = parseInt(process.env.MODBUS_TIMEOUT, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

/**
 * True when the TCP connection can no longer be trusted. A Modbus exception or
 * a silent meter behind a gateway says nothing about the gateway itself, so the
 * connection shared with the other meters is kept in those cases.
 */
export function isConnectionError(error: any): boolean {
  if (error?.modbusCode !== undefined) return false;
  return error?.name !== 'TransactionTimedOutError';
}

export class ModbusConnectionWrapper {
  private modbusClient: ModbusRTU = this.createClient();
  // This promise chain ensures operations execute one after the other.
  // It never rejects, so one failure cannot block the following operations.
  private queue: Promise<unknown> = Promise.resolve();
  private failedConnections = 0;
  private nextConnectionAt = 0;
  private readonly timeoutMs: number;
  private readonly backoffBaseMs: number;
  private readonly backoffMaxMs: number;

  constructor(
    private ip: string,
    private port: number,
    options: ModbusConnectionOptions = {}
  ) {
    this.timeoutMs = options.timeoutMs ?? getModbusTimeoutMs();
    this.backoffBaseMs = options.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    this.backoffMaxMs = options.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
  }

  private get key(): string {
    return `${this.ip}:${this.port}`;
  }

  private createClient(): ModbusRTU {
    const client = new ModbusRTU();
    // Without a listener, an 'error' event would crash the whole organ.
    client.on('error', (error: Error) => {
      console.error(`Modbus client error on ${this.key}:`, error?.message);
    });
    return client;
  }

  private async withDeadline<T>(work: Promise<T>): Promise<T> {
    const deadlineMs = this.timeoutMs + DEADLINE_MARGIN_MS;
    let timer: NodeJS.Timeout;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new ModbusDeadlineError(this.key, deadlineMs)),
        deadlineMs
      );
    });
    try {
      return await Promise.race([work, deadline]);
    } finally {
      clearTimeout(timer);
    }
  }

  async connect(): Promise<void> {
    if (this.modbusClient.isOpen) return;

    const retryInMs = this.nextConnectionAt - Date.now();
    if (retryInMs > 0) throw new ModbusBackoffError(this.key, retryInMs);

    try {
      await this.withDeadline(
        this.modbusClient.connectTCP(this.ip, {
          port: this.port,
          timeout: this.timeoutMs,
        })
      );
      this.modbusClient.setTimeout(this.timeoutMs);
      if (this.failedConnections > 0) {
        console.log(`Modbus connection restored on ${this.key}`);
      }
      this.failedConnections = 0;
      this.nextConnectionAt = 0;
    } catch (error) {
      this.nextConnectionAt = Date.now() + this.nextBackoffMs();
      this.failedConnections += 1;
      this.dropConnection();
      throw error;
    }
  }

  private nextBackoffMs(): number {
    const backoff = this.backoffBaseMs * 2 ** this.failedConnections;
    return Math.min(backoff, this.backoffMaxMs);
  }

  /** Closes the client and replaces it, so the next call starts from a clean socket. */
  private dropConnection(): void {
    const client = this.modbusClient;
    this.modbusClient = this.createClient();
    try {
      client.close(() => undefined);
    } catch (error) {
      console.error(`Failed to close Modbus client on ${this.key}:`, error);
    }
  }

  /**
   * Queues an operation. Before running the operation, ensure the connection is open
   * and set the slave ID (busAddress).
   */
  execute<T>(
    busAddress: number,
    operation: (client: ModbusRTU) => Promise<T>
  ): Promise<T> {
    const run = this.queue.then(async () => {
      await this.connect();
      this.modbusClient.setID(busAddress);
      try {
        return await this.withDeadline(operation(this.modbusClient));
      } catch (error) {
        if (isConnectionError(error)) this.dropConnection();
        throw error;
      }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  close(): void {
    if (this.modbusClient.isOpen) {
      this.modbusClient.close(() => {
        console.log(`Closing Modbus connection :${this.key}`);
      });
    }
  }
}

export class ModbusConnectionManager {
  // We use a key of "ip:port" to store each persistent connection.
  private connections: Map<string, ModbusConnectionWrapper> = new Map();

  private getKey(ip: string, port: number): string {
    return `${ip}:${port}`;
  }

  async getConnection(
    ip: string,
    port: number
  ): Promise<ModbusConnectionWrapper> {
    const key = this.getKey(ip, port);
    if (!this.connections.has(key)) {
      const wrapper = new ModbusConnectionWrapper(ip, port);
      this.connections.set(key, wrapper);
    }
    return this.connections.get(key);
  }

  closeAll(): void {
    for (const wrapper of this.connections.values()) {
      wrapper.close();
    }
    this.connections.clear();
  }
}
