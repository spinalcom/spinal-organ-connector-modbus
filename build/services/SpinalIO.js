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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const configJson = require('../../config');
const ConfigFile_js_1 = __importDefault(require("spinal-lib-organ-monitoring/dist/classes/ConfigFile.js"));
class SpinalIO {
    static instance = null;
    config;
    conn;
    mapLoad;
    mapLoadPtr;
    constructor(config) {
        this.mapLoadPtr = new Map();
        this.mapLoad = new Map();
        if (!config) {
            this.config = require('../../config').spinalhub;
        }
        else {
            this.config = config;
        }
        let connectOpt = `${this.config.protocol}://${this.config.userID}:${this.config.userPassword}@${this.config.host}`;
        if (this.config.port)
            connectOpt += `:${this.config.port}/`;
        this.conn = spinal_core_connectorjs_type_1.spinalCore.connect(connectOpt);
        ConfigFile_js_1.default.init(this.conn, `${configJson.organ.name}`, config.host, config.protocol, parseInt(config.port));
    }
    static getInstance(config) {
        if (SpinalIO.instance !== null) {
            return SpinalIO.instance;
        }
        SpinalIO.instance = new SpinalIO(config);
        return SpinalIO.instance;
    }
    store(path, model) {
        const prom = new Promise((resolve, reject) => {
            spinal_core_connectorjs_type_1.spinalCore.store(this.conn, model, path, () => {
                resolve();
            }, () => {
                reject();
            });
        });
        return prom;
    }
    load(path) {
        console.log(`load : ${path}`);
        if (this.mapLoad.has(path) === true)
            return this.mapLoad.get(path);
        const prom = new Promise((resolve, reject) => {
            spinal_core_connectorjs_type_1.spinalCore.load(this.conn, path, (model) => {
                resolve(model);
            }, () => {
                this.mapLoad.delete(path);
                reject();
            });
        });
        this.mapLoad.set(path, prom);
        return prom;
    }
    loadModelPtr(model) {
        if (model instanceof spinal_core_connectorjs_type_1.File) {
            return this.loadModelPtr(model._ptr);
        }
        if (!(model instanceof spinal_core_connectorjs_type_1.Ptr)) {
            throw new Error('loadModelPtr must take Ptr as parameter');
        }
        if (!model.data.value && model.data.model) {
            return Promise.resolve(model.data.model);
        }
        if (!model.data.value) {
            throw new Error('Trying to load a Ptr to 0');
        }
        if (this.mapLoadPtr.has(model.data.value)) {
            return this.mapLoadPtr.get(model.data.value);
        }
        if (typeof spinal_core_connectorjs_type_1.FileSystem._objects[model.data.value] !== 'undefined') {
            const promise = Promise.resolve(spinal_core_connectorjs_type_1.FileSystem._objects[model.data.value]);
            this.mapLoadPtr.set(model.data.value, promise);
            return promise;
        }
        const promise = new Promise((resolve, reject) => {
            model.load((m) => {
                if (!m) {
                    this.mapLoadPtr.delete(model.data.value);
                    reject(new Error('Error in load Ptr'));
                }
                else {
                    resolve(m);
                }
            });
        });
        this.mapLoadPtr.set(model.data.value, promise);
        return promise;
    }
}
exports.default = SpinalIO;
//# sourceMappingURL=SpinalIO.js.map