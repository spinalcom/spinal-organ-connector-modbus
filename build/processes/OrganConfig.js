"use strict";
/*
 * Copyright 2021 SpinalCom - www.spinalcom.com
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SpinalIO_1 = __importDefault(require("../services/SpinalIO"));
const config = __importStar(require("../../config"));
const path_1 = require("path");
const OrganConfigModel_1 = __importDefault(require("../model/OrganConfigModel"));
class OrganConfig {
    static instance = null;
    constructor() { }
    // if 
    static getInstance() {
        if (OrganConfig.instance !== null)
            return OrganConfig.instance;
        OrganConfig.instance = new OrganConfig();
        return OrganConfig.instance;
    }
    async getConfig() {
        const spinalIO = SpinalIO_1.default.getInstance(config.spinalhub);
        const loadPath = (0, path_1.resolve)(config.organ.configPath, config.organ.name);
        let cfg;
        try {
            cfg = await spinalIO.load(loadPath);
        }
        catch (e) {
            console.log('Config not found, therefore creating...');
            cfg = new OrganConfigModel_1.default();
            console.log('Created...');
            console.log('Initiating with environment variables...');
            cfg.initEnv();
            console.log('Initiated with environment variables...');
            await spinalIO.store(loadPath, cfg);
        }
        cfg.restart.set(false);
        cfg.bindRestart();
        return cfg;
    }
}
exports.default = OrganConfig;
//# sourceMappingURL=OrganConfig.js.map