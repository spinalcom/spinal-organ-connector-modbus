import { Model } from 'spinal-core-connectorjs_type';
export default class OrganConfigModel extends Model {
    digitalTwinPath: spinal.Str;
    contextId: spinal.Str;
    pullInterval: spinal.Val;
    lastSync: spinal.Val;
    restart: spinal.Bool;
    constructor();
    updateSync(): void;
    initEnv(): void;
    bindRestart(): void;
}
