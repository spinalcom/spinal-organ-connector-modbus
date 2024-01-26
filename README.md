# spinal-organ-connector-modbus
Simple BOS-MODBUS connector.

## Getting Started

These instructions will guide you on how to install and make use of the spinal-organ-connector-modbus.

### Prerequisites

This module requires a `.env` file in the root directory with the following variables:

```bash
SPINAL_USER_ID=                             # The id of the user connecting to the spinalhub
SPINAL_PASSWORD=                            # The password of the user connecting to the spinalhub
SPINALHUB_IP=                               # The IP address of the spinalhub
SPINALHUB_PROTOCOL=                         # The protocol for connecting to the spinalhub (http or https)
SPINALHUB_PORT=                             # The port for connecting to the spinalhub
DIGITALTWIN_PATH=                           # The path of the digital twin in the spinalhub
SPINAL_ORGAN_NAME=                          # The name of the organ
SPINAL_CONFIG_PATH=                         # The path of the config file in the spinalhub exemple : /etc/Organs/modbus
FILE_NAME=                                  # "path/to/file" the path of the file to read 

PULL_INTERVAL=                              # Time (in ms) between each update

```

The module also requires an input file ( json or excel ) 

#### Register Information (excel template)
| Device Name  | IP Address    | Port | Register Name    | Register Type    | Bus Address | Register Address | Size |
|--------------|---------------|------|------------------|------------------|-------------|------------------|------|
| MGATE MB3180 | xxx.xx.xx.xx | 502  | register_name     | holding_register | 20          | 50770            | 2    |
| MGATE MB3180 | xxx.xx.xx.xx | 502  | register_name     | holding_register | 23          | 50770            | 2    |
| MGATE MB3180 | xxx.xx.xx.xx | 502  | register_name     | holding_register | 2           | 50770            | 2    |
| MGATE MB3180 | xxx.xx.xx.xx | 502  | register_name     | holding_register | 28          | 50770            | 2    |
| MGATE MB3180 | xxx.xx.xx.xx | 502  | register_name     | holding_register | 31          | 50770            | 2    |
| ...          | ...           | ...  | ...                                  | ...              | ...         | ...              | ...  |

#### Register Information (json template)
```json
{
  "name": "Device Name",
  "ip": "xxxxxxxxx",
  "port": 502,
  "registers": [
    {
      "name": "Register Name",
      "type": "Register Type",
      "bus_address": Bus Address,
      "register_address": Register Address,
      "size": Size
    },
    // Additional registers can be added here
  ]
}
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

### Usage

Start the module with:

```bash
npm run start
```

Or using [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)
```bash
pm2 start index.js --name spinal-organ-modbus
```
```