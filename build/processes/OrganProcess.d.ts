import { SpinalGraph } from 'spinal-env-viewer-graph-service';
import OrganConfigModel from '../model/OrganConfigModel';
import IStatus from './status/IStatus';
import { NetworkService } from "spinal-model-bmsnetwork";
export declare class OrganProcess {
    config: OrganConfigModel;
    graph: SpinalGraph<any>;
    mapStatusHandler: Map<number, IStatus>;
    nwService: NetworkService;
    constructor();
    /**
     * Get organ config from spinalhub.
     * Throws error if config not accessible for whathever reason.
     * Else Initialize organ process (0: StandBy, 1: SyncProcess, 2: SyncRun, 3: SyncSpatial, 4: SyncEquip)
     * @memberof OrganProcess
     */
    init(): Promise<void>;
    /**
     * Run organ process
     *
     * @memberof OrganProcess
     */
    run(): void;
}
