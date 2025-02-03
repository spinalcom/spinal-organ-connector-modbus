"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEO_NODE_TYPES = exports.GEOGRAPHIC_TYPES = exports.GEO_RELATIONS = exports.GEO_FIND_EQUIPMENT = exports.GEO_FIND_ROOM = exports.GEO_FIND_FLOOR = exports.GEO_FIND_BUILDING = exports.GEO_REFERENCE_ROOM_RELATION = exports.GEO_EQUIPMENT_RELATION = exports.GEO_REFERENCE_TYPE = exports.GEO_EQUIPMENT_TYPE = exports.GEO_ROOM_TYPE = exports.GEO_ZONE_TYPE = exports.GEO_FLOOR_TYPE = exports.GEO_BUILDING_TYPE = exports.GEO_SITE_TYPE = exports.GEO_CONTEXT_TYPE = exports.SPINAL_TICKET_SERVICE_PROCESS_RELATION_NAME = exports.SPINAL_TICKET_SERVICE_TICKET_TYPE = exports.SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME = exports.SPINAL_TICKET_SERVICE_STEP_TYPE = exports.SPINAL_TICKET_SERVICE_STEP_RELATION_NAME = void 0;
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
const spinal_env_viewer_context_geographic_service_1 = __importDefault(require("spinal-env-viewer-context-geographic-service"));
var Constants_1 = require("spinal-service-ticket/dist/Constants");
Object.defineProperty(exports, "SPINAL_TICKET_SERVICE_STEP_RELATION_NAME", { enumerable: true, get: function () { return Constants_1.SPINAL_TICKET_SERVICE_STEP_RELATION_NAME; } });
Object.defineProperty(exports, "SPINAL_TICKET_SERVICE_STEP_TYPE", { enumerable: true, get: function () { return Constants_1.SPINAL_TICKET_SERVICE_STEP_TYPE; } });
Object.defineProperty(exports, "SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME", { enumerable: true, get: function () { return Constants_1.SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME; } });
Object.defineProperty(exports, "SPINAL_TICKET_SERVICE_TICKET_TYPE", { enumerable: true, get: function () { return Constants_1.SPINAL_TICKET_SERVICE_TICKET_TYPE; } });
Object.defineProperty(exports, "SPINAL_TICKET_SERVICE_PROCESS_RELATION_NAME", { enumerable: true, get: function () { return Constants_1.SPINAL_TICKET_SERVICE_PROCESS_RELATION_NAME; } });
const geoConstants = spinal_env_viewer_context_geographic_service_1.default.constants;
exports.GEO_CONTEXT_TYPE = geoConstants.CONTEXT_TYPE;
exports.GEO_SITE_TYPE = geoConstants.SITE_TYPE;
exports.GEO_BUILDING_TYPE = geoConstants.BUILDING_TYPE;
exports.GEO_FLOOR_TYPE = geoConstants.FLOOR_TYPE;
exports.GEO_ZONE_TYPE = geoConstants.ZONE_TYPE;
exports.GEO_ROOM_TYPE = geoConstants.ROOM_TYPE;
exports.GEO_EQUIPMENT_TYPE = geoConstants.EQUIPMENT_TYPE;
exports.GEO_REFERENCE_TYPE = geoConstants.REFERENCE_TYPE;
exports.GEO_EQUIPMENT_RELATION = geoConstants.EQUIPMENT_RELATION;
exports.GEO_REFERENCE_ROOM_RELATION = geoConstants.REFERENCE_RELATION + ".ROOM";
exports.GEO_FIND_BUILDING = [
    geoConstants.SITE_RELATION,
    geoConstants.BUILDING_RELATION,
    geoConstants.ZONE_RELATION,
];
exports.GEO_FIND_FLOOR = [
    geoConstants.ZONE_RELATION,
    geoConstants.FLOOR_RELATION,
];
exports.GEO_FIND_ROOM = [
    geoConstants.ZONE_RELATION,
    geoConstants.ROOM_RELATION,
];
exports.GEO_FIND_EQUIPMENT = [
    geoConstants.ZONE_RELATION,
    geoConstants.REFERENCE_RELATION,
    geoConstants.EQUIPMENT_RELATION,
    exports.GEO_REFERENCE_ROOM_RELATION
];
exports.GEO_RELATIONS = [
    geoConstants.SITE_RELATION,
    geoConstants.BUILDING_RELATION,
    geoConstants.FLOOR_RELATION,
    geoConstants.ROOM_RELATION,
    geoConstants.REFERENCE_RELATION,
    geoConstants.EQUIPMENT_RELATION,
    geoConstants.ZONE_RELATION,
    exports.GEO_REFERENCE_ROOM_RELATION
];
exports.GEOGRAPHIC_TYPES = geoConstants.GEOGRAPHIC_TYPES;
exports.GEO_NODE_TYPES = [
    exports.GEO_SITE_TYPE,
    exports.GEO_BUILDING_TYPE,
    exports.GEO_FLOOR_TYPE,
    exports.GEO_ZONE_TYPE,
    exports.GEO_ROOM_TYPE,
];
//# sourceMappingURL=constants.js.map