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
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class OrganConfigModel extends spinal_core_connectorjs_type_1.Model {
    digitalTwinPath;
    contextId;
    pullInterval;
    lastSync;
    restart;
    constructor() {
        super();
        this.add_attr('digitalTwinPath', '/__users__/admin/Digital twin VF');
        this.add_attr('contextId', '');
        this.add_attr('restart', false);
        this.add_attr('pullInterval', 5 * 60 * 1000);
        this.add_attr('lastSync', 0);
        this.add_attr('organStatus', 0);
    }
    updateSync() {
        this.lastSync.set(Date.now());
    }
    initEnv() {
        if (process?.env.DIGITALTWIN_PATH)
            this.digitalTwinPath.set(process.env.DIGITALTWIN_PATH);
        if (process?.env.PULL_INTERVAL)
            this.pullInterval.set(process.env.PULL_INTERVAL);
    }
    bindRestart() {
        this.restart.bind(() => {
            if (this.restart.get() === true) {
                console.log('Restart organ');
                process.exit(0);
            }
        });
    }
}
exports.default = OrganConfigModel;
spinal_core_connectorjs_type_1.spinalCore.register_models(OrganConfigModel);
//# sourceMappingURL=OrganConfigModel.js.map