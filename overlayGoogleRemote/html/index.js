var fields = [];
$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=camoverlay_remote_ctr0&action=get', function(settings) {
    if (Object.keys(settings).length != 0) {
      createLayout(settings);
    } else {
      console.log("Error: No settings file found!");
    }

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
  $('#camIP').val(settings.camera_ip);
  $('#camPort').val(settings.camera_port);
  $('#updateFreq').val(settings.refresh_rate);
  $('#overlayID').val(settings.overlay_id);
  $('#listName').val(settings.list_name);
  $('#apiKey').val(settings.api_key);
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
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldService"+i+" placeholder=\"0\">";
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
    $("#fieldService"+i).val(field_list[i]["service"]);

  }
  field_count = field_list.length;
  fields = field_list;
}

function readTheFields(){
  let field_list = [];
  for (let i = 0; i < field_count; i++){
    let field = {
      "name": $("#fieldName" + i).val(),
      "field": $("#fieldLocation" + i).val(),
      "service": $("#fieldLocation" + i).val()
    };
    field_list.push(field);
  }
  return field_list;
}

function addField(){
  field_count++;
  fields.push({"name": "NewField", "field": "A1", "service": 1});
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
    'camera_ip': $('#camIP').val(),
    'camera_port': $('#camPort').val(),
    'refresh_rate': $('#updateFreq').val(),
    'api_key': $('#apiKey').val(),
    'list_name': $('#listName').val(),
    'overlay_id':$('#overlayID').val(),
    'sheet_addr': $('#sheetAddr').val(),
    'field_list': fields
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=camoverlay_remote_ctr0&action=set', JSON.stringify(settings), function(data) {});
}
