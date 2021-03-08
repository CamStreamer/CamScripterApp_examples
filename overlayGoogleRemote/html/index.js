var fields = [];
$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=overlayremote&action=get', function(settings) {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {
        "camera_user": "root",
        "camera_pass": "",
        "remote_hide": false,
        "toggle_field": "E4",
        "sheet_addr": "http://",
        "refresh_rate": 3,
        "field_list": [
            {
                "name": "HOME",
                "field": "B4"
            }
        ],
        "overlay_id": 1
      };
    }

  });

  $(".form-control").change(inputChanged);

  $(".myForm").submit(function() {
    return false;
  });
});

function createLayout(settings) {
  $('#userCam').val(settings.camera_user);
  $('#passCam').val(settings.camera_pass);
  $('#updateFreq').val(settings.refresh_rate);
  $('#overlayID').val(settings.overlay_id);
  $('#sheetAddr').val(settings.sheet_addr);
  $('#remoteHideLoc').val(settings.toggle_field);
  $('#remoteHide').val(settings.remote_hide);
  $('#fieldContainer').html(genFields(settings.field_list.length));
  populateFields(settings.field_list);
}

function genFields(number) {
  let outputstring = "";
  for (let i = 0; i < number; i++){
    outputstring += "<div class=\"input-group\">";
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldName"+i+" placeholder=\"0\">";
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldLocation"+i+" placeholder=\"0\">";
    outputstring += "</div>";
  }
  return outputstring;
}

var field_count;

function populateFields(field_list){
  for (let i = 0; i < field_list.length; i++){
    $("#fieldName"+i).val(field_list[i]["name"]);
    $("#fieldLocation"+i).val(field_list[i]["field"]);
  }
  field_count = field_list.length;
}

function readTheFields(){
  let field_list = [];
  for (let i = 0; i < field_count; i++){
    let field = {
      "name": $("fieldName" + i).val(),
      "field": $("fieldLocation" + i).val()
    };
    field_list.push(field);
  }
  return field_list;
}

function addField(){
  field_count++;
  settings.field_list.push({"name": "NewField", "field": "A1"});
  $("fieldContainer").html(genFields(field_count));
  populateFields(settings.field_list);
}
function substractField(){
  field_count--;
  settings.field_list.pop();
  $("fieldContainer").html(genFields(field_count));
  populateFields(settings.field_list);
}

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_user': $('#userCam').val(),
    'camera_pass': $('#passCam').val(),
    'refresh_rate': $('#updateFreq').val(),
    "overlay_id":$('#overlayID').val(),
    'sheet_addr': $('#sheetAddr').val(),
    'toggle_field': $('#remoteHideLoc').val(),
    'remote_hide': parseInt($('#remoteHide').val()),
    'field_list': readTheFields()
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=overlayremote&action=set', JSON.stringify(settings), function(data) {});
}