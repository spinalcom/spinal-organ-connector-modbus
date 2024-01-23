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

import moment = require('moment');
import fs = require('fs');
import {
  SpinalContext,
  SpinalGraph,
  SpinalGraphService,
  SpinalNode,
  SpinalNodeRef,
  SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinal-env-viewer-graph-service';
import { spinalServiceTicket } from 'spinal-service-ticket';
import {
  SPINAL_TICKET_SERVICE_STEP_RELATION_NAME,
  SPINAL_TICKET_SERVICE_STEP_TYPE,
  SPINAL_TICKET_SERVICE_TICKET_RELATION_NAME,
  SPINAL_TICKET_SERVICE_PROCESS_RELATION_NAME,
  SPINAL_TICKET_SERVICE_TICKET_TYPE,
} from '../../../constants';
import type OrganConfigModel from '../../../model/OrganConfigModel';
import { attributeService } from 'spinal-env-viewer-plugin-documentation-service';
import { NetworkService } from 'spinal-model-bmsnetwork';
import {
  InputDataDevice,
  InputDataEndpoint,
  InputDataEndpointGroup,
  InputDataEndpointDataType,
  InputDataEndpointType,
} from '../../../model/InputData/InputDataModel/InputDataModel';
import { SpinalServiceTimeseries } from 'spinal-model-timeseries';
//const ModbusRTU = require("modbus-serial");
import ModbusRTU from 'modbus-serial';
//import jsonData from './GIENAH_deviceEndpoints.json'

interface ModbusDevice {
  name: string;
  ip: string;
  port: number;
  registers: {
      name: string;
      type: string;
      bus_address:number;
      register_address: number;
      size: number;
  }[];
}



/**
 * Main purpose of this class is to pull tickets from client.
 *
 * @export
 * @class SyncRunPull
 */
export class SyncRunPull {
  graph: SpinalGraph<any>;
  config: OrganConfigModel;
  interval: number;
  running: boolean;
  foundElevators: string[];
  nwService: NetworkService;
  timeseriesService: SpinalServiceTimeseries;
  modbusClient: ModbusRTU;


  constructor(
    graph: SpinalGraph<any>,
    config: OrganConfigModel,
    nwService: NetworkService
  ) {
    this.graph = graph;
    this.config = config;
    this.running = false;
    this.nwService = nwService;
    this.timeseriesService = new SpinalServiceTimeseries();
    this.modbusClient = new ModbusRTU();
  }

  bytesToDecimal(bytes: number[]): number {
    if (bytes.length !== 2) {
      throw new Error("Array must contain exactly two elements.");
    }
  
    const [byte1, byte2] = bytes;
    return (byte1 << 16) | byte2;
  }
  async getContext(): Promise<SpinalNode<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.id.get() === this.config.ticketContextId.get()) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    throw new Error('Context Not found');
  }

  async getSpinalGeo(): Promise<SpinalContext<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.id.get() === this.config.spatialContextId?.get()) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    const context = await this.graph.getContext('spatial');
    if (!context) throw new Error('Context Not found');
    return context;
  }

  async getNetworkContext(): Promise<SpinalNode<any>> {
    const contexts = await this.graph.getChildren();
    for (const context of contexts) {
      if (context.info.name.get() === process.env.NETWORK_CONTEXT_NAME) {
        // @ts-ignore
        SpinalGraphService._addNode(context);
        return context;
      }
    }
    throw new Error('Network Context Not found');
  }

  private waitFct(nb: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve();
        },
        nb >= 0 ? nb : 0
      );
    });
  }

  /**
   * Initialize the context (fill the SpinalGraphService)
   *
   * @return {*}  {Promise<void>}
   * @memberof SyncRunPull
   */
  async initContext(): Promise<void> {
    const context = await this.getContext();
    const spinalGeo = await this.getSpinalGeo();
    await spinalGeo.findInContext(spinalGeo, (node) => {
      // @ts-ignore
      SpinalGraphService._addNode(node);
      return false;
    });
    await context.findInContext(context, (node): false => {
      // @ts-ignore
      SpinalGraphService._addNode(node);
      return false;
    });
  }
  
  async updateEndpoints(modbusConfig : ModbusDevice[]){
    const networkContext = await this.getNetworkContext();
    for(const device of modbusConfig){
      await this.modbusClient.connectTCP(device.ip, { port: device.port });
      console.log("Connected to ", device.ip, ":", device.port,'\t success : ', this.modbusClient.isOpen);
      const devices = await networkContext.findInContext(
        networkContext,
        (node) => node.info.name.get() === device.name
      );
      if (devices.length == 0) {
        console.log('Device do not exist, skipping ', device.name);
        continue;
      }
      const deviceNode = devices[0];
      const endpointNodes = await deviceNode.getChildren('hasBmsEndpoint');
      
      for(const register of device.registers){
        const endpointNode = endpointNodes.find((node) => node.info.name.get() === register.name);
        if(!endpointNode){
          console.log('Endpoint do not exist, skipping ', register.name);
          continue;
        }
        SpinalGraphService._addNode(endpointNode);
          this.modbusClient.setID(register.bus_address);
          this.modbusClient.readHoldingRegisters(register.register_address, register.size).then((data) => {
           const result = this.bytesToDecimal(data.data);
          this.nwService.setEndpointValue(endpointNode.info.id.get(), result)
          this.timeseriesService.pushFromEndpoint(endpointNode.info.id.get(), result);
          console.log('Updated endpoint ', register.name)  
          }).catch((e) => {
            console.error("Error reading endpoint ", register.name)
            console.error(e);
          });
            
        
      }
    }

  }

  async createEndpointsIfNotExist(modbusConfig: ModbusDevice[]){
    const networkContext = await this.getNetworkContext();
    for(const device of modbusConfig){
      const devices = await networkContext.findInContext(
        networkContext,
        (node) => node.info.name.get() === device.name
      );
      if (devices.length > 0) {
        console.log('Device already exists, not creating ', device.name);
        continue;
      }

      const deviceNodeModel = new InputDataDevice(device.name, 'device'); 
      for(const register of device.registers){
        const endpointNodeModel = new InputDataEndpoint(
          register.name,
          0,
          '',
          InputDataEndpointDataType.Real,
          InputDataEndpointType.Other
        );
        deviceNodeModel.children.push(endpointNodeModel);
      }
      console.log('Creating device ', device.name);
      await this.nwService.updateData(deviceNodeModel);

    }



  }
  async init(): Promise<void> {
    console.log('Initiating SyncRunPull');
    try {
      const rawData = fs.readFileSync(process.env.FILE_NAME, 'utf8');
      const jsonData = JSON.parse(rawData);
      const modbusConfig: ModbusDevice [] = jsonData;
      await this.createEndpointsIfNotExist(modbusConfig);
        console.log("Init Done");
      
      await this.updateEndpoints(modbusConfig);
      //console.log(modbusConfig);

    

      this.config.lastSync.set(Date.now());
    } catch (e) {
      console.error(e);
    }
  }

  startEndpointUpdateTimer(modbusConfig : ModbusDevice[]){
    
    const updateInterval = parseInt(
      process.env.PULL_INTERVAL
    );
    const updatePerformance = async () => {
      if (!this.running) return;
      try {
        console.log('Updating endpoints...');
        await this.updateEndpoints(modbusConfig);
        console.log('done.');
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(updatePerformance, updateInterval);
      }
    };
    setTimeout(updatePerformance, updateInterval);
    
  }


  async run(): Promise<void> {
    this.running = true;
    const rawData = fs.readFileSync(process.env.FILE_NAME, 'utf8');
    const jsonData = JSON.parse(rawData);
    const modbusConfig: ModbusDevice [] = jsonData;
    this.startEndpointUpdateTimer(modbusConfig);

  }


  stop(): void {
    this.running = false;
  }
}
export default SyncRunPull;
