import { InputDataEndpointGroup as idEndpointGroup } from 'spinal-model-bmsnetwork';
import { InputDataEndpoint } from './InputDataEndpoint';
/**
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} path
 * @property {InputDataEndpoint[]} children
 * @property {string} nodeTypeName equals SpinalBmsEndpointGroup.nodeTypeName
 * @export
 * @class InputDataEndpointGroup
 * @implements {idEndpointGroup}
 */
export declare class InputDataEndpointGroup implements idEndpointGroup {
    id: string;
    name: string;
    type: string;
    path: string;
    children: (InputDataEndpoint)[];
    nodeTypeName: string;
    /**
     *Creates an instance of InputDataEndpointGroup.
     * @param {string} [name='default EndpointGroup name']
     * @param {string} [type='default EndpointGroup type']
     * @param {string} [id=genUID('InputDataEndpointGroup')]
     * @param {string} [path='default EndpointGroup path']
     * @memberof InputDataEndpointGroup
     */
    constructor(name?: string, type?: string, id?: string, path?: string);
}
