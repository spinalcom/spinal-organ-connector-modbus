"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncRunPull = void 0;
const fs = require("fs");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const InputDataModel_1 = require("../../../model/InputData/InputDataModel/InputDataModel");
const spinal_model_timeseries_1 = require("spinal-model-timeseries");
const modbus_serial_1 = __importDefault(require("modbus-serial"));
const xlsx_1 = __importDefault(require("xlsx"));
class ModbusConnectionWrapper {
    modbusClient;
    // This promise chain ensures operations execute one after the other.
    queue = Promise.resolve();
    ip;
    port;
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.modbusClient = new modbus_serial_1.default();
    }
    async connect() {
        if (!this.modbusClient.isOpen) {
            await this.modbusClient.connectTCP(this.ip, { port: this.port });
        }
    }
    /**
     * Queues an operation. Before running the operation, ensure the connection is open
     * and set the slave ID (busAddress).
     */
    async execute(busAddress, operation) {
        return (this.queue = this.queue.then(async () => {
            await this.connect();
            this.modbusClient.setID(busAddress);
            const result = await operation(this.modbusClient);
            return result;
        }));
    }
    close() {
        if (this.modbusClient.isOpen) {
            this.modbusClient.close(() => {
                console.log('Closing Modbus connection :' + this.ip + ':' + this.port);
            });
        }
    }
}
class ModbusConnectionManager {
    // We use a key of "ip:port" to store each persistent connection.
    connections = new Map();
    getKey(ip, port) {
        return `${ip}:${port}`;
    }
    async getConnection(ip, port) {
        const key = this.getKey(ip, port);
        if (!this.connections.has(key)) {
            const wrapper = new ModbusConnectionWrapper(ip, port);
            this.connections.set(key, wrapper);
        }
        return this.connections.get(key);
    }
    closeAll() {
        for (const wrapper of this.connections.values()) {
            wrapper.close();
        }
        this.connections.clear();
    }
}
/**
 * Main purpose of this class is to pull tickets from client.
 *
 * @export
 * @class SyncRunPull
 */
class SyncRunPull {
    graph;
    config;
    interval;
    running;
    foundElevators;
    nwService;
    timeseriesService;
    modbusClient;
    networkContext;
    modbusConfig;
    updatingData = false;
    skipFirst;
    bindInitialized = false;
    enpointPreviousValues = {};
    connectionManager = new ModbusConnectionManager();
    constructor(graph, config, nwService) {
        this.graph = graph;
        this.config = config;
        this.running = false;
        this.nwService = nwService;
        this.timeseriesService = new spinal_model_timeseries_1.SpinalServiceTimeseries();
        this.modbusClient = new modbus_serial_1.default();
        this.updatingData = false;
        this.skipFirst = true;
        this.enpointPreviousValues = {};
    }
    getHost() {
        let http;
        let hubUri;
        if (process.env.SPINALHUB_PROTOCOL === 'https') {
            http = require('https');
            hubUri = `https://${process.env.SPINALHUB_IP}`;
        }
        else {
            http = require('http');
            hubUri = `http://${process.env.SPINALHUB_IP}`;
        }
        if (process.env.SPINALHUB_PORT) {
            hubUri = `${hubUri}:${process.env.SPINALHUB_PORT}`;
        }
        return { http, hubUri };
    }
    registerValuesToUintX(input, isUnsigned = false) {
        if (input.length < 1)
            throw new Error('Input array must have at least 1 element');
        // Create a buffer large enough to hold all the 16-bit values
        const buffer = new ArrayBuffer(input.length * 2); // Each register is 2 bytes
        const view = new DataView(buffer);
        // Write each 16-bit value into the buffer sequentially
        input.forEach((value, index) => {
            view.setUint16(index * 2, value); // Each register occupies 2 bytes
        });
        // If the size is 2 or less, return as a 32-bit number
        if (input.length <= 2) {
            return isUnsigned ? view.getUint32(0) : view.getInt32(0);
        }
        // For sizes > 2, combine into a BigInt
        let result = BigInt(0);
        for (let i = 0; i < input.length; i++) {
            const value = BigInt(view.getUint16(i * 2)); // Treat each 16-bit as unsigned
            result = (result << BigInt(16)) | value; // Shift left and OR to combine
        }
        return result;
    }
    /**
     * Converts a number or bigint into an array of 16-bit registers.
     *
     * @param value - The numeric value (can be number or bigint).
     * @param size - How many 16-bit registers we need to fill.
     * @param isUnsigned - Whether we treat value as unsigned or signed.
     */
    uintXToRegisterValues(value, size, isUnsigned) {
        let bigVal = BigInt(value);
        // If it's signed and negative, perform 2's complement based on total bits = 16 * size
        if (!isUnsigned && typeof value === 'number' && value < 0) {
            const bitCount = BigInt(size * 16);
            // (2^bitCount + bigVal) & (2^bitCount - 1) => two's complement
            bigVal =
                ((BigInt(1) << bitCount) + bigVal) &
                    ((BigInt(1) << bitCount) - BigInt(1));
        }
        const registers = new Array(size).fill(0);
        // Big-endian approach:
        // If reading uses "for (i=0; i < array.length; i++){ result = (result << 16) | array[i]; }"
        // then array[0] is the high register. Let’s do the same here in reverse.
        for (let i = 0; i < size; i++) {
            const shift = BigInt((size - 1 - i) * 16);
            const mask = BigInt(0xffff) << shift;
            const registerVal = (bigVal & mask) >> shift;
            registers[i] = Number(registerVal & BigInt(0xffff));
        }
        return registers;
    }
    parseExcelToModbusConfig(filePath) {
        const workbook = xlsx_1.default.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx_1.default.utils.sheet_to_json(worksheet);
        const devices = [];
        jsonData.forEach((row) => {
            const deviceName = row['Device Name'];
            const existingDevice = devices.find((d) => d.name === deviceName);
            const dataPoint = {
                name: row['Data Point Name'],
                type: row['Type'],
                bus_address: parseInt(row['Bus Address']),
                address: parseInt(row['Address']),
                size: row['Size'] ? parseInt(row['Size']) : undefined,
                isUnsigned: row['Is Unsigned']?.toLowerCase() === 'true',
                isCommand: row['Is Command']?.toLowerCase() === 'true',
            };
            if (existingDevice) {
                existingDevice.dataPoints.push(dataPoint);
            }
            else {
                devices.push({
                    name: deviceName,
                    ip: row['IP Address'],
                    port: parseInt(row['Port']),
                    dataPoints: [dataPoint],
                });
            }
        });
        return devices;
    }
    async createDevice(deviceName) {
        const deviceNodeModel = new InputDataModel_1.InputDataDevice(deviceName, 'device');
        await this.nwService.updateData(deviceNodeModel);
        console.log('Created device ', deviceName);
    }
    async initNetworkContext() {
        const contexts = await this.graph.getChildren();
        for (const context of contexts) {
            if (this.config.contextId &&
                context.getId().get() === this.config.contextId.get()) {
                console.log('Found context using organ config');
                // @ts-ignore
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(context);
                this.networkContext = context;
                return;
            }
            if (context.info.name.get() === process.env.NETWORK_CONTEXT_NAME) {
                console.log('Found context using NETWORK_CONTEXT_NAME env variable');
                // @ts-ignore
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(context);
                this.networkContext = context;
                return;
            }
        }
        throw new Error('Network Context Not found');
    }
    async initModbusConfiguration() {
        let modbusConfig;
        if (process.env.MODBUS_STUDIO_PLUGIN_CONTROL === '1') {
            // Get file from context
            const filesNodes = await this.networkContext.getChildren('hasFiles');
            if (filesNodes.length === 0) {
                throw new Error('No file found in network context');
            }
            const directory = await filesNodes[0].getElement();
            const fileExtension = directory[0].name.get().split('.')[1];
            const server_id = directory[0]._ptr.data.value;
            const { http, hubUri } = this.getHost();
            const url = `${hubUri}/sceen/_?u=${server_id}`;
            const filePath = './modbus_config.' + fileExtension; // Save the downloaded file locally
            await this.downloadFile(http, url, filePath);
            if (filePath.endsWith('.json')) {
                const rawData = fs.readFileSync(filePath, 'utf8');
                modbusConfig = JSON.parse(rawData);
            }
            else if (filePath.endsWith('.xlsx')) {
                modbusConfig = this.parseExcelToModbusConfig(filePath);
            }
            else {
                throw new Error('Unsupported file format. Only JSON and Excel files are supported.');
            }
        }
        else {
            try {
                modbusConfig = this.parseExcelToModbusConfig('modbus_config.xlsx');
            }
            catch (e) {
                console.log('No xlsx config found in the directory');
            }
            try {
                const rawData = fs.readFileSync('modbus_config.json', 'utf8');
                modbusConfig = JSON.parse(rawData);
            }
            catch (e) {
                console.log('No json config found in the directory');
            }
        }
        this.modbusConfig = modbusConfig;
    }
    downloadFile(http, url, destination) {
        console.log('Downloading file from:', url);
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destination);
            http
                .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to get file: ${response.statusCode} - ${response.statusMessage}`));
                    return;
                }
                // Pipe the response data into the file
                response.pipe(file);
                // Handle the 'finish' event to resolve the promise
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
                // Handle file errors
                file.on('error', (err) => {
                    fs.unlink(destination, () => reject(err)); // Clean up the file on error
                });
            })
                .on('error', (err) => {
                fs.unlink(destination, () => reject(err)); // Handle connection errors
            });
        });
    }
    waitFct(nb) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, nb >= 0 ? nb : 0);
        });
    }
    async createEndpoint(deviceId, endpointName, initialValue) {
        const context = this.networkContext;
        const endpointNodeModel = new InputDataModel_1.InputDataEndpoint(endpointName, initialValue, '', InputDataModel_1.InputDataEndpointDataType.Real, InputDataModel_1.InputDataEndpointType.Other);
        const res = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(endpointNodeModel.name, endpointNodeModel.path, endpointNodeModel.currentValue, endpointNodeModel.unit, InputDataModel_1.InputDataEndpointDataType[endpointNodeModel.dataType], InputDataModel_1.InputDataEndpointType[endpointNodeModel.type], endpointNodeModel.id);
        const childId = spinal_env_viewer_graph_service_1.SpinalGraphService.createNode({ type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName, name: endpointNodeModel.name }, res);
        await spinal_env_viewer_graph_service_1.SpinalGraphService.addChildInContext(deviceId, childId, context.getId().get(), spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_env_viewer_graph_service_1.SPINAL_RELATION_PTR_LST_TYPE);
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(childId);
        //await this.addEndpointAttributes(node,measure);
        return node;
    }
    /*async sendWriteRequest(
      newValue: number | bigint,
      dataType: string,
      dataAddress: number,
      ip: string,
      port: number,
      busAddress: number,
      size: number = 1,
      isUnsigned: boolean = false
    ): Promise<boolean> {
      try {
        await this.modbusClient.connectTCP(ip, { port });
        console.log(
          `Connected to ${ip}:${port} success:`,
          this.modbusClient.isOpen
        );
        this.modbusClient.setID(busAddress);
  
        switch (dataType) {
          case 'holding_register':
            if (size > 1) {
              // Convert the newValue into an array of 16-bit registers
              const regsData = this.uintXToRegisterValues(
                newValue,
                size,
                isUnsigned
              );
              await this.modbusClient.writeRegisters(dataAddress, regsData);
            } else {
              // Single register
              await this.modbusClient.writeRegisters(dataAddress, [
                Number(newValue),
              ]);
            }
            break;
  
          case 'coil':
            // Coils are 1 bit, so a single write is enough
            await this.modbusClient.writeCoil(dataAddress, Boolean(newValue));
            break;
  
          default:
            console.error('Unsupported command data point type:', dataType);
            break;
        }
  
        // Close connection
        this.modbusClient.close(() => {
          console.log('Closing Modbus connection.');
        });
        return true;
      } catch (e) {
        console.error('Failed to write to modbus server:', e);
        return false;
      }
    }*/
    /*async updateData() {
      this.updatingData = true;
      for (const device of this.modbusConfig) {
        await this.modbusClient.connectTCP(device.ip, { port: device.port });
        console.log(
          'Connected to',
          device.ip,
          ':',
          device.port,
          'success:',
          this.modbusClient.isOpen
        );
        let devices = await this.networkContext.findInContext(
          this.networkContext,
          (node) => node.info.name.get() === device.name
        );
        if (devices.length === 0) {
          console.log('Device does not exist, creating...', device.name);
          await this.createDevice(device.name);
          devices = await this.networkContext.findInContext(
            this.networkContext,
            (node) => node.info.name.get() === device.name
          );
        }
        const deviceNode = devices[0];
        // @ts-ignore
        SpinalGraphService._addNode(deviceNode);
  
        const endpointNodes = await deviceNode.getChildren('hasBmsEndpoint');
  
        for (const dataPoint of device.dataPoints) {
          let endpointNode = endpointNodes.find(
            (node) => node.info.name.get() === dataPoint.name
          );
          if (!endpointNode) {
            // Create new endpoint
            console.log(
              'Endpoint do not exist, creating new endpoint... ',
              dataPoint.name
            );
            endpointNode = await this.createEndpoint(
              deviceNode.getId().get(),
              dataPoint.name,
              0
            );
            SpinalGraphService._addNode(endpointNode);
            await this.nwService.setEndpointValue(endpointNode.info.id.get(), 0);
            await this.timeseriesService.pushFromEndpoint(
              endpointNode.info.id.get(),
              0
            );
  
            const realNode = SpinalGraphService.getRealNode(
              endpointNode.getId().get()
            );
            await attributeService.updateAttribute(
              realNode,
              'default',
              'timeSeries maxDay',
              { value: '366' }
            );
          }
          SpinalGraphService._addNode(endpointNode);
  
          this.modbusClient.setID(dataPoint.bus_address);
          let result;
          switch (dataPoint.type) {
            case 'holding_register':
              const registerData = await this.modbusClient.readHoldingRegisters(
                dataPoint.address,
                dataPoint.size || 1
              );
              result =
                dataPoint.size > 2
                  ? this.registerValuesToUintX(
                      registerData.data,
                      dataPoint.isUnsigned
                    )
                  : dataPoint.size === 2
                  ? this.registerValuesToUintX(
                      registerData.data,
                      dataPoint.isUnsigned
                    )
                  : dataPoint.isUnsigned
                  ? registerData.data[0] // Treat as unsigned 16-bit
                  : ((registerData.data[0] & 0xffff) << 16) >> 16; // Convert to signed
              break;
  
            case 'input_register':
              const inputRegisterData =
                await this.modbusClient.readInputRegisters(
                  dataPoint.address,
                  dataPoint.size || 1
                );
              result =
                dataPoint.size > 2
                  ? this.registerValuesToUintX(
                      inputRegisterData.data,
                      dataPoint.isUnsigned
                    )
                  : dataPoint.size === 2
                  ? this.registerValuesToUintX(
                      inputRegisterData.data,
                      dataPoint.isUnsigned
                    )
                  : dataPoint.isUnsigned
                  ? inputRegisterData.data[0]
                  : ((inputRegisterData.data[0] & 0xffff) << 16) >> 16;
              break;
  
            case 'coil':
              const coilData = await this.modbusClient.readCoils(
                dataPoint.address,
                1
              );
              result = coilData.data[0] ? 1 : 0; // Coils are boolean
              break;
  
            case 'discrete_input':
              const discreteInputData =
                await this.modbusClient.readDiscreteInputs(dataPoint.address, 1);
              result = discreteInputData.data[0] ? 1 : 0; // Discrete inputs are boolean
              break;
  
            default:
              console.error('Unsupported data point type:', dataPoint.type);
              continue;
          }
          await this.nwService.setEndpointValue(
            endpointNode.info.id.get(),
            result
          );
          await this.timeseriesService.pushFromEndpoint(
            endpointNode.info.id.get(),
            result
          );
          if (!this.enpointPreviousValues[endpointNode.info.id.get()]) {
            this.enpointPreviousValues[endpointNode.info.id.get()] = result;
          } else {
            this.enpointPreviousValues[endpointNode.info.id.get()] = result;
          }
  
          console.log(
            `Updated endpoint ${dataPoint.name} with value:`,
            result,
            ' unsigned :',
            dataPoint.isUnsigned
          );
        }
        this.modbusClient.close(() => {
          console.log('Closing Modbus connection.');
        });
  
        this.updatingData = false;
      }
    }*/
    async updateData() {
        this.updatingData = true;
        for (const device of this.modbusConfig) {
            // Get a persistent connection for this device.
            const connection = await this.connectionManager.getConnection(device.ip, device.port);
            let devices = await this.networkContext.findInContext(this.networkContext, (node) => node.info.name.get() === device.name);
            if (devices.length === 0) {
                console.log('Device does not exist, creating...', device.name);
                await this.createDevice(device.name);
                devices = await this.networkContext.findInContext(this.networkContext, (node) => node.info.name.get() === device.name);
            }
            const deviceNode = devices[0];
            // @ts-ignore
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(deviceNode);
            const endpointNodes = await deviceNode.getChildren('hasBmsEndpoint');
            for (const dataPoint of device.dataPoints) {
                let endpointNode = endpointNodes.find((node) => node.info.name.get() === dataPoint.name);
                if (!endpointNode) {
                    console.log('Endpoint does not exist, creating new endpoint... ', dataPoint.name);
                    endpointNode = await this.createEndpoint(deviceNode.getId().get(), dataPoint.name, 0);
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpointNode);
                    await this.nwService.setEndpointValue(endpointNode.info.id.get(), 0);
                    await this.timeseriesService.pushFromEndpoint(endpointNode.info.id.get(), 0);
                    const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointNode.getId().get());
                    await spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(realNode, 'default', 'timeSeries maxDay', { value: '366' });
                }
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpointNode);
                // Queue the read operation
                await connection.execute(dataPoint.bus_address, async (client) => {
                    let result;
                    switch (dataPoint.type) {
                        case 'holding_register': {
                            const registerData = await client.readHoldingRegisters(dataPoint.address, dataPoint.size || 1);
                            result =
                                dataPoint.size > 2
                                    ? this.registerValuesToUintX(registerData.data, dataPoint.isUnsigned)
                                    : dataPoint.size === 2
                                        ? this.registerValuesToUintX(registerData.data, dataPoint.isUnsigned)
                                        : dataPoint.isUnsigned
                                            ? registerData.data[0]
                                            : ((registerData.data[0] & 0xffff) << 16) >> 16;
                            break;
                        }
                        case 'input_register': {
                            const inputRegisterData = await client.readInputRegisters(dataPoint.address, dataPoint.size || 1);
                            result =
                                dataPoint.size > 2
                                    ? this.registerValuesToUintX(inputRegisterData.data, dataPoint.isUnsigned)
                                    : dataPoint.size === 2
                                        ? this.registerValuesToUintX(inputRegisterData.data, dataPoint.isUnsigned)
                                        : dataPoint.isUnsigned
                                            ? inputRegisterData.data[0]
                                            : ((inputRegisterData.data[0] & 0xffff) << 16) >> 16;
                            break;
                        }
                        case 'coil': {
                            const coilData = await client.readCoils(dataPoint.address, 1);
                            result = coilData.data[0] ? 1 : 0;
                            break;
                        }
                        case 'discrete_input': {
                            const discreteInputData = await client.readDiscreteInputs(dataPoint.address, 1);
                            result = discreteInputData.data[0] ? 1 : 0;
                            break;
                        }
                        default:
                            console.error('Unsupported data point type:', dataPoint.type);
                            return;
                    }
                    await this.nwService.setEndpointValue(endpointNode.info.id.get(), result);
                    await this.timeseriesService.pushFromEndpoint(endpointNode.info.id.get(), result);
                    this.enpointPreviousValues[endpointNode.info.id.get()] = result;
                    console.log(`Updated endpoint ${dataPoint.name} with value:`, result, ' unsigned:', dataPoint.isUnsigned);
                });
            }
        }
        this.updatingData = false;
    }
    async sendWriteRequest(newValue, dataType, dataAddress, ip, port, busAddress, size = 1, isUnsigned = false) {
        try {
            // Get (or create) a persistent connection for this device.
            const connection = await this.connectionManager.getConnection(ip, port);
            // Queue the write operation. The execute method will set the correct bus address,
            // perform the operation, and ensure no other operation runs concurrently.
            await connection.execute(busAddress, async (client) => {
                switch (dataType) {
                    case 'holding_register':
                        if (size > 1) {
                            const regsData = this.uintXToRegisterValues(newValue, size, isUnsigned);
                            await client.writeRegisters(dataAddress, regsData);
                        }
                        else {
                            await client.writeRegisters(dataAddress, [Number(newValue)]);
                        }
                        break;
                    case 'coil':
                        await client.writeCoil(dataAddress, Boolean(newValue));
                        break;
                    default:
                        console.error('Unsupported command data point type:', dataType);
                        break;
                }
            });
            return true;
        }
        catch (e) {
            console.error('Failed to write to modbus server:', e);
            return false;
        }
    }
    async initValueBinds() {
        console.log('Initiating value binds...');
        for (const device of this.modbusConfig) {
            const deviceNode = await this.networkContext.findOneInContext(this.networkContext, (node) => node.info.name.get() === device.name);
            if (!deviceNode) {
                console.warn('Device not found:', device.name);
                continue;
            }
            // @ts-ignore
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(deviceNode);
            const endpointNodes = await deviceNode.getChildren('hasBmsEndpoint');
            for (const dataPoint of device.dataPoints) {
                let endpointNode = endpointNodes.find((node) => node.info.name.get() === dataPoint.name);
                if (!endpointNode) {
                    console.warn('Endpoint not found:', dataPoint.name);
                    continue;
                }
                // Add to GraphService so we can get RealNode from id
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpointNode);
                // Load value model
                const valueModel = (await endpointNode.element.load()).currentValue;
                // Only bind if it's a command type
                if (dataPoint.isCommand) {
                    valueModel.bind(async () => {
                        // Avoid writing if we are in the middle of an update, skipping first cycle, or value hasn’t changed
                        if (this.updatingData ||
                            this.skipFirst ||
                            this.enpointPreviousValues[endpointNode.info.id.get()] ===
                                valueModel.get()) {
                            return;
                        }
                        console.log('Command value changed to:', valueModel.get(), 'from:', this.enpointPreviousValues[endpointNode.info.id.get()]);
                        try {
                            await this.sendWriteRequest(valueModel.get(), dataPoint.type, dataPoint.address, device.ip, device.port, dataPoint.bus_address, dataPoint.size || 1, dataPoint.isUnsigned);
                            // Update local stored value
                            this.enpointPreviousValues[endpointNode.info.id.get()] =
                                valueModel.get();
                        }
                        catch (e) {
                            console.error('Failed to write to modbus server:', e);
                        }
                    });
                }
            }
        }
    }
    async createDataPointsFromConfig() {
        for (const device of this.modbusConfig) {
            let deviceNode = await this.networkContext.findOneInContext(this.networkContext, (node) => node.info.name.get() === device.name);
            if (!deviceNode) {
                console.log('Device does not exist, creating...', device.name);
                await this.createDevice(device.name);
                deviceNode = await this.networkContext.findOneInContext(this.networkContext, (node) => node.info.name.get() === device.name);
            }
            // @ts-ignore
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(deviceNode);
            const endpointNodes = await deviceNode.getChildren('hasBmsEndpoint');
            for (const dataPoint of device.dataPoints) {
                let endpointNode = endpointNodes.find((node) => node.info.name.get() === dataPoint.name);
                if (!endpointNode) {
                    // Create new endpoint
                    console.log('Endpoint do not exist, creating new endpoint... ', dataPoint.name);
                    endpointNode = await this.createEndpoint(deviceNode.getId().get(), dataPoint.name, 0);
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpointNode);
                    await this.nwService.setEndpointValue(endpointNode.info.id.get(), 0);
                    await this.timeseriesService.pushFromEndpoint(endpointNode.info.id.get(), 0);
                    const realNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointNode.getId().get());
                    await spinal_env_viewer_plugin_documentation_service_1.attributeService.updateAttribute(realNode, 'default', 'timeSeries maxDay', { value: '366' });
                }
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(endpointNode);
            }
        }
    }
    async init() {
        console.log('Initiating SyncRunPull');
        try {
            await this.initNetworkContext();
            await this.initModbusConfiguration();
            await this.createDataPointsFromConfig();
            if (!this.bindInitialized) { // Only init value binds once ( when class is instantiated for the first time)
                await this.initValueBinds();
            }
            this.bindInitialized = true;
            console.log('Init Done');
            // await this.updateData();
            this.config.lastSync.set(Date.now());
        }
        catch (e) {
            console.error(e);
        }
    }
    async run() {
        this.running = true;
        while (true) {
            if (!this.running)
                break;
            const before = Date.now();
            try {
                const time = new Date().toString().split('GMT')[0];
                console.log('Updating endpoints at ', time, ' ...');
                await this.updateData();
                console.log('... Data Updated !');
                if (this.skipFirst) {
                    this.skipFirst = false;
                    console.log('******Skip first round over, command is now active******');
                }
            }
            catch (e) {
                console.error(e);
                await this.waitFct(1000 * 60);
            }
            finally {
                const delta = Date.now() - before;
                const timeout = parseInt(process.env.PULL_INTERVAL) - delta;
                await this.waitFct(timeout);
            }
        }
    }
    stop() {
        this.running = false;
    }
}
exports.SyncRunPull = SyncRunPull;
exports.default = SyncRunPull;
//# sourceMappingURL=SyncRunPull.js.map