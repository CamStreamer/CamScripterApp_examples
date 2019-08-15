$(document).ready(function() {
  $.get('/local/camscripter/proxy/ui_advanced/get_color.cgi', function(data) {
    $('#preview').css('backgroundColor', data.color);
    $('input[name=color][value="' + data.color + '"]').prop('checked', true);
  });

  $(".color").click(radioClickedCallback);
});

function radioClickedCallback() {
  $('#preview').css('backgroundColor', $(this).val());
  var data = '{"color": "' + $(this).val() + '"}';
  $.get('/local/camscripter/proxy/ui_advanced/set_color.cgi?data=' + data, function(data) {});
}
