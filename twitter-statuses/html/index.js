var settings = null;

$(document).ready(function() {

  $.get('/local/camscripter/package/settings.cgi?package_name=twitter&action=get', function(data) {
    console.log(data);
    settings = data;
    if (Object.keys(settings).length == 0) {
      settings = {"filter": "twitter", "camera_user": "root", "camera_pass": "pass", "camera_ip": 80, "camera_ip": "127.0.0.1", "tweets_num": 3, "refresh_period": "10", "consumer_key": "", "consumer_secret": "", "access_token": "", "access_token_secret": ""};
    }

    $('#filter').val(settings.filter);
    $('#camera_user').val(settings.camera_user);
    $('#camera_ip').val(settings.camera_ip);
    $('#camera_port').val(settings.camera_port);
    $('#camera_pass').val(settings.camera_pass);
    $('#tweets_num').val(settings.tweets_num);
    $('#refresh_period').val(settings.refresh_period);
    $('#consumer_key').val(settings.consumer_key);
    $('#consumer_secret').val(settings.consumer_secret);
    $('#access_token').val(settings.access_token);
    $('#access_token_secret').val(settings.access_token_secret);
  });

  $(".form-control").change(inputChanged);

  $(".myForm").submit(function() {
    return false;
  });
});

function inputChanged() {
  console.log('param changed');
  settings = {
    'filter': $('#filter').val(),
    'camera_user': $('#camera_user').val(),
    'camera_ip': $('#camera_ip').val(),
    'camera_port': $('#camera_port').val(),
    'camera_pass': $('#camera_pass').val(),
    'tweets_num': $('#tweets_num').val(),
    'refresh_period': $('#refresh_period').val(),
    'consumer_key': $('#consumer_key').val(),
    'consumer_secret': $('#consumer_secret').val(),
    'access_token': $('#access_token').val(),
    'access_token_secret': $('#access_token_secret').val(),
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=twitter&action=set', JSON.stringify(settings), function(data) {});
}