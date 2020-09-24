$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=ui&action=get', function(settings) {
    if (Object.keys(settings).length == 0) {
      settings = {'color': 'red'};
    }

    $('#preview').css('backgroundColor', settings.color);
    $('input[name=color][value="' + settings.color + '"]').prop('checked', true);
  });

  $(".color").click(radioClickedCallback);
});

function radioClickedCallback() {
  $('#preview').css('backgroundColor', $(this).val());
  var settings = '{"color": "' + $(this).val() + '"}';
  $.post('/local/camscripter/package/settings.cgi?package_name=ui&action=set', settings, function(responseData) {});
}
