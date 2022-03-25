let fields = [];
$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=remote_api&action=get', function(settings) {
    if (Object.keys(settings).length != 0) {
      createLayout(settings);
    } else {
      console.log("Error: No settings file found!");
    }

  });
  $("#subtractFieldBtn").click(substractField);
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
  $('#listName').val(settings.list_name);
  $('#apiKey').val(settings.api_key);
  $('#sheetAddr').val(settings.sheet_addr);
  $('#fieldContainer').html(genFields(settings.field_list.length));
  fields = settings.field_list;
  populateFields(settings.field_list);
  $(".form-control").off();
  $(".form-control").change(inputChanged);

}

function genFields(number) {
  let outputstring = "";
  for (let i = 0; i < number; i++){
    outputstring += "<div class=\"input-group\">";
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldName"+i+" >";
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldCommand"+i+" placeholder=\"http://\">";
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldLocation"+i+" placeholder=\"A1\">";
    outputstring += "<input type=\"text\" class=\"form-control\" id=fieldTrigg"+i+" placeholder=\"TRUE\">";
    outputstring += "</div>";
  }
  return outputstring;
}


function populateFields(field_list){
  for (let i = 0; i < field_list.length; i++){
    $("#fieldName"+i).val(field_list[i]["name"]);
    $("#fieldCommand"+i).val(field_list[i]["command"]);
    $("#fieldLocation"+i).val(field_list[i]["field"]);
    $("#fieldTrigg"+i).val(field_list[i]["trigger"]);
  }
}

function readTheFields(){
  let field_list = [];
  for (let i = 0; i < fields.length; i++){
    let field = {
      "name": $("#fieldName" + i).val(),
      "command": $("#fieldCommand" + i).val(),
      "field": $("#fieldLocation" + i).val(),
      "trigger": $("#fieldTrigg" + i).val()
    };
    field_list.push(field);
  }
  return field_list;
}

function addField(){
  fields.push({"name": "NewField","command": "http://", "field": "A1", "trigger": "TRUE"});
  $("#fieldContainer").html(genFields(fields.length));
  populateFields(fields);
  $(".form-control").off();
  $(".form-control").change(inputChanged);
  inputChanged();
}
function substractField(){
  fields.pop();
  $("#fieldContainer").html(genFields(fields.length));
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
    'sheet_addr': $('#sheetAddr').val(),
    'field_list': fields
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=remote_api&action=set', JSON.stringify(settings), function(data) {});
}
