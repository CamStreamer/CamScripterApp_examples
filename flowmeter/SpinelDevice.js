const EventEmitter = require('events');
const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter');

class SpinelDevice extends EventEmitter{

    constructor(vendorID, productID){
        super();
        this.vendorID = vendorID.toString(16);
        if (this.vendorID.length < 4){
            for (let i = 0; i < 4-this.vendorID.length; i++){
                this.vendorID = "0" + this.vendorID;
            }
        }
        this.productID = productID.toString(16);
        if (this.productID.length < 4){
            for (let i = 0; i < 4-this.productID.length; i++){
                this.productID = "0" + this.productID;
            }
        }
        this.prefix = 0x2a;
        this.port_handle = undefined;
        this.parser = undefined;
        this.pending_data = false;
        this.buffer = Buffer.from('');
        this.requests = {
            0x61: {},
            0x42: []
        };
    }

    async connect(){
        let list = await SerialPort.list();
        console.log(JSON.stringify(list));
        let our_port = null;

        for (let port of list){
            if (("vendorId" in port && port["vendorId"] === this.vendorID
                && "productId" in port && port["productId"] === this.productID))
            {
                our_port = port;
            }
        }

        if (!our_port){
            throw "404 No such device found!";
        }
        else{
            this.port_handle = new SerialPort({
                path: our_port.path,
                baudRate: 115200
            });
            this.parser = this.port_handle.pipe(new DelimiterParser({
                delimiter: '\r',
                includeDelimiter: true
            }));
            this.parser.on('data', (raw_data) => {
                let new_data = Buffer.from(raw_data);
                if (this.pending_data){
                    new_data = Buffer.concat([this.buffer,new_data])
                    this.pending_data = false;
                    this.buffer = Buffer.alloc(0);
                }
                let data = this.parseData(Buffer.from(new_data));
                this.emit('data', data);
            });
        }
    }


    checksum(buff){
        let base = 255;
        let sum = 0x00;
        for (let i = 0; i < buff.length; i++){
            sum = (sum + buff[i]) & 0xff;
        }
        return (base - sum) & 0xff;
    }


    assemble97Instruction(addr, sign, sdata_buff){
        let b_count = (sdata_buff.length + 4);
        let pre = Buffer.from([this.prefix, 0x61, ((b_count & 0xff00)>>8), b_count & 0xff, addr, sign]);
        let load = Buffer.concat([pre, sdata_buff]);
        let suffix = Buffer.from([this.checksum(load), 0x0d]);
        return Buffer.concat([load, suffix]);
    }

    parseData(new_data){
        if (new_data[0] === 0x2a){
            //continue...
            switch(new_data[1]){
                case (0x61):
                //continue...
                    let bytecount = (new_data[2] << 8) + new_data[3];
                    if (bytecount+4 === new_data.length){
                        //data are complete
                        let ch_sum = new_data[new_data.length-2];
                        let dataload = new_data.slice(0,new_data.length-2);
                        if (this.checksum(dataload) === ch_sum){
                            return this._accept97Request(dataload);
                        }else{
                            throw "Spinell Parse Error - Bad Checksum. Recived: " + ch_sum + " Expected: " + this.checksum(dataload);
                        }
                    }else if (bytecount > new_data.length){
                        //some data are missing
                        this.buffer = new_data;
                        this.pending_data = true;
                    }else{
                        throw "Spinell Parse Error - Impossible Bytecount";
                    }
                    break;
                case (0x42) :
                    // \r is not valid data value, therefore data are complete
                    return this._accept66Request(new_data);
                    break;
                default:
                    throw "Spinell Parse Error - Unknown Format";
            }
        }else{
            throw "Spinel Parse Error - Unknown Protocol";
        }
    }

    _send66Data(addr, sdata_buff){
        let b = Buffer.from("\r");
        let prefix = Buffer.concat([Buffer.from("*B"), Buffer.from(addr)]);
        let inst = Buffer.concat([prefix, sdata_buff, b]);
        this.sendData(inst);
    }

    _send97Data(addr, sign, sdata_buff){
        let inst = this.assemble97Instruction(addr, sign, sdata_buff);
        this.sendData(inst);
    }

    sendData(buffer){ //Don't use for 66 comunication with requests
        this.port_handle.write(buffer, function(err) {
            if (err) {
              throw 'Error on spinel write: ', err.message;
            }
        });
    }

    _accept66Request(dataload){
        let out_json = {};
        out_json["format"] = dataload[1];
        out_json["address"] = dataload[2] - 0x30;
        out_json["data"] = dataload.slice(3);
        if (this.requests[0x42].length > 0)
            this.requests[0x42].pop()(out_json);
        this.emit('data66', out_json);
    }

    _accept97Request(dataload){
        let out_json = {};
        out_json["format"] = dataload[1];
        let bytecount = (dataload[2] << 8) + dataload[3];
        out_json["byte_count"] = bytecount;
        out_json["data"] = dataload.slice(7);
        out_json["address"] = dataload[4];
        let sign = dataload[5];
        out_json["sign"] = sign;
        out_json["ack"] = dataload[6];
        if (sign in this.requests[0x61]){
            this.requests[0x61][sign](out_json);
        }
        this.emit('data97', out_json);
    }

    send97Request(addr,sdata_buff, timeout = 5000){
        let sign = 0x00; //TODO: implemet better id system
        return new Promise((resolve,reject)=>{
            this._send97Data(addr, sign, sdata_buff);
            this.requests[0x61][sign] = resolve;
            setTimeout(reject, timeout);
        });
    }

    send66Request(addr,sdata_buff,timeout = 5000){
        return new Promise((resolve,reject)=>{
            this._send66Data((addr + 0x30), sdata_buff);
            this.requests[0x42].push(resolve);
            setTimeout(reject, timeout);
        });
    }

    async close(){
        this.port_handle.unpipe();
        this.port_handle.removeAllListeners();
        this.port_handle.destroy();
        await this.port_handle.close();
        console.log('closed serial port');
    }
}


module.exports = SpinelDevice;