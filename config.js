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

module.exports = {
  spinalhub: {
    protocol: process.env.SPINALHUB_PROTOCOL || "http",
    host: process.env.SPINALHUB_IP || "127.0.0.1",
    port: process.env.SPINALHUB_PORT || 0,
    userID: process.env.SPINAL_USER_ID || 0,
    userPassword: process.env.SPINAL_PASSWORD || ""
  },
  organ: {
    name: process.env.SPINAL_ORGAN_NAME || "Organ modbus",
    configPath: process.env.SPINAL_CONFIG_PATH || "/etc/Organs/modbus"
  }
};
