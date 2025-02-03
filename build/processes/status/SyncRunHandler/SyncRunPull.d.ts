import { SpinalGraph, SpinalNode } from 'spinal-env-viewer-graph-service';
import type OrganConfigModel from '../../../model/OrganConfigModel';
import { NetworkService } from 'spinal-model-bmsnetwork';
import { SpinalServiceTimeseries } from 'spinal-model-timeseries';
import ModbusRTU from 'modbus-serial';
interface ModbusDevice {
    name: string;
    ip: string;
    port: number;
    dataPoints: {
        name: string;
        type: 'holding_register' | 'input_register' | 'coil' | 'discrete_input';
        bus_address: number;
        address: number;
        size?: number;
        isUnsigned?: boolean;
        isCommand?: boolean;
    }[];
}
/**
 * Main purpose of this class is to pull tickets from client.
 *
 * @export
 * @class SyncRunPull
 */
export declare class SyncRunPull {
    graph: SpinalGraph<any>;
    config: OrganConfigModel;
    interval: number;
    running: boolean;
    foundElevators: string[];
    nwService: NetworkService;
    timeseriesService: SpinalServiceTimeseries;
    modbusClient: ModbusRTU;
    networkContext: SpinalNode<any>;
    modbusConfig: ModbusDevice[];
    updatingData: boolean;
    skipFirst: boolean;
    bindInitialized: boolean;
    enpointPreviousValues: {
        [key: string]: boolean | number;
    };
    private connectionManager;
    constructor(graph: SpinalGraph<any>, config: OrganConfigModel, nwService: NetworkService);
    getHost(): {
        http: any;
        hubUri: any;
    };
    private registerValuesToUintX;
    /**
     * Converts a number or bigint into an array of 16-bit registers.
     *
     * @param value - The numeric value (can be number or bigint).
     * @param size - How many 16-bit registers we need to fill.
     * @param isUnsigned - Whether we treat value as unsigned or signed.
     */
    private uintXToRegisterValues;
    parseExcelToModbusConfig(filePath: string): ModbusDevice[];
    createDevice(deviceName: any): Promise<void>;
    initNetworkContext(): Promise<SpinalNode<any>>;
    initModbusConfiguration(): Promise<void>;
    private downloadFile;
    private waitFct;
    createEndpoint(deviceId: string, endpointName: string, initialValue: number | string | boolean): Promise<SpinalNode<any>>;
    updateData(): Promise<void>;
    sendWriteRequest(newValue: number | bigint, dataType: string, dataAddress: number, ip: string, port: number, busAddress: number, size?: number, isUnsigned?: boolean): Promise<boolean>;
    initValueBinds(): Promise<void>;
    createDataPointsFromConfig(): Promise<void>;
    init(): Promise<void>;
    run(): Promise<void>;
    stop(): void;
}
export default SyncRunPull;
