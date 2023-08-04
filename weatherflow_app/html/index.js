$(document).ready(() => {

  $.get("/local/camscripter/package/settings.cgi?package_name=weatherflow&action=get", (settings) => {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {
        "camera_user": "root",
        "camera_pass": "",
        "camera_port": 80,
        "camera_ip": "127.0.0.1",
        "access_token": "",
        "station_id": "",
        "wheather_check_period": 5, //MINUTES!!!
        "co_service_id": 1,
        "time_offset": 0,
        "units": 'metric',
        "location": ""
      };
    }

    $("#userCam").val(settings.camera_user);
    $("#passCam").val(settings.camera_pass);
    $("#camIP").val(settings.camera_ip);
    $("#camPort").val(settings.camera_port);
    $("#accessToken").val(settings.access_token);
    $("#stationID").val(settings.station_id);
    $("#updatePeriod").val(settings.wheather_check_period);
    $("#coServiceID").val(settings.co_service_id);
    $("#timeOffset").val(settings.time_offset);
    $("#location").val(settings.location);
    if (settings.units == "metric") {
      $("#unitsRadio1").prop("checked", true);
    } else {
      $("#unitsRadio2").prop("checked", true);
    }
  });

  $(".form-control").change(inputChanged);
  $(".form-check-input").change(inputChanged);

  $(".myForm").submit(() => {
    return false;
  });
});

function inputChanged() {
  console.log("param changed");
  var settings = {
    "camera_user": $("#userCam").val().trim(),
    "camera_pass": $("#passCam").val().trim(),
    "camera_ip": $('#camIP').val().trim(),
    "camera_port": $('#camPort').val().trim(),
    "access_token": $("#accessToken").val().trim(),
    "station_id": parseInt($("#stationID").val().trim()),
    "wheather_check_period": parseInt($("#updatePeriod").val().trim()),
    "co_service_id": parseInt($("#coServiceID").val().trim()),
    "time_offset": parseInt($("#timeOffset").val().trim()),
    "units": $("input[name='unitsRadioOptions']:checked").val(),
    "location": $("#location").val().trim()
  };
  $.post("/local/camscripter/package/settings.cgi?package_name=weatherflow&action=set", JSON.stringify(settings), (data) => {});
}