let settings = null;
let checkVMDTimer = null;

$(document).ready(function() {

  $.get('/local/camscripter/package/settings.cgi?package_name=camSwitcherVMD&action=get', function(data) {
    console.log(data);
    settings = data;
    if (Object.keys(settings).length == 0) {
      settings = {"minPeriod": 30, "cameraList": [{"ip": "192.168.100.20", "user": "root", "pass": "pass"}, {"ip": "192.168.100.21", "user": "root", "pass": "pass"}]};
    }

    $('#minSwitchingPeriod').val(settings.minPeriod);
    $('#ipCam1').val(settings.cameraList[0].ip);
    $('#userCam1').val(settings.cameraList[0].user);
    $('#passCam1').val(settings.cameraList[0].pass);
    $('#playlistNiceNameCam1').val(settings.cameraList[0].playlistNiceName);
    $('#ipCam2').val(settings.cameraList[1].ip);
    $('#userCam2').val(settings.cameraList[1].user);
    $('#passCam2').val(settings.cameraList[1].pass);
    $('#playlistNiceNameCam2').val(settings.cameraList[1].playlistNiceName);
  });

  $(".form-control").change(inputChanged);

  $(".myForm").submit(function() {
    return false;
  });

  checkVMD();
});

function inputChanged() {
  console.log('param changed');
  settings = {
    'minPeriod': $('#minSwitchingPeriod').val(),
    'cameraList': [{
      'ip': $('#ipCam1').val(),
      'user': $('#userCam1').val(),
      'pass': $('#passCam1').val(),
      'playlistNiceName': $('#playlistNiceNameCam1').val()},{
      'ip': $('#ipCam2').val(),
      'user': $('#userCam2').val(),
      'pass': $('#passCam2').val(),
      'playlistNiceName': $('#playlistNiceNameCam2').val()}]
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=camSwitcherVMD&action=set', JSON.stringify(settings), function(data) {});

  checkVMD();
}

function checkVMD() {
  clearTimeout(checkVMDTimer);

  $.get('/local/camscripter/proxy/camSwitcherVMD/check_vmd.cgi', (data) => {
    console.log(data);
    if (data.state == 'OK') {
      $('#messages').html('');
    } else {
      $('#messages').html('<div class="alert alert-danger" role="alert">VMD 4 is not installed on both cameras. State: ' + data.state +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
    }
  }).fail(() => {
    $('#messages').html('<div class="alert alert-danger" role="alert">Could not check whether VMD 4 is installed on both cameras.' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
    checkVMDTimer = setTimeout(checkVMD, 1000);
  });
}