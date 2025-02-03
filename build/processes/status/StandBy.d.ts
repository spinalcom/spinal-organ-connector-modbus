import { SpinalGraph } from 'spinal-env-viewer-graph-service';
import IStatus from './IStatus';
export default class StandBy implements IStatus {
    graph: SpinalGraph<any>;
    start(): Promise<number>;
    stop(): void;
}
