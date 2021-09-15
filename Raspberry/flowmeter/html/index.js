$(document).ready(function() {
  loadSettings();

  $('#calibrationBtn').click(calibrate);
  $('#resetCounterBtn').click(resertCounter);
  $('#startBtn').click(start);
  $(".form-control").change(inputChanged);

  $(".myForm").submit(function() {
    return false;
  });
});

function loadSettings(){
  $.get('/local/camscripter/package/settings.cgi?package_name=flowmeter&action=get', function(settings) {
    console.log(settings);

    $('#userCam').val(settings.camera_user);
    $('#camIP').val(settings.camera_ip);
    $('#passCam').val(settings.camera_pass);
    $('#kFactor').val(settings.k_factor);
    $('#posX').val(settings.pos_x);
    $('#groupName').val(settings.group_name);
    $('#startTime').val(settings.start_time);
    $('#coordinates').val(settings.coord);
    $('#posY').val(settings.pos_y);
    $('#width').val(settings.res_w);
    $('#height').val(settings.res_h);
    $('#scale').val(settings.scale);
  });
}

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_user': $('#userCam').val(),
    'camera_pass': $('#passCam').val(),
    'camera_ip': $('#camIP').val(),
    'coord': $('#coordinates').val(),
    'k_factor': parseInt($('#kFactor').val()),
    'pos_x': parseInt($('#posX').val()),
    'pos_y': parseInt($('#posY').val()),
    'res_w': parseInt($('#width').val()),
    'res_h': parseInt($('#height').val()),
    'group_name': $('#groupName').val(),
    'start_time': $('#startTime').val(),
    'scale': parseFloat($('#scale').val())
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=flowmeter&action=set', JSON.stringify(settings), function(data) {});
}

function resertCounter(){
  $.get('/local/camscripter/proxy/flowmeter/reset_counter.cgi', function(data) {alarm('Counter reset')});
}

function calibrate(){
  let volume = $("#liters").val()
  $.get('/local/camscripter/proxy/flowmeter/calibrate.cgi?volume=' + volume, function(data) {
    if (data.k_factor){
      $('#kFactor').val(data.k_factor);
      inputChanged()
    }else{
      alarm('Please input the amout of liquid poured through for calibration');
    }

  });
}

function start(){
  $.get('/local/camscripter/proxy/flowmeter/start.cgi', function(data) { alarm('Starting!')});
}