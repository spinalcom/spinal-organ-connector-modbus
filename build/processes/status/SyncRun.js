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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SyncRunPull_1 = __importDefault(require("./SyncRunHandler/SyncRunPull"));
class SyncRun {
    graph;
    config;
    syncRunPull;
    nwService;
    constructor(graph, config, nwService) {
        this.graph = graph;
        this.config = config;
        this.nwService = nwService;
        this.syncRunPull = new SyncRunPull_1.default(graph, config, nwService);
    }
    async start() {
        console.log('start SyncRun');
        await this.syncRunPull.init();
        await this.syncRunPull.run();
        return 0;
    }
    stop() {
        console.log('stop SyncRun');
        this.syncRunPull.stop();
    }
}
exports.default = SyncRun;
//# sourceMappingURL=SyncRun.js.map