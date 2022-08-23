import * as fs from "fs";
import * as mqtt from "mqtt";
import {CamOverlayAPI} from "camstreamerlib/CamOverlayAPI";

type Camera = 
{
    IP: string,
    port: number,
    user: string,
    password: string
}

type Coordinates =
{
    latitude: number,
    longitude: number
}

type Settings =
{
    sourceCamera: Camera,
    targetCamera: Camera,
    modem: Camera,
    areas:
    {
        coordinates: Coordinates,
        radius: number,
        serviceID: number
    }[]
}

function calculateDistance(a: Coordinates, b: Coordinates)
{
    let aLatRad = a.latitude * Math.PI / 180;
    let aLonRad = a.longitude * Math.PI / 180;
    let bLatRad = b.latitude * Math.PI / 180;
    let bLonRad = b.longitude * Math.PI / 180;

    let sinDiffLat = Math.sin((aLatRad - bLatRad) / 2);
    let sinDiffLon = Math.sin((aLonRad - bLonRad) / 2);
    let aCosLat = Math.cos(aLatRad);
    let bCosLat = Math.cos(bLatRad);

    let c = Math.pow(sinDiffLat, 2) + aCosLat * bCosLat * Math.pow(sinDiffLon, 2);
    return 2000 * 6371 * Math.asin(Math.sqrt(c));
}

function mqttConnect(settings)
{
    //console.log(settings)
    const url = `mqtt://${"192.168.90.79"}:${"1883"}`
    const options = 
    {
        clean: true,
        connectTimeout: 4000,
        username: "admin",
        password: "NetRex2022",
        reconnectPeriod: 1000
    }
    
    const client = mqtt.connect(url, options);
    
    client.on('connect', function() 
    {
        console.log("MQTT connected.");
        
        client.subscribe('coordinates', function (error) 
        {
            if (error !== null)
            {
                console.log("Connection failed: ", error);
            }
            else
            {
                console.log("Subscribed successfully.");
                client.publish("request", undefined, undefined, (error, packet) =>
                {
                    console.log("1_", error);
                    console.log("2_", packet);
                })
            }
        })
    })

    client.on('message', function(topic, message)
    {
        console.log("MESSAGE");
        console.log("3_", topic);
        console.log("4_", message.toString())
        client.end()
      })

    client.on('error', function(error)
    {
        console.log("! Error: ", error);
        client.end()
    })
}

// TEMPORARY
const coor: Coordinates[] =
[
    {
        latitude: 50.0689464,
        longitude: 14.4347592
    },
    {
        latitude: 50.0563672,
        longitude: 14.3752942
    },
    {
        latitude: 50.1019472,
        longitude: 14.3928689
    }
]

let last = -1;
function getCoordinates()
{
    last = (last + 1) % 3;
    return coor[last];
}

function getServiceID()
{
    let lowestServiceID = Number.POSITIVE_INFINITY;
    let actualCoordinates = getCoordinates();

    for (let area of settings.areas)
    {
        let distance = calculateDistance(actualCoordinates, area.coordinates);
        
        if (distance <= area.radius && area.serviceID < lowestServiceID)
        {
            lowestServiceID = area.serviceID;
        }
    }
    console.log(lowestServiceID)
    return lowestServiceID;
}

let lastServiceID: number;
let settings: Settings;
let cos: Record<number, CamOverlayAPI> = {};

function main()
{
    try {
        const path = "./localdata/"//process.env.PERSISTENT_DATA_PATH;
        const data = fs.readFileSync(path + 'settings.json');
        settings = JSON.parse(data.toString());
    } catch (error) {
        console.log('Error with Settings file: ', error);
        return;
    }

    for (let area of settings.areas)
    {
        const options = 
        {
            ip: settings.targetCamera.IP,
            port: settings.targetCamera.port,
            auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
            serviceID: area.serviceID
        }
        const co = new CamOverlayAPI(options);
        co.connect();
        co.setEnabled(false);
        cos[area.serviceID] = co;
    }
    
    setInterval(()=>
    {
        console.log(lastServiceID)
        cos[lastServiceID]?.setEnabled(false);
        lastServiceID = getServiceID() + 1
        cos[lastServiceID].setEnabled(true);
    }, 3000);
}

main();