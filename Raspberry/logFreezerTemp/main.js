const { spawn } = require('child_process');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const fs = require('fs');

let settings = null;
try {
    let data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data);
} catch (err) {
  console.log("No settings file found");
  return;
}

let co = new CamOverlayAPI({
    'ip': settings.camera_ip,
    'port': settings.camera_port,
    'auth': settings.camera_user + ":" + settings.camera_pass,
    'serviceID': settings.service_id,
});

const UNITS = { f: '°F', c: '°C' };
const RATIOS = { f: [1.8, 32], c: [1, 0] }; //  relation to Celsius

function temperature(num, unit_tag) {
  r = RATIOS[unit_tag];
  return (num * r[0] + r[1]).toFixed(2) + " " + UNITS[unit_tag];
}


async function onePeriod(){
  let child = spawn('sudo' ,[ process.env.INSTALL_PATH + '/temper/temper.py','--json'],{
    stdio: ['inherit', 'pipe', 'inherit']
  });
  child.stdout.on('data', async (data)=>{
    let temp = null;
    let json_data = JSON.parse(data.toString('utf-8'));
    if (!json_data[0]) {
      console.log('No data!');
    }else{
      temp = json_data[0]["internal temperature"];
      console.log(temp);
    }

    let fields = [{
      'field_name': settings.field_name,
      'text': temp ? temperature(temp, settings.unit) : 'No Data'
    }];
    await co.updateCGText(fields);
  });
  child.on('close', ()=>{
    console.log('measured!');
    setTimeout(onePeriod, 3000);
  });
}

onePeriod();

