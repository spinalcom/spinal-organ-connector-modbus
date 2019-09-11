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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
/**
 *
 *
 * @export
 * @class NetworkProcess
 */
class NetworkProcess {
    /**
     *Creates an instance of NetworkProcess.
     * @param {InputData} inputData
     * @memberof NetworkProcess
     */
    constructor(inputData) {
        this.inputData = inputData;
        this.nwService = new spinal_model_bmsnetwork_1.NetworkService();
        this.nwService.setupDelay(60000);
    }
    /**
     *
     *
     * @param {ForgeFileItem} forgeFile
     * @param {ConfigOrgan} configOrgan
     * @returns {Promise<void>}
     * @memberof NetworkProcess
     */
    init(forgeFile, configOrgan) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.nwService.init(forgeFile, configOrgan);
            this.inputData.setOnDataCBFunc(this.updateData.bind(this));
        });
    }
    /**
     *
     *
     * @param {InputDataDevice} obj
     * @memberof NetworkProcess
     */
    updateData(obj) {
        console.log('Update data device ! => ', obj.name);
        this.nwService.updateData.call(this.nwService, obj);
    }
}
exports.NetworkProcess = NetworkProcess;
//# sourceMappingURL=NetworkProcess.js.map