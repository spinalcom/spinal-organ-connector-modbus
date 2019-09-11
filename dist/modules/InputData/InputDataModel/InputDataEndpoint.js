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
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const genUID_1 = require("../../../Utils/genUID");
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
class InputDataEndpoint {
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
    constructor(name = 'default endpoint name', currentValue = 0, unit = 'unit', dataType = spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, type = spinal_model_bmsnetwork_1.InputDataEndpointType.Other, id = genUID_1.genUID('InputDataEndpoint'), path = 'default endpoint path') {
        this.nodeTypeName = spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName;
        this.id = id;
        this.name = name;
        this.type = type;
        this.path = path;
        this.currentValue = currentValue;
        this.unit = unit;
        this.dataType = dataType;
        this.timeseries = [];
    }
}
exports.InputDataEndpoint = InputDataEndpoint;
//# sourceMappingURL=InputDataEndpoint.js.map