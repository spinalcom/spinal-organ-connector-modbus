export declare const STATUS_CATEGORY = "modbus";
export declare const NO_VALUE = "-";
export type DeviceStatusAttributes = Record<string, string>;
export interface DeviceCycleResult {
    succeeded: number;
    failed: number;
    lastError?: string;
    skippedByBackoff?: boolean;
}
/**
 * Decides which status attributes must be written after a read cycle.
 * It never touches the hub: writes only happen when a value really changes,
 * and the last success date is refreshed at most once per heartbeat.
 */
export declare class DeviceStatusTracker {
    private heartbeatMs;
    private states;
    constructor(heartbeatMs?: number);
    update(deviceName: string, result: DeviceCycleResult, now?: number): DeviceStatusAttributes;
}
