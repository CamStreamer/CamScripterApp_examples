var fields = [];
$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=camoverlay_remote_ctrl&action=get', function(settings) {
    if (Object.keys(settings).length == 0) {
      settings = {
        "camera_user": "root",
        "camera_pass": "",
        "remote_hide": false,
        "toggle_field": "E4",
        "sheet_addr": "",
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
    createLayout(settings);
  });
  $("#substractFieldBtn").click(substractField);
  $("#addFieldBtn").click(addField);
  $(".form-control").change(inputChanged);
  $("#forceSaveBtn").click(inputChanged);
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
  $('#fieldContainer').html(genFields(settings.field_list.length));
  populateFields(settings.field_list);
  $(".form-control").off();
  $(".form-control").change(inputChanged);

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
  fields = field_list;
}

function readTheFields(){
  let field_list = [];
  for (let i = 0; i < field_count; i++){
    let field = {
      "name": $("#fieldName" + i).val(),
      "field": $("#fieldLocation" + i).val()
    };
    field_list.push(field);
  }
  return field_list;
}

function addField(){
  field_count++;
  fields.push({"name": "NewField", "field": "A1"});
  $("#fieldContainer").html(genFields(field_count));
  populateFields(fields);
  $(".form-control").off();
  $(".form-control").change(inputChanged);
  inputChanged();
}
function substractField(){
  field_count--;
  fields.pop();
  $("#fieldContainer").html(genFields(field_count));
  populateFields(fields);
  $(".form-control").off();
  $(".form-control").change(inputChanged);
  inputChanged();
}

function inputChanged() {
  console.log('param changed');
  fields = readTheFields();
  var settings = {
    'camera_user': $('#userCam').val(),
    'camera_pass': $('#passCam').val(),
    'refresh_rate': $('#updateFreq').val(),
    'overlay_id':$('#overlayID').val(),
    'sheet_addr': $('#sheetAddr').val(),
    'field_list': fields
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=camoverlay_remote_ctrl&action=set', JSON.stringify(settings), function(data) {});
}