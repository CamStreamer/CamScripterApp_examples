const readline = require('readline');
const SpinelDevice = require('./SpinelDevice');

VENDOR_ID = 0x0403;
PRODUCT_ID = 0x6001;




async function appRun(mode) {
    let sequence1 = [0x31, 0x02, 0x52]; //ea
    let sequence2 = [0xfe, 0x02, 0xF0]; //7f
    let sequence3 = [0x04, 0x02, 0x00, 0x04, 0x06]; //5d

    let device = new SpinelDevice(VENDOR_ID,PRODUCT_ID);
    await device.connect();
    device.setup((data) => {
        console.log("ACK:" + data.ack);
        console.log(data.data.toString("ascii"));
        console.log(data.data);

    });
    //Switches the port into "flowing mode"
    /*port_handle.on('data', function (data) {
        console.log(data.toString());
    })*/


   const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    reader.on('line', (input) => {

        if (device.format === 0x61){
            let buff = Buffer.from(input, "hex");
            device.sendData(0xfe, buff);
        }else{
            let buff = Buffer.from(input, "ascii");
            device.sendData(0xfe, buff);
        }

    });





    /*
    const parser = port_handle.pipe(new Readline());
    parser.on('data', console.log);
    */
}

appRun();