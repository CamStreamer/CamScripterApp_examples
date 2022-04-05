const SerialPort = require("serialport");
const fs = require("fs");
VENDOR_ID = '0' + (0x0403).toString(16);
PRODUCT_ID = (0x6001).toString(16);


/*
  Establish connection to the proper port with netcat.
  After running the script the port should read "p" or other custom text defined in this script.
*/

async function appRun() {
  let list = await SerialPort.list();
  console.log(JSON.stringify(list));
  let our_port;
  for (let port of list) {
    if (
      "vendorId" in port &&
      port["vendorId"] === VENDOR_ID &&
      "productId" in port &&
      port["productId"] === PRODUCT_ID
    ) {
      our_port = port;
    }
  }
  console.log(JSON.stringify(our_port));
  let parser2 = new SerialPort.parsers.Readline("\r\n");
  let port_handle = new SerialPort(our_port.path, {
    baudRate: 9600,
  });

  process.on("exit", () => {
    port_handle.close();
  });

  console.log(our_port.path);

  const parser = port_handle.pipe(parser2);
  parser.on("data", function (data) {
    console.log(data.toString('hex'));
    port_handle.write(Buffer.from('700D0A', 'hex'));
  });


  port_handle.write(Buffer.from('700D0A', 'hex'));

}
appRun();
