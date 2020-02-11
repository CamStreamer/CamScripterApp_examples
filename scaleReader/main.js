const net = require('net');
const fs = require('fs');
const CameraVapix = require('camstreamerlib/CameraVapix');

let prevWeight = null;
let dataBuffer = '';

// Read script configuration
let settings = null;
try {
  let data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
  settings = JSON.parse(data);
} catch (err) {
  console.log('No settings file found');
  return;
}

// Create camera client for http requests
var cv = new CameraVapix({
  'protocol': 'http',
  'ip': '127.0.0.1',
  'port': 80,
  'auth': 'root:' + settings.camera_pass,
});

// Connect to electronic scale
let client = new net.Socket();
client.connect(settings.scale_port, settings.scale_ip, () => {
  console.log('Scale connected');
  setInterval(() => {
    client.write(Buffer.from('1B70', 'hex'));
  }, settings.refresh_rate);
});

client.on('data', (data) => {
  dataBuffer += Buffer.from(data, 'hex').toString();
  let messageEnd = dataBuffer.indexOf('\r\n');
  if (messageEnd == -1) {
    return;
  }
  let weight = dataBuffer.substring(0, messageEnd);
  dataBuffer = '';

  if (prevWeight != weight) {
    prevWeight = weight;

    cv.vapixGet('/local/camoverlay/api/textAndBackground.cgi?service_id=' + settings.service_id + '&' + settings.field_name + '=' + weight).then((response) => {
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