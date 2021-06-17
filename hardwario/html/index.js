$(document).ready(() => {

  $.get('/local/camscripter/package/settings.cgi?package_name=hardwario&action=get', (settings) => {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {
        "camera_user": "root",
        "camera_pass": "",
        "camera_ip": "127.0.0.1",
        "bearer_token": "",
        "group_id": "",
        "device_id": "",
        "sync_period": 3600,
        "co_service_id": 1,
        "time_offset": 0,
        "temperature_units": 'celsius'
      };
    }

    $('#userCam').val(settings.camera_user);
    $('#passCam').val(settings.camera_pass);
    $('#camIP').val(settings.camera_ip);
    $('#bearerToken').val(settings.bearer_token);
    $('#groupID').val(settings.group_id);
    $('#deviceID').val(settings.device_id);
    $('#syncPeriod').val(settings.sync_period);
    $('#coServiceID').val(settings.co_service_id);
    $('#timeOffset').val(settings.time_offset);

    if (settings.temperature_units == 'celsius') {
      $('#tempUnitsRadio1').prop("checked", true);
    } else {
      $('#tempUnitsRadio2').prop("checked", true);
    }
  });

  $(".form-control").change(inputChanged);
  $(".form-check-input").change(inputChanged);

  $(".myForm").submit(() => {
    return false;
  });
});

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_user': $('#userCam').val().trim(),
    'camera_pass': $('#passCam').val().trim(),
    'camera_ip': $('#camIP').val().trim(),
    'bearer_token': $('#bearerToken').val().trim(),
    'group_id': $('#groupID').val().trim(),
    'device_id': $('#deviceID').val().trim(),
    'sync_period': parseInt($('#syncPeriod').val().trim()),
    'co_service_id': parseInt($('#coServiceID').val().trim()),
    'time_offset': parseInt($('#timeOffset').val().trim()),
    'temperature_units': $("input[name='tempUnitsRadioOptions']:checked").val()
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=hardwario&action=set', JSON.stringify(settings), (data) => {});
}