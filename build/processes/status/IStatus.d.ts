import { SpinalGraph } from 'spinal-env-viewer-graph-service';
export default interface IStatus {
    graph: SpinalGraph<any>;
    start(): any;
    stop(): any;
}
