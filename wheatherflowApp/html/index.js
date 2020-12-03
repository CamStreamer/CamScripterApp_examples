$(document).ready(() => {

  $.get('/local/camscripter/package/settings.cgi?package_name=wheatherflow&action=get', (settings) => {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {
        "camera_user": "root",
        "camera_pass": "",
        "access_token": "",
        "station_id": "",
        "sync_period": 3600,
        "co_service_id": 1,
        "time_offset": 0,
        "temperature_units": 'celsius'
      };
    }

    $('#userCam').val(settings.camera_user);
    $('#passCam').val(settings.camera_pass);
    $('#accessToken').val(settings.access_token);
    $('#stationID').val(settings.station_id);
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
    'access_token': $('#accessToken').val().trim(),
    'station_id': $('#stationID').val().trim(),
    'sync_period': parseInt($('#syncPeriod').val().trim()),
    'co_service_id': parseInt($('#coServiceID').val().trim()),
    'time_offset': parseInt($('#timeOffset').val().trim()),
    'temperature_units': $("input[name='tempUnitsRadioOptions']:checked").val()
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=wheatherflow&action=set', JSON.stringify(settings), (data) => {});
}