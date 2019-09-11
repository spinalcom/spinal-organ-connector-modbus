const ifaces = require('os').networkInterfaces()
const getIPRange = require('get-ip-range')
const IPMonitor = require('ping-monitor')
const ModbusRTU = require('modbus-serial')

let slavesDetected = []
let readingInterval = null
let period = 10 // seconds

function discoverModbusDevices(port, client) {

  return new Promise((res, rej) => {

    let cidrs = []
    slavesDetected = []

    Object.keys(ifaces).forEach(function(ifname) {
        let alias = 0;

        ifaces[ifname].forEach(function(iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (cidrs.indexOf(iface.cidr) < 0) {
                cidrs.push(iface.cidr);
            }
        });
    });

    let r = getIPRange(cidrs[0])

    let ips = r.value.filter((ip) => {
        return cidrs[0].indexOf(ip) == -1
    })

    ips.forEach(function(host) {

        const myMonitor = new IPMonitor({
            address: host,
            port: port,
            interval: 1 // minutes
        });

        myMonitor.on('up', function(res, state) {
            myMonitor.stop()
            checkAndStore(client, res.address, res.port);
        });

        myMonitor.on('down', function(res, state) {
            myMonitor.stop()
            removeSlave(error.address);
        });

        myMonitor.on('error', function(error) {
            myMonitor.stop()
            //console.log(error);
            removeSlave(error.address);
        });

    });

    // wait for some seconds till all devices answer back
    setTimeout(() => {

      res(slavesDetected) 

    }, 3000)

  })

}

let removeSlave = ((addr) => {
    let index = slavesDetected.findIndex((e) => {
        return e.addr == addr;
    })

    if (index != -1) {
        slavesDetected.splice(index, 1);
    }
});

let checkAndStore = ((client, addr, port) => {
    client.connectTCP(addr, port)
        .then(function() {
            return client.readCoils(0, 1)
        })
        .then(() => {
            let index = slavesDetected.findIndex((e) => {
                return e.addr == addr;
            })
            if (index == -1) {
                slavesDetected.push({
                    addr,
                    port
                });
            }
        })
        .catch(err => {
            //console.log(err.message);
            removeSlave(err.address);
        })
});


function readModbusDevices(deviceList, client) {

  if (readingInterval == null) {

    readingInterval = setInterval(() => {

      // iterate through deviceList, requesting data to endpoints based on the device info (ip and port)

      Object.keys(deviceList).forEach((k) => {

        let device = deviceList[k]

        Object.keys(device.endpoints).forEach((l) => {

          let endpoint = device.endpoints[l]

          // connect to device
          let host = device.path.split(':')[0]
          let port = device.path.split(':')[1]
          client.connectTCP(host, { port: port })

          // read register & store it
          if (!endpoint.size) endpoint.size = 1
          readingFunction(client, endpoint.path, endpoint.size, (data) => {
            endpoint.currentValue = data
          })

        })

      }) 

    }, period*1000)

  }

  return deviceList

}

let readingFunction = ((client, address, values, cb) => {

  if (address >= 00001 && address <= 09999) {
    //===========
    // read coils       1 bit registers
    //===========
    client.readCoils(address, values)
      .then(data => cb(data.data))
      .catch(err => console.log(err.message));
  } else if (address >= 10001 && address <= 19999) {
    //=====================
    // read discrete inputs         1 bit registers
    //=====================
    client.readDiscreteInputs(address, values)
      .then(data => cb(data.data))
      .catch(err => console.log(err.message));
  } else if (address >= 30001 && address <= 39999) {
    //=====================
    // read input registers             16 bits registers
    //=====================
    client.readInputRegisters(address, values)
      .then(data => cb(data.data))
      .catch(err => console.log(err.message));
  } else if (address >= 40001 && address <= 49999) {
    //=======================
    // read holding registers           16 bits registers
    //=======================
    client.readHoldingRegisters(address, values)
      .then(data => cb(data.data))
      .catch(err => console.log(err.message));
  }

});

module.exports = {
  discoverModbusDevices: discoverModbusDevices,
  readModbusDevices: readModbusDevices
}
