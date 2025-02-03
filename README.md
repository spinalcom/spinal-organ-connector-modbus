# spinal-organ-connector-modbus

Simple BOS-MODBUS connector.

## Getting Started

These instructions will guide you on how to install and make use of the spinal-organ-connector-modbus.

## Overview

This connector can either run standalone without any studio plugin, or it can be used with the spinal-env-viewer-plugin-organ_modbus plugin.
The only difference between the two is that the plugin will allow you to restart, stop , start and upload the modbus configuration file straight from plugin interface.

### Prerequisites Stand-alone mode

These are the requirments if you want to run the organ connector without needing the studio plugin.

This module requires a `.env` file in the root directory with the following variables:

```bash
SPINAL_USER_ID=xxx                           # The id of the user connecting to the spinalhub (most likely 168)
SPINAL_PASSWORD="xxxx"                       # The password of the user connecting to the spinalhub
SPINALHUB_IP=xxxxxxxxxx                      # The IP address of the spinalhub
SPINALHUB_PROTOCOL="xxx"                     # The protocol for connecting to the spinalhub (http or https)
SPINALHUB_PORT=xxxx                          # The port for connecting to the spinalhub
DIGITALTWIN_PATH="xxxx"                      # The path of the digital twin in the spinalhub
SPINAL_ORGAN_NAME="xxxxx"                    # The name of the organ
SPINAL_CONFIG_PATH="/etc/Organs/modbus"      # Path to the config file in the spinal drive (ex: /etc/Organs/modbus)
NETWORK_CONTEXT_NAME="xxxx"                  # The name of the network context
VIRTUAL_NETWORK_NAME="xxxx"                  # The name of the virtual network
PULL_INTERVAL=60000                          # Time (in ms) between each update (ex: 60000)
MODBUS_STUDIO_PLUGIN_CONTROL=0               # 0 because we are not using the studio plugin
```

Since you are not using the studio plugin, you'll also need to have either :

- A Json file named modbus_config.json in the root directory ( next to .env file)
- An Excel file named modbus_config.xlsx in the root directory ( next to .env file)

For the templates of the files, please refer to the template section.

### Prerequisites plugin studio mode

These are the requirments if you want to run the organ connector with the studio plugin.

This module requires a `.env` file in the root directory with the following variables:

```bash
SPINAL_USER_ID=xxx                           # The id of the user connecting to the spinalhub (most likely 168)
SPINAL_PASSWORD="xxxx"                       # The password of the user connecting to the spinalhub
SPINALHUB_IP=xxxxxxxxxx                      # The IP address of the spinalhub
SPINALHUB_PROTOCOL="xxx"                     # The protocol for connecting to the spinalhub (http or https)
SPINALHUB_PORT=xxxx                          # The port for connecting to the spinalhub
DIGITALTWIN_PATH="xxxx"                      # The path of the digital twin in the spinalhub
SPINAL_ORGAN_NAME="xxxxx"                    # The name of the organ
SPINAL_CONFIG_PATH="/etc/Organs/modbus"      # Path to the config file in the spinal drive ( if possible keep it as /etc/Organs/modbus)
NETWORK_CONTEXT_NAME="xxxx"                  # The name of the network context
VIRTUAL_NETWORK_NAME="xxxx"                  # The name of the virtual network
PULL_INTERVAL=60000                          # Time (in ms) between each update (ex: 60000)
MODBUS_STUDIO_PLUGIN_CONTROL=1               # 1 because we are using the studio plugin
```

Since you are using the studio plugin, you'll also need to upload a configuration file ( either json or xlsx) using the plugin interface.
( We will go through the process later in the documentation )

For the templates of the files, please refer to the template section.

#### Register Information (excel template)

| Device Name | IP Address | Port | Data Point Name | Type             | Bus Address | Address | Size | Is Unsigned | Is Command |
| ----------- | ---------- | ---- | --------------- | ---------------- | ----------- | ------- | ---- | ----------- | ---------- |
| DeviceName1 | xx.xx.xx.x | 502  | register_name1  | holding_register | 20          | 50770   | 2    | true        | true       |
| DeviceName1 | xx.xx.xx.x | 502  | register_name2  | holding_register | 23          | 50772   | 2    | false       | false      |
| DeviceName2 | xx.xx.xx.x | 502  | register_name3  | holding_register | 2           | 50770   | 2    | false       | false      |
| DeviceName1 | xx.xx.xx.x | 502  | register_name4  | input_register   | 28          | 50774   | 1    | false       | false      |
| DeviceName3 | xx.xx.xx.x | 502  | register_name5  | coil             | 31          | 50770   | 1    | false       | true       |
| ...         | ...        | ...  | ...             | ...              | ...         | ...     | ...  | ...         | ...        |

#### Register Information (json template exemple)

```json
[
  {
    "name": "DeviceJson",
    "ip": "127.0.0.1",
    "port": 8502,
    "dataPoints": [
      {
        "name": "DataPointJson",
        "type": "holding_register",
        "bus_address": 1,
        "address": 8000,
        "size": 1,
        "isUnsigned": false,
        "isCommand": true
      }
    ]
  }
]
```

### Installation

Clone this repository in the directory of your choice. Navigate to the cloned directory and install the dependencies using the following command:

```bash
npm install
```
To build the module, run:

```bash
npm run build
```

Create the .env file in the root directory and fill it with the required variables.

If you are in standalone mode , create/put the modbus_config.json or modbus_config.xlsx file in the root directory.

If you are in plugin mode, you can upload the configuration file using the plugin interface after starting the connector.

### Usage

Start the module with:

```bash
npm run start
```

Or using [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)

```bash
pm2 start index.js --name spinal-organ-modbus
```

### Plugin Interface

After starting the connector the first time, it will create : 

1- A config file to handle the connector state ( running, stopped, restarting ) in the spinal drive ( SPINAL_CONFIG_PATH )

2- A network context in the spinalhub ( NETWORK_CONTEXT_NAME ) and a virtual network ( VIRTUAL_NETWORK_NAME ) in the digital twin.

In the studio , click on the network context created by the connector, then click on the "Link and Manage Connector" button.

Use the interface to select which modbus connector you want to use to manage this context ( it will look for config files in /etc/Organs/modbus ) 

Then, upload a modbus configuration file ( either json or xlsx ) using the interface.

You're all set !


