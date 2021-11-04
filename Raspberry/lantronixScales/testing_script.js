const SerialPort = require('serialport');
const crypto = require("crypto");

const VENDOR_ID = 0x0403;
const PRODUCT_ID = 0x6001;

async function hi(){
    let list = await SerialPort.list();
    console.log(JSON.stringify(list));
    let vendor_id = VENDOR_ID.toString(16);
    if (vendor_id.length < 4){
        for (let i = 0; i < 4-vendor_id.length; i++){
            vendor_id = "0" + vendor_id;
        }
    }
    let product_id = PRODUCT_ID.toString(16);
    if (product_id.length < 4){
        for (let i = 0; i < 4-product_id.length; i++){
            product_id = "0" + product_id;
        }
    }

    let our_port = null;

    for (let port of list){
        if (("vendorId" in port && port["vendorId"] === vendor_id
            && "productId" in port && port["productId"] === product_id))
        {
            our_port = port;
        }
    }

    if (!our_port){
        throw "404 No such device found!";
    }
    else{
        let port_handle = new SerialPort(our_port.path, {
            baudRate: 9600
        });

        process.on('exit', ()=>{
            port_handle.close((err)=>{console.log(err)});
        });

        setInterval(()=>{
            let number = crypto.randomInt(0, 100000).toString();
            let prefix = 'LG';
            let spaces = ' '.repeat(9 - number.length);
            let text = prefix + spaces + number + '0  ';
            port_handle.write(text);
            console.log(text);
        }, 4000);

    }
}

hi();