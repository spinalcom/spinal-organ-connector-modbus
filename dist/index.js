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
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
require('json5/lib/register');
// get the config
const config = require('../config.json5');
const InputData_1 = require("./modules/InputData/InputData");
const NetworkProcess_1 = require("./modules/NetworkProcess");
// connection string to connect to spinalhub
const connectOpt = `http://${config.spinalConnector.user}:${config.spinalConnector.password}@${config.spinalConnector.host}:${config.spinalConnector.port}/`;
// initialize the connection
const conn = spinal_core_connectorjs_type_1.spinalCore.connect(connectOpt);
// get the Model from the spinalhub, "onLoadSuccess" and "onLoadError" are 2
// callback function.
spinal_core_connectorjs_type_1.spinalCore.load(conn, config.file.path, onLoadSuccess, onLoadError);
// called network error or file not found
function onLoadError() {
    console.log(`File does not exist in location ${config.file.path}`);
}
// called if connected to the server and if the spinalhub sent us the Model
function onLoadSuccess(forgeFile) {
    console.log('Connected to the server and got a the Entry Model');
    const inputData = new InputData_1.InputData();
    const networkProcess = new NetworkProcess_1.NetworkProcess(inputData);
    // reset data for test purpose
    // if (typeof forgeFile.graph !== 'undefined') forgeFile.rem_attr('graph');
    networkProcess.init(forgeFile, config.organ);
}
//# sourceMappingURL=index.js.map