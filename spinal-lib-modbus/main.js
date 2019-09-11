const ModbusRTU = require('modbus-serial')
const discoverModbusDevices = require('./modbusHelper').discoverModbusDevices
const readModbusDevices = require('./modbusHelper').readModbusDevices
const deviceData = require('./deviceEndpoints.json')

/*
 * Network client - contains 2 functions
 *
 * input: config
 *  - port: 
 * discover()
 * updateValues()
 */

function NetworkClient(config, deviceData) {

  let deviceList = {}

  let client = new ModbusRTU()

  this.discover = function (cb) {

    discoverModbusDevices(config.port, client)
      .then((modbusDevices) => {
        for (var i=0; i < modbusDevices.length; i++) {
          let device = getDeviceInfo({
            ip: modbusDevices[i].addr,
            port: modbusDevices[i].port
          }, deviceData)

          if (device != null)
            addDevice(deviceList, device)
        }
      })

  }

  this.updateValues = function () {

    readModbusDevices(deviceList)

    return deviceList

  }

}

function getDeviceInfo(deviceParams, deviceData) {

  let ip = deviceParams.ip
  let port = deviceParams.port

  // get device information and endpoints from JSON
  let index = deviceData.findIndex((d) => {
    return d.ip == ip && d.port == port
  })

  if (index >= 0) {
    // return structure of device and endpoints
    let d = deviceData[index]

    let device = {
      name: d.name,
      path: ip + ':' + port,
      endpoints:  {}
    }

    device.id = (typeof d.id != "undefined") ? d.id : ip + ':' + port
    device.type = (typeof d.type != "undefined") ? d.type : ''

    d.registers.forEach((r) => {
      device.endpoints[r.address] = {
        id: r.address,
        path: r.address,
        size: r.size,
        currentValue: null
      }

      device.endpoints[r.address].type = getRegisterType(r)
      device.endpoints[r.address].dataType = getDataType(device.endpoints[r.address].type)
    })

    return device
  }

  // if there is no device, throw a warning
  console.log('Warning! No device found on JSON under IP ' + ip + ' and PORT ' + port)

  return null
}

function getRegisterType(register) {

  if (typeof register.type != "undefined")
    return register.type

  if (register.address > 1 && register.address < 9999)
    return 'coil'
  else if (register.address > 10001 && register.address < 19999)
    return 'discreteInput'
  else if (register.address > 30001 && register.address < 39999)
    return 'inputRegister'
  else if (register.address > 40001 && register.address < 49999)
    return 'holdingRegister'

}

function getDataType(registerType) {
  if (registerType == 'coil' || registerType == 'discreteInput')
    return 'Boolean'
  else if (registerType == 'inputRegister' || registerType == 'holdingRegister')
    return 'UInt32'
}

function addDevice(deviceList, device) {
  // iterate device and endpoints and check if there is something new to add to deviceList
  if (typeof deviceList[device.id] != "undefined") {
    // update data
    deviceList[device.id].name = device.name
    deviceList[device.id].path = device.path
    deviceList[device.id].type = device.type

    Object.keys(device.endpoints).forEach((k) => {

      let endpoint = device.endpoints[k]

      if (typeof deviceList[device.id].endpoints[k] == "undefined") {
        deviceList[device.id].endpoints[k] = endpoint
      } else {
        deviceList[device.id].endpoints[k].id = endpoint.id
        deviceList[device.id].endpoints[k].path = endpoint.path
        deviceList[device.id].endpoints[k].size = endpoint.size
        deviceList[device.id].endpoints[k].type = endpoint.type
        deviceList[device.id].endpoints[k].dataType = endpoint.dataType
      }

    })
  } else {
    deviceList[device.id] = device
  }
}

module.exports = NetworkClient
