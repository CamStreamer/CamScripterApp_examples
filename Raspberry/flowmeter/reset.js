const readline = require('readline');
const SpinelDevice = require('./SpinelDevice');
const fs = require('fs');

VENDOR_ID = 0x0403;
PRODUCT_ID = 0x6001;

let device;

process.on('SIGTERM', async ()=>{
    await device.close();
});


async function appRun() {
    device = new SpinelDevice(VENDOR_ID,PRODUCT_ID);
    await device.connect();

    console.log("Counter cleared!");
    let data = await device.send97Request(0xfe, Buffer.from("6081", "hex"));
    console.log("Initial counter state was: " + parseCounterData(data.data));
    fs.writeFileSync(process.env.PERSISTENT_DATA_PATH + '/values.json',JSON.stringify({
        'aggregate_volume': 0
    }));
    await device.close();
}


function parseCounterData(data){
    let byte_number = data[0]/8;
    let results = [];

    for (let i = 1; i < data.length; i += byte_number){
        let res = 0;
        for (let y = 0; y < byte_number; y++){
            res = res << 8;
            res += data[i+y];
        }
        results = res;
    }
    return results;
}

appRun();