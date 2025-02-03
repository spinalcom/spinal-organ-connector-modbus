import { SpinalGraph } from 'spinal-env-viewer-graph-service';
import OrganConfigModel from '../../model/OrganConfigModel';
import IStatus from './IStatus';
import SyncRunPull from './SyncRunHandler/SyncRunPull';
import { NetworkService } from "spinal-model-bmsnetwork";
export default class SyncRun implements IStatus {
    graph: SpinalGraph<any>;
    config: OrganConfigModel;
    syncRunPull: SyncRunPull;
    nwService: NetworkService;
    constructor(graph: SpinalGraph<any>, config: OrganConfigModel, nwService: NetworkService);
    start(): Promise<number>;
    stop(): void;
}
