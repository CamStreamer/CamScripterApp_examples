$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=lanScale&action=get', (settings) => {
    console.log(settings);

    $('#cameraUser').val(settings.camera_user);
    $('#camIP').val(settings.camera_ip);
    $('#cameraPass').val(settings.camera_pass);
    $('#scaleIP').val(settings.scale_ip);
    $('#cameraPort').val(settings.camera_port);
    $('#scalePort').val(settings.scale_port);
    $('#serviceId').val(settings.service_id);
    $('#valueFieldName').val(settings.value_field_name);
    $('#unitFieldName').val(settings.unit_field_name);
    $('#refreshRate').val(settings.refresh_rate);
    $('#msString').val(settings.milestone_string);
    $('#msIP').val(settings.milestone_ip);
    $('#msPort').val(settings.milestone_port);
    $('#minimumSpan').val(settings.minimum_span);
    $('#msSeparators').val(settings.milestone_separator.join(','));
  });

  $(".form-control").change(inputChanged);

  $(".myForm").submit(() => {
    return false;
  });
});

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_user': $('#cameraUser').val(),
    'camera_ip': $('#camIP').val(),
    'camera_pass': $('#cameraPass').val(),
    'camera_port': $('#cameraPort').val(),
    'scale_ip': $('#scaleIP').val(),
    'scale_port': parseInt($('#scalePort').val()),
    'service_id': $('#serviceId').val(),
    'value_field_name': $('#valueFieldName').val(),
    'unit_field_name': $('#unitFieldName').val(),
    'milestone_ip': $('#msIP').val(),
    'milestone_string': $('#msString').val(),
    'milestone_port': parseInt($('#msPort').val()),
    'refresh_rate': parseInt($('#refreshRate').val()),
    'minimum_span': parseInt($('#minimumSpan').val()),
    'milestone_separator': $('#msSeparators').val().split(',').map(function(item){ return parseInt(item);})
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=lanScale&action=set', JSON.stringify(settings), (data) => {});
}