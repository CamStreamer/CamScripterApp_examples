const { CameraVapix } = require('camstreamerlib/CameraVapix');

var cv = new CameraVapix({
    'protocol': 'http',
    'ip': '127.0.0.1',
    'port': 80,
    'auth': 'root:pass',
});

function getEventDeclarations() {
    console.log("___getEventDeclarations")
    cv.getEventDeclarations().then(function (declarations) {
        console.log(declarations);
    }, function (err) {
        console.log(err);
    });
}


function subscribeEventsWebsocket() {
    cv.on('eventsConnect', function () { console.log('Events connected') });
    cv.on('eventsDisconnect', function (err) { console.log('Events disconnected: ' + err) });

    cv.on('tnsaxis:CameraApplicationPlatform/VMD/Camera1Profile1', function (event) {
        try {
            console.log(event)
            /*var simpleItem = event['tt:MetadataStream']['tt:Event']
              [0]['wsnt:NotificationMessage']
                [0]['wsnt:Message']
                  [0]['tt:Message']
                    [0]['tt:Data']
                      [0]['tt:SimpleItem'];
            for (var i = 0; i < simpleItem.length; i++) {
              if (simpleItem[i]['$'].Name == 'active') {
                console.log(simpleItem[i]['$']);
                break;
              }
            }*/
        } catch (err) {
            console.log('Invalid event data: ' + err);
        }
    });
    cv.eventsConnect();
}

getEventDeclarations();
subscribeEventsWebsocket(); 
// support of RTSP was removed in CamStreamerlib 2.0.0