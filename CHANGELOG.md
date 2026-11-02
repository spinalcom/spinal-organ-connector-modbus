# Changelog

Each entry gives the reason for the change, the fix, and how it was verified.

## Unreleased

### Install: lockfile regenerated

- **Reason:** `package-lock.json` used `lockfileVersion: 1` (npm 5/6) and held 40 git references. `spinalcom-utils i` runs `npm i`, which followed those references: each cloned dependency started its own `npm install --force`. On vps-10 this reached several hundred processes, filled 30 GB of RAM and restarted BOS services.
- **Fix:** lockfile regenerated in format 3 with no git reference. Spinal dependencies moved to `spinalDependencies`, as in the other organs.
- **Verified:** full install in about 1 minute with at most 5 `npm` processes, and `tsc --noEmit` passes.

### Dependencies declared

- **Reason:** `spinal-model-bmsnetwork`, `spinal-model-timeseries` and `spinal-env-viewer-context-geographic-service` are imported by the source but only arrived through other packages. An update of those packages could silently remove them.
- **Fix:** added to `spinalDependencies`. The geographic service is only used by `src/constants.ts`, which nothing imports; removing that file is left to a later cleanup.

### Fixed: polling stopped after the first Modbus error (A1)

- **Reason:** in `execute()`, each operation was chained on `this.queue`, and the queue kept the rejected promise after a failure. Every later operation then returned the same old error without touching the network, until the organ was restarted. There was also no `try/catch` per data point, so one failure ended the whole cycle, and `updatingData` stayed `true` after an error.
- **Fix:**
  - The queue now keeps a promise that never rejects, and each caller still gets its own result.
  - A connection error replaces the client, so the next attempt starts from a clean socket.
  - An `error` listener is set on the client, so that event cannot crash the organ.
  - `readAllDevices()` catches errors per point. A connection failure skips the rest of that device, and a Modbus exception or a silent meter only skips that point, since the gateway itself is still fine.
  - `updateData()` resets `updatingData` in a `finally`.
  - Each cycle logs `Read cycle done: N succeeded, M failed`.
- **Verified:** `npm test` (connection refused then recovered, gateway dropped then recovered, refused register), then end-to-end on a test hub: simulator stopped for 25 s, reads resumed without restart, and a dead gateway did not stop the other device.

### Fixed: no timeout on Modbus calls (A2)

- **Reason:** `setTimeout` was never called on the client, and modbus-serial starts no timer without a value. A silent device could freeze the organ while pm2 still showed it `online`.
- **Fix:**
  - New optional `MODBUS_TIMEOUT` variable in ms, 2000 by default.
  - The value applies to the TCP connection and to Modbus requests.
  - A deadline of timeout + 1 s covers calls that the library never settles, and it drops the connection.
  - After a failed connection, attempts are spaced out from 5 s up to 5 min, so a dead gateway does not slow down the others.
- **Verified:** `npm test` (silent device, operation that never settles, backoff then new attempt).

### Fixed: fake 0 in timeseries when an endpoint is created (A3)

- **Reason:** creating an endpoint stored a 0 in its timeseries, in both `updateData` and `createDataPointsFromConfig`. On an energy index, the jump from 0 to the real value looks like a huge consumption and distorts daily and monthly differences.
- **Fix:** both creation paths no longer write a value. `setEndpointValue(..., 0)` was removed as well, because it also stores in the timeseries when `NetworkService(true)` is used. The first real read now creates the first point.
- **Verified:** end-to-end run on a test hub with a local simulator: no 0 in any timeseries, including endpoints that were never read. Endpoints already created by an earlier version keep their 0 until it is purged.

### Fixed: each measure stored twice (A4)

- **Reason:** `setEndpointValue` already pushes to the timeseries (`spinal-model-bmsnetwork` 1.4.1, `NetworkService(true)`), and `pushFromEndpoint` pushed the same value again.
- **Fix:** second push removed. The hub write now also happens outside the Modbus queue, so a slow hub cannot trigger the Modbus deadline.
- **Verified:** same run: 8 reads gave exactly 8 timeseries points on each endpoint.

### Fixed: creating an endpoint failed with "no attribute found"

- **Reason:** `updateAttribute` throws when the attribute does not exist, which is always the case on a new endpoint. Startup stopped before the value binds and `Init Done`, each read cycle created one endpoint and then waited 60 s, and the 366-day retention was never applied.
- **Fix:** `setTimeSeriesRetention()` creates the `default` category and the attribute when they are missing. A failure there is logged and no longer stops the organ.
- **Verified:** end-to-end run on a test hub. Endpoints created by an earlier version keep the default retention.

### Added: read status per device (A7)

- **Reason:** after a failed read, the old value stayed in place with no indication, so a flat curve could not be told apart from a silent meter. The status only existed in the logs.
- **Fix:** each device gets a `modbus` attribute category, visible on the node:
  - `modbus status`: `ok`, `partial` or `error`;
  - `modbus last error`: the failing point and its error;
  - `modbus failing since`: UTC date of the start of the failure;
  - `modbus last success`: UTC date, refreshed as described below.
- **Hub load:** `DeviceStatusTracker` writes an attribute only when its value changes, and refreshes `modbus last success` at most every 15 minutes per device. A failure lasting several cycles writes once. Backoff messages hold a countdown, so they are not written. A failed status write is logged and never interrupts the reads.
- **Verified:** `npm test`, then end-to-end on a test hub with a simulator outage: 11 read cycles gave 4 status writes (11 attributes) and no timeseries point. On a restart the status is written once again, as it is only tracked in memory.

### Added

- `npm test`: tests in `test/modbusConnection.test.js` and `test/deviceStatus.test.js`, with no hub and no extra dependency.
- `src/processes/status/SyncRunHandler/ModbusConnection.ts`: connection classes moved out of `SyncRunPull.ts` so they can be tested without loading the graph.

### Not changed

- Word order (A5): waits for a real read on site.
- Commands (A9): still to fix before any `Is Command = true`.
