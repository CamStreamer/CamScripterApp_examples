$(document).ready(function() {

  $.get('/local/camscripter/package/settings.cgi?package_name=aqi&action=get', function(settings) {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {
        "camera_user": "root",
        "camera_pass": "",
        "scale": 100,
        "coordinates": "top_left",
        "access_token": "",
        "display_location": "",
        "location": "london",
        "update_frequency": 1,
        "pos_x": 0,
        "pos_y": 0
      };
    }

    $('#userCam').val(settings.camera_user);
    $('#passCam').val(settings.camera_pass);
    $('#updateFreq').val(settings.update_frequency);
    $('#posX').val(settings.pos_x);
    $('#posY').val(settings.pos_y);
    $('#scale').val(settings.scale);
    $('#location').val(settings.location);
    $('#accessToken').val(settings.access_token);
    $('#displayLocation').val(settings.display_location);
    $('#coordinates').val(settings.coordinates);
  });

  $(".form-control").change(inputChanged);

  $(".myForm").submit(function() {
    return false;
  });
});

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_user': $('#userCam').val(),
    'camera_pass': $('#passCam').val(),
    'access_token': $('#accessToken').val(),
    "display_location":$('#displayLocation').val(),
    'coordinates': $('#coordinates').val(),
    'location': $('#location').val(),
    'pos_x': parseInt($('#posX').val()),
    'pos_y': parseInt($('#posY').val()),
    'update_frequency': parseInt($('#updateFreq').val()),
    'scale': parseInt($('#scale').val())
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=aqi&action=set', JSON.stringify(settings), function(data) {});
}