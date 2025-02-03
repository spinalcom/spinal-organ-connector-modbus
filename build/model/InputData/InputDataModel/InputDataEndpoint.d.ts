import { InputDataEndpoint as idEndpoint, InputDataEndpointDataType, InputDataEndpointType } from "spinal-model-bmsnetwork";
/**
 * @property {string} id
 * @property {string} name
 * @property {string} path
 * @property {number | string} currentValue
 * @property {string} unit
 * @property {InputDataEndpointDataType} dataType
 * @property {InputDataEndpointType} type
 * @property {string} nodeTypeName equal SpinalBmsEndpoint.nodeTypeName
 * @property {any[]} timeseries
 * @export
 * @class InputDataEndpoint
 * @implements {idEndpoint}
 */
export declare class InputDataEndpoint implements idEndpoint {
    id: string;
    name: string;
    path: string;
    currentValue: number | string | boolean;
    unit: string;
    dataType: InputDataEndpointDataType;
    type: InputDataEndpointType;
    nodeTypeName: string;
    timeseries: any[];
    idx: number;
    /**
     *Creates an instance of InputDataEndpoint.
     * @param {string} [name='default endpoint name']
     * @param {(number | string)} [currentValue=0]
     * @param {string} [unit='unit']
     * @param {InputDataEndpointDataType} [dataType=InputDataEndpointDataType.Integer]
     * @param {InputDataEndpointType} [type=InputDataEndpointType.Other]
     * @param {string} [id=genUID('InputDataEndpoint')]
     * @param {string} [path='default endpoint path']
     * @memberof InputDataEndpoint
     */
    constructor(name?: string, currentValue?: number | string | boolean, unit?: string, dataType?: InputDataEndpointDataType, type?: InputDataEndpointType, id?: string, path?: string);
}
