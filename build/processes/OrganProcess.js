"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganProcess = void 0;
const SpinalIO_1 = __importDefault(require("../services/SpinalIO"));
const OrganConfig_1 = __importDefault(require("./OrganConfig"));
const StandBy_1 = __importDefault(require("./status/StandBy"));
const SyncRun_1 = __importDefault(require("./status/SyncRun"));
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
class OrganProcess {
    config; // contains organ information
    graph; // instance of graph
    mapStatusHandler = new Map(); // gives info about current status of the organ
    nwService;
    constructor() {
        this.nwService = new spinal_model_bmsnetwork_1.NetworkService(true);
    }
    /**
     * Get organ config from spinalhub.
     * Throws error if config not accessible for whathever reason.
     * Else Initialize organ process (0: StandBy, 1: SyncProcess, 2: SyncRun, 3: SyncSpatial, 4: SyncEquip)
     * @memberof OrganProcess
     */
    async init() {
        const organConfig = OrganConfig_1.default.getInstance();
        this.config = await organConfig.getConfig();
        const spinalIO = SpinalIO_1.default.getInstance();
        try {
            this.graph = await spinalIO.load(this.config.digitalTwinPath.get());
            await this.nwService.init(this.graph, { contextName: process.env.NETWORK_CONTEXT_NAME, contextType: "ModbusNetwork", networkName: process.env.VIRTUAL_NETWORK_NAME, networkType: "NetworkVirtual" });
        }
        catch (e) {
            console.error('Imposible to load the graph,', this.config.digitalTwinPath.get());
        }
        this.mapStatusHandler.set(0, new StandBy_1.default());
        this.mapStatusHandler.set(3, new SyncRun_1.default(this.graph, this.config, this.nwService));
    }
    /**
     * Run organ process
     *
     * @memberof OrganProcess
     */
    run() {
        let currentHandler = null;
        this.config.organStatus.bind(async () => {
            const currStatus = this.config.organStatus.get();
            console.log('current status', currStatus);
            if (currentHandler !== null) {
                await currentHandler.stop();
            }
            if (this.mapStatusHandler.has(currStatus)) {
                const handler = this.mapStatusHandler.get(currStatus);
                currentHandler = handler;
                await handler.start();
                if (process.env.MODBUS_STUDIO_PLUGIN_CONTROL === '0') {
                    this.config.organStatus.set(3);
                }
                currentHandler = null;
            }
        }, true);
    }
}
exports.OrganProcess = OrganProcess;
//# sourceMappingURL=OrganProcess.js.map