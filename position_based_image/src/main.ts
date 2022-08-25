import * as fs from "fs";
import * as net from "net";
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

function deg2rad(angle: number)
{
    return angle * Math.PI / 180;
}

function calculateDistance(a: Coordinates, b: Coordinates)
{
    let aLatRad = deg2rad(a.latitude);
    let aLonRad = deg2rad(a.longitude);
    let bLatRad = deg2rad(b.latitude);
    let bLonRad = deg2rad(b.longitude);

    let sinDiffLat = Math.sin((aLatRad - bLatRad) / 2);
    let sinDiffLon = Math.sin((aLonRad - bLonRad) / 2);
    let aCosLat = Math.cos(aLatRad);
    let bCosLat = Math.cos(bLatRad);

    let c = Math.pow(sinDiffLat, 2) + aCosLat * bCosLat * Math.pow(sinDiffLon, 2);
    return 2000 * 6371 * Math.asin(Math.sqrt(c));
}

function serverResponseParse(data: Buffer): Coordinates
{
    let lines = data.toString().split("\r\n");
    
    for (const line of lines) 
    {
        let items = line.split(",");
        if (items.length >= 7 && items[0] === "$GPRMC" && items[3] !== "" && items[4] !== "" && items[5] !== "" && items[6] !== "")
        {
            let lat = Number.parseFloat(items[3]) / 100;
            let lon = Number.parseFloat(items[5]) / 100;

            let latD = Math.floor(lat);
            let latM = ((lat - Math.floor(lat)) * 100) / 60;
            lat = latD + latM;

            let lonD = Math.floor(lon);
            let lonM = ((lon - Math.floor(lon)) * 100) / 60;
            lon = lonD + lonM;

            if (items[4] == "S")
            {
                lat *= -1;
            }
            if (items[6] == "W")
            {
                lon *= -1;
            }
            return {latitude: lat, longitude: lon};
        }
    }
}

function getServiceID(actualCoordinates: Coordinates)
{
    let lowestServiceID = Number.POSITIVE_INFINITY;

    for (let area of settings.areas)
    {
        let distance = calculateDistance(actualCoordinates, area.coordinates);
        
        if (distance <= area.radius && area.serviceID < lowestServiceID)
        {
            lowestServiceID = area.serviceID;
        }
    }
    return lowestServiceID;
}

function serverConnect()
{
    const server = net.createServer((client) => 
    {
        client.setEncoding('utf-8');
        client.setTimeout(1000);

        client.on('data', (data) =>
        {
            const coor = serverResponseParse(data);
            const id = getServiceID(coor);
            cos[lastServiceID].setEnabled(false);
            cos[id].setEnabled(true);
            lastServiceID = id;
            client.end('Server received data : ' + data + ', send back to client data size : ' + client.bytesWritten);
        });

        client.on('end', () =>
        {
            console.log('Client disconnect.');
        });

        client.on('timeout',  () =>
        {
            console.log('Client request time out.');
        })
    });

    server.listen(10110, () =>
    {
        server.on('close', () =>
        {
            console.log('TCP server socket is closed.');
        });

        server.on('error', (error) =>
        {
            console.log(JSON.stringify(error));
        });
    });
}

let lastServiceID = -1;
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

    serverConnect();
}

main();