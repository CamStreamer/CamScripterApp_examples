let unit = 'c';
$(document).ready(function() {

  $.get('/local/camscripter/package/settings.cgi?package_name=temper1fSensor&action=get', function(settings) {

    $('#ipCam').val(settings.camera_ip);
    $('#portCam').val(settings.camera_port);
    $('#userCam').val(settings.camera_user);
    $('#passCam').val(settings.camera_pass);
    $('#serviceID').val(settings.service_id);
    $('#fieldName').val(settings.field_name);
    $('input[name=u_select][value=' + settings.unit + ']').prop('checked', true);
    unit = settings.unit;
  });

  $(".form-control").change(inputChanged);
  $(".unit").click(radioClickedCallback);
  $(".myForm").submit(function() {
    return false;
  });
});



function radioClickedCallback() {
  unit = $(this).val();
  inputChanged();
}

function inputChanged() {
  var settings = {
    'camera_ip': $('#ipCam').val(),
    'camera_port': $('#portCam').val(),
    'camera_user': $('#userCam').val(),
    'camera_pass': $('#passCam').val(),
    'service_id': $('#serviceID').val(),
    'field_name': $('#fieldName').val(),
    'unit': unit
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=temper1fSensor&action=set', JSON.stringify(settings), function(data) {});
}