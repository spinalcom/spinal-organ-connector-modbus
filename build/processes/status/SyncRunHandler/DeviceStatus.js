"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceStatusTracker = exports.NO_VALUE = exports.STATUS_CATEGORY = void 0;
exports.STATUS_CATEGORY = 'modbus';
exports.NO_VALUE = '-';
const DEFAULT_HEARTBEAT_MS = 15 * 60 * 1000;
/**
 * Decides which status attributes must be written after a read cycle.
 * It never touches the hub: writes only happen when a value really changes,
 * and the last success date is refreshed at most once per heartbeat.
 */
class DeviceStatusTracker {
    heartbeatMs;
    states = new Map();
    constructor(heartbeatMs = DEFAULT_HEARTBEAT_MS) {
        this.heartbeatMs = heartbeatMs;
    }
    update(deviceName, result, now = Date.now()) {
        const state = this.states.get(deviceName) ?? {
            written: {},
            lastSuccessWrittenAt: -Infinity,
        };
        this.states.set(deviceName, state);
        const previous = state.written;
        const next = {};
        const date = new Date(now).toISOString();
        next['modbus status'] =
            result.failed === 0 ? 'ok' : result.succeeded > 0 ? 'partial' : 'error';
        if (result.failed === 0) {
            next['modbus last error'] = exports.NO_VALUE;
            next['modbus failing since'] = exports.NO_VALUE;
        }
        else {
            // A backoff message holds a countdown: keep the real cause already known.
            next['modbus last error'] = result.skippedByBackoff
                ? previous['modbus last error'] ?? exports.NO_VALUE
                : result.lastError ?? exports.NO_VALUE;
            const failingSince = previous['modbus failing since'];
            next['modbus failing since'] =
                failingSince && failingSince !== exports.NO_VALUE ? failingSince : date;
        }
        if (result.succeeded > 0 &&
            now - state.lastSuccessWrittenAt >= this.heartbeatMs) {
            next['modbus last success'] = date;
            state.lastSuccessWrittenAt = now;
        }
        const changes = {};
        for (const [label, value] of Object.entries(next)) {
            if (previous[label] !== value)
                changes[label] = value;
        }
        state.written = { ...previous, ...changes };
        return changes;
    }
}
exports.DeviceStatusTracker = DeviceStatusTracker;
//# sourceMappingURL=DeviceStatus.js.map