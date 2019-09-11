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
import * as Modbus from 'spinal-lib-modbus';
import {inspect} from 'util';

import {
  InputDataDevice,
  InputDataEndpoint,
  InputDataEndpointDataType,
  InputDataEndpointGroup,
  InputDataEndpointType,
} from './InputDataModel/InputDataModel';

type onDataFunctionType = (obj: InputDataDevice) => void;

const dataTypeDictionary = {
  Int8: InputDataEndpointDataType.Integer,
  Int16: InputDataEndpointDataType.Integer16,
  Int32: InputDataEndpointDataType.Integer,
  Int64: InputDataEndpointDataType.Integer,
  UInt8: InputDataEndpointDataType.Unsigned8,
  UInt16: InputDataEndpointDataType.Unsigned16,
  UInt32: InputDataEndpointDataType.Unsigned32,
  UInt64: InputDataEndpointDataType.Unsigned,
  Float: InputDataEndpointDataType.Double,
  Double: InputDataEndpointDataType.Double,
  Boolean: InputDataEndpointDataType.Boolean,
  String: InputDataEndpointDataType.String,
  DateTime: InputDataEndpointDataType.DateTime,
  Text: InputDataEndpointDataType.String,
  Bytes: InputDataEndpointDataType.OctetString
}

/**
 * Simulation Class to generate data from an extrenal source
 *
 * @class InputData
 */
class InputData {
  /**
   * @private
   * @type {onDataFunctionType}
   * @memberof InputData
   */
  private onData: onDataFunctionType;

  /**
   * @private
   * @type {InputDataDevice[]}
   * @memberof InputData
   */
  private devices: InputDataDevice[];

  /**
   * @private
   * @type {Modbus}
   * @memberof InputData
   */
  private modbus: Modbus;

  /**
   *Creates an instance of InputData.
   * @memberof InputData
   */
  constructor() {
    const intervalDiscovery = 1000 * 3;
    const intervalUpdateValue = 1000 * 6;
    this.devices = [];
    this.onData = null;

    // TODO: where is this info taken?
    this.modbus = new Modbus({
        'port' : 502 // default port for Modbus devices
    })

    setInterval(this.generateData.bind(this), intervalDiscovery);
    setInterval(this.onDataInterval.bind(this), intervalUpdateValue);

  }

  /**
   * @private
   * @memberof InputData
   */
  private onDataInterval() {
    // update data from modbus

    console.log('Enter onDataInterval');

    if (this.onData !== null) {
      console.log('update data from modbus');

      let updatedValues = this.modbus.updateValues()

      for (let i = 0; i < this.devices.length; i++) {
        const dev = this.devices[i];

        console.log(dev.id)

        for (let k=0; k < dev.children.length; k++) {

          const endp = <InputDataEndpoint>dev.children[k]
/*
          console.log(updatedValues[dev.id])
          console.log(dev.id)
          console.log(endp.id)
          console.log('-------------------------')
*/
          if (typeof updatedValues[dev.id].endpoints[endp.id] != "undefined")
            endp.currentValue = updatedValues[dev.id].endpoints[endp.id].currentValue

        }

        this.onData(this.devices[i]);

      }

    }
    // this.onData(this.getAndUpdateOneRandomDevice());
  }

  /**
   * @param {onDataFunctionType} onData
   * @memberof InputData
   */
  public setOnDataCBFunc(onData: onDataFunctionType): void {
    this.onData = onData;
  }

  /**
   * @private
   * @memberof InputData
   */
  private generateData() {

    console.log('Enter generate data');

    let endpoint = undefined;

    console.log('discover()')

    this.modbus.discover((deviceList) => {

      //console.log(deviceList)

      let keys = Object.keys(deviceList)

      keys.forEach((k) => {

        let d = deviceList[k]

        const deviceDataInput = new InputDataDevice(
          d.name,
          '',
          d.id,
          d.path
        );

        // get endpoints

        let keysEndpoints = Object.keys(d.endpoints)

        keysEndpoints.forEach((ke) => {

          let e = d.endpoints[ke]

          const endPointDataInput = new InputDataEndpoint(
            e.name,
            e.currentValue,
            'undefined',
            dataTypeDictionary[e.dataType],
            InputDataEndpointType.Other,
            e.id,
            e.path,
          );
          deviceDataInput.children.push(endPointDataInput);

        })

        this.devices.push(deviceDataInput);

      })

    });

  }

  /**
   * @private
   * @param {(InputDataDevice|InputDataEndpointGroup)} deviceOrEnpointGroup
   * @memberof InputData
   */
  private updateDevice(
      deviceOrEnpointGroup: InputDataDevice|InputDataEndpointGroup,
      ): void {
    for (const child of deviceOrEnpointGroup.children) {
      if (child instanceof InputDataEndpoint) {
        child.currentValue = Math.floor(Math.random() * 100);
      } else if (
          child instanceof InputDataDevice ||
          child instanceof InputDataEndpointGroup) {
        this.updateDevice(child);
      }
    }
  }

  /**
   * @private
   * @returns {InputDataDevice}
   * @memberof InputData
   */
  private getAndUpdateOneRandomDevice(): InputDataDevice {
    if (this.devices.length > 0) {
      const idx = Math.floor(Math.random() * this.devices.length);
      this.updateDevice(this.devices[idx]);
      return this.devices[idx];
    }
    this.generateData();
    return this.getAndUpdateOneRandomDevice();
  }
  ////////////////////////////////////////////////////////////////////////////////
  /// :
}

export { InputData };
