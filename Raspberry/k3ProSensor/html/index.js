let unit = "c";

function radioClickedCallback() {
  unit = $(this).val();
  inputChanged();
}

$(document).ready(function () {
  $.get(
    "/local/camscripter/package/settings.cgi?package_name=temeperatureCheck&action=get",
    function (settings) {
      $("#ipCam").val(settings.camera_ip);
      $("#portCam").val(settings.camera_port);
      $("#userCam").val(settings.camera_user);
      $("#passCam").val(settings.camera_pass);
      $("#scale").val(settings.scale);
      $("#coordinates").val(settings.coordinates);
      $("#resW").val(settings.res_w);
      $("#resH").val(settings.res_h);
      $("#posX").val(settings.pos_x);
      $("#posY").val(settings.pos_y);
      $("#threshold").val(settings.threshold);
      $('input[name=u_select][value=' + settings.unit + ']').prop('checked', true);
      unit = settings.unit;
    }
  );

  $(".form-control").change(inputChanged);
  $(".unit").click(radioClickedCallback);

  $(".myForm").submit(function () {
    return false;
  });
});

function inputChanged() {
  var settings = {
    camera_ip: $("#ipCam").val(),
    camera_port: $("#portCam").val(),
    camera_user: $("#userCam").val(),
    camera_pass: $("#passCam").val(),
    coordinates: $("#coordinates").val(),
    pos_x: parseInt($("#posX").val()),
    pos_y: parseInt($("#posY").val()),
    res_w: parseInt($("#resW").val()),
    res_h: parseInt($("#resH").val()),
    scale: parseInt($("#scale").val()),
    threshold: parseFloat($("#threshold").val()),
    unit: unit,
  };
  $.post(
    "/local/camscripter/package/settings.cgi?package_name=temeperatureCheck&action=set",
    JSON.stringify(settings),
    function (data) {}
  );
}
