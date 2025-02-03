"use strict";
/*
 * Copyright 2018 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputDataDevice = void 0;
const genUID_1 = require("../../../utils/genUID");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
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
class InputDataDevice {
    id;
    name;
    type;
    path;
    children;
    nodeTypeName;
    /**
     *Creates an instance of InputDataDevice.
     * @param {string} [name='default device name']
     * @param {string} [type='default device type']
     * @param {string} [id=genUID('InputDataDevice')]
     * @param {string} [path='default device path']
     * @memberof InputDataDevice
     */
    constructor(name = 'default device name', type = 'default device type', id = (0, genUID_1.genUID)('InputDataDevice'), path = 'default device path') {
        this.nodeTypeName = spinal_model_bmsnetwork_1.SpinalBmsDevice.nodeTypeName;
        this.id = id;
        this.name = name;
        this.type = type;
        this.path = path;
        this.children = [];
    }
}
exports.InputDataDevice = InputDataDevice;
//# sourceMappingURL=InputDataDevice.js.map