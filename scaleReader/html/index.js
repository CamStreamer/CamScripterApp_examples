$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=scaleReader&action=get', (settings) => {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {"camera_pass": "", "scale_ip": "", "scale_port": 10000, "service_id": "", "value_field_name": "", "unit_field_name": "", "refresh_rate": 300};
    }

    $('#cameraPass').val(settings.camera_pass);
    $('#scaleIP').val(settings.scale_ip);
    $('#scalePort').val(settings.scale_port);
    $('#serviceId').val(settings.service_id);
    $('#valueFieldName').val(settings.value_field_name);
    $('#unitFieldName').val(settings.unit_field_name);
    $('#refreshRate').val(settings.refresh_rate);
  });

  $(".form-control").change(inputChanged);

  $(".myForm").submit(() => {
    return false;
  });
});

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_pass': $('#cameraPass').val(),
    'scale_ip': $('#scaleIP').val(),
    'scale_port': parseInt($('#scalePort').val()),
    'service_id': $('#serviceId').val(),
    'value_field_name': $('#valueFieldName').val(),
    'unit_field_name': $('#unitFieldName').val(),
    'refresh_rate': parseInt($('#refreshRate').val())
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=scaleReader&action=set', JSON.stringify(settings), (data) => {});
}