import { InputDataEndpoint } from './InputDataEndpoint';
import { InputDataEndpointGroup } from './InputDataEndpointGroup';
import { InputDataDevice as idDevice } from 'spinal-model-bmsnetwork';
/**
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} path
 * @property {Array<InputDataDevice|InputDataEndpoint|InputDataEndpointGroup>} children
 * @property {string} nodeTypeName equals SpinalBmsDevice.nodeTypeName
 * @export
 * @class InputDataDevice
 * @implements {idDevice}
 */
export declare class InputDataDevice implements idDevice {
    id: string;
    name: string;
    type: string;
    path: string;
    children: (InputDataDevice | InputDataEndpoint | InputDataEndpointGroup)[];
    nodeTypeName: string;
    /**
     *Creates an instance of InputDataDevice.
     * @param {string} [name='default device name']
     * @param {string} [type='default device type']
     * @param {string} [id=genUID('InputDataDevice')]
     * @param {string} [path='default device path']
     * @memberof InputDataDevice
     */
    constructor(name?: string, type?: string, id?: string, path?: string);
}
