const net = require('net');
const fs = require('fs');
const CameraVapix = require('camstreamerlib/CameraVapix');
const http = require('http');
const httpRequest = require('camstreamerlib/HTTPRequest');
const { hostname } = require('os');

let prevWeightData = null;
let dataBuffer = '';


// Read script configuration
let settings = null;
try {
  let data;
  if (!process.env.PERSISTENT_DATA_PATH){
    data = fs.readFileSync('./localdata/settings.json');
  }else{
    data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
  }
  settings = JSON.parse(data);
} catch (err) {
  console.log('No settings file found');
  return;
}
let ms_client = new net.Socket();



// Create camera client for http requests
let cv = new CameraVapix({
  'protocol': 'http',
  'ip': settings.camera_ip,
  'port': settings.camera_port,
  'auth': settings.camera_user + ':' + settings.camera_pass,
});
let milestone_connected = false;
let ms_protection_period = false;
// Connect to electronic scale
let client = new net.Socket();
client.connect(settings.scale_port, settings.scale_ip, () => {
  console.log('Scale connected');
  try{
    ms_client.connect(settings.milestone_port, settings.milestone_ip,()=>{
      milestone_connected = true;
    });
  }catch(e){
    console.log('Milestone Error:' + e);
  }
  setInterval(() => {
    client.write(Buffer.from('1B700D0A', 'hex'));
  }, settings.refresh_rate);
});

client.on('data', (data) => {
  dataBuffer += Buffer.from(data, 'hex').toString();
  const messageEnd = dataBuffer.indexOf('\r\n');
  if (messageEnd == -1) {
    return;
  }
  const weightData = dataBuffer.substring(0, messageEnd);
  dataBuffer = '';

  if (prevWeightData != weightData) {
    prevWeightData = weightData;
    if (milestone_connected && !ms_protection_period){
      let sep = Buffer.from(settings.milestone_separator);
      console.log(sep.toString('hex'));
      ms_client.write(Buffer.from(settings.milestone_string, "ascii") + sep);
      ms_protection_period = true;
      setTimeout(()=>{ms_protection_period = false}, settings.minimum_span * 1000)
    }
    //Parse weight and unit
    const weight = prevWeightData.substring(0, 9).trim();
    const unit = prevWeightData.substring(9).trim();
    cv.vapixGet('/local/camoverlay/api/textAndBackground.cgi?service_id=' + settings.service_id + '&' +
      settings.value_field_name + '=' + weight + '&' +
      settings.unit_field_name + '=' + unit)
    .then((response) => {
      //console.log(response);
    }, function(err) {
      console.error(err);
    });
  }
});

client.on('error', (err) => {
  console.error('Scale connection error: ' + err.toString());
});

client.on('close', () => {
  console.log('Scale connection closed');
  process.exit(0);
});

process.on('unhandledRejection', function (error) {
  console.log('unhandledRejection', error.message);
});
