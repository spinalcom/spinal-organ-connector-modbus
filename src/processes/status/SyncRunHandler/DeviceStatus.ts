export const STATUS_CATEGORY = 'modbus';
export const NO_VALUE = '-';
const DEFAULT_HEARTBEAT_MS = 15 * 60 * 1000;

export type DeviceStatusAttributes = Record<string, string>;

export interface DeviceCycleResult {
  succeeded: number;
  failed: number;
  lastError?: string;
  // True when no network attempt was made because the gateway is in backoff.
  skippedByBackoff?: boolean;
}

interface DeviceState {
  written: DeviceStatusAttributes;
  lastSuccessWrittenAt: number;
}

/**
 * Decides which status attributes must be written after a read cycle.
 * It never touches the hub: writes only happen when a value really changes,
 * and the last success date is refreshed at most once per heartbeat.
 */
export class DeviceStatusTracker {
  private states: Map<string, DeviceState> = new Map();

  constructor(private heartbeatMs: number = DEFAULT_HEARTBEAT_MS) {}

  update(
    deviceName: string,
    result: DeviceCycleResult,
    now: number = Date.now()
  ): DeviceStatusAttributes {
    const state = this.states.get(deviceName) ?? {
      written: {},
      lastSuccessWrittenAt: -Infinity,
    };
    this.states.set(deviceName, state);

    const previous = state.written;
    const next: DeviceStatusAttributes = {};
    const date = new Date(now).toISOString();

    next['modbus status'] =
      result.failed === 0 ? 'ok' : result.succeeded > 0 ? 'partial' : 'error';

    if (result.failed === 0) {
      next['modbus last error'] = NO_VALUE;
      next['modbus failing since'] = NO_VALUE;
    } else {
      // A backoff message holds a countdown: keep the real cause already known.
      next['modbus last error'] = result.skippedByBackoff
        ? previous['modbus last error'] ?? NO_VALUE
        : result.lastError ?? NO_VALUE;
      const failingSince = previous['modbus failing since'];
      next['modbus failing since'] =
        failingSince && failingSince !== NO_VALUE ? failingSince : date;
    }

    if (
      result.succeeded > 0 &&
      now - state.lastSuccessWrittenAt >= this.heartbeatMs
    ) {
      next['modbus last success'] = date;
      state.lastSuccessWrittenAt = now;
    }

    const changes: DeviceStatusAttributes = {};
    for (const [label, value] of Object.entries(next)) {
      if (previous[label] !== value) changes[label] = value;
    }
    state.written = { ...previous, ...changes };
    return changes;
  }
}
