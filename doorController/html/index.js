var alertID = 0;
var users = {};
var userTokenClicked = '';

$(document).ready(function() {
  $.get('/local/camscripter/package/settings.cgi?package_name=doorController&action=get', function(settings) {
    console.log(settings);
    if (Object.keys(settings).length == 0) {
      settings = {"camera_user": "root", "camera_pass": "", "controller_host": "", "controller_port": 80, "controller_user": "root", "controller_pass": "", "pos_x": 0, "pos_y": 0, "width": 1920, "height": 1080, "scale": 1.0};
    }

    $('#cameraUser').val(settings.camera_user);
    $('#cameraPass').val(settings.camera_pass);
    $('#ctrlHost').val(settings.controller_host);
    $('#ctrlPort').val(settings.controller_port);
    $('#ctrlUser').val(settings.controller_user);
    $('#ctrlPass').val(settings.controller_pass);
    $('#posX').val(settings.pos_x);
    $('#posY').val(settings.pos_y);
    $('#width').val(settings.width);
    $('#height').val(settings.height);
    $('#scale').val(settings.scale.toFixed(1));
  });

  $(".form-control:not(#uploadedImage)").change(inputChanged);
  $("#uploadedImage").change(uploadedImageChanged);


  $(".myForm").submit(function() {
    return false;
  });

  $("#checkConnectionBtn").click(loadUsers);
});

function inputChanged() {
  console.log('param changed');
  var settings = {
    'camera_user': $('#cameraUser').val(),
    'camera_pass': $('#cameraPass').val(),
    'controller_host': $('#ctrlHost').val(),
    'controller_port': parseInt($('#ctrlPort').val()),
    'controller_user': $('#ctrlUser').val(),
    'controller_pass': $('#ctrlPass').val(),
    'pos_x': parseInt($('#posX').val()),
    'pos_y': parseInt($('#posY').val()),
    'width': parseInt($('#width').val()),
    'height': parseInt($('#height').val()),
    'scale': parseFloat($('#scale').val())
  };
  $.post('/local/camscripter/package/settings.cgi?package_name=doorController&action=set', JSON.stringify(settings), function(data) {});
}

function loadUsers() {
  $('#userList').html('');
  $.get('/local/camscripter/package/doorController/proxy/get_credentials.cgi', function(credentialsResponse) {
    credentialsResponse = JSON.parse(credentialsResponse);
    $.get('/local/camscripter/package/doorController/proxy/get_users.cgi', function(usersResponse) {
      users = JSON.parse(usersResponse);
      // Add info about card to users
      for (var cardId in credentialsResponse) {
        var userToken = credentialsResponse[cardId];
        if (users.hasOwnProperty(userToken)) {
          users[userToken].card = cardId;
        }
      }
      console.log(users);
      createUserList();
      showMessage('success', 'Connection successful.')
    }).fail(function() {
      showMessage('danger', 'Connection error. Change connection parameters or try it again later.')
    });
  }).fail(function() {
    showMessage('danger', 'Connection error. Change connection parameters or try it again later.')
  });
}

function createUserList() {
  var usersCount = Object.keys(users).length;
  if (usersCount == 0) {
    return;
  }

  var html = '<table id="userTable" class="table table-striped table-bordered" style="width:100%">';
  html += '<thead><tr><th>Name</th><th class="text-center">Card</th><th class="text-center">Image</th></thead>';
  html += '<tbody>';
  for (var userToken in users) {
    var user = users[userToken];
    html += '<tr>';
    html += '<td>' + user.name + '</td><td class="text-center">' + user.card + '</td>';
    html += '<td class="text-center">';
    html += '<i id="' + userToken + '" class="showImage far fa-image" title="Show image" style="cursor: hand; cursor: pointer;"></i>&nbsp;&nbsp;';
    html += '<i id="' + userToken + '" class="uploadImage far fa-arrow-alt-circle-up" title="Upload image" style="cursor: hand; cursor: pointer;"></i>&nbsp;&nbsp;';
    html += '<i id="' + userToken + '" class="deleteImage far fa-trash-alt" title="Delete image" style="cursor: hand; cursor: pointer;"></i>';
    html += '<sup class="text-danger"> *</sup>';
    html += '</td>';
    html += '</tr>';
  }
  html += '<tbody></table>';

  // Add legend
  html += '<div>&nbsp;</div>';
  html += '<div class="text-danger">* Profile picture resolution: 144x182px (or same aspect ration).</div>';

  $('#userList').html(html);
  $('#userTable').DataTable();

  $('.showImage').click(function(event) {
    $('#imgPrevModalTitle').text(user.name);
    $('#imgPrevModalImage').attr('src', '/local/camscripter/package/doorController/proxy/image.cgi?userToken=' + encodeURIComponent(event.target.id));
    $('#imgPrevModal').modal('show');
  });
  $('.uploadImage').click(function(event) {
    userTokenClicked = event.target.id;
    $("#uploadedImage").val('');
    $('#uploadedImage').trigger('click');
  });
  $('.deleteImage').click(function(event) {
    $.get('/local/camscripter/package/doorController/proxy/delete_image.cgi?userToken=' + encodeURIComponent(event.target.id), function() {
      showMessage('success', 'Image deleted.')
    });
  });
}

function uploadedImageChanged() {
  if (userTokenClicked == undefined || userTokenClicked.length == 0) {
    showMessage('danger', 'No card is defined for this user.')
    return;
  }

  var form = $('#imgForm')[0];
  var formData = new FormData(form);
  formData.append("userToken", userTokenClicked);

  $.ajax({
    url: '/local/camscripter/package/doorController/proxy/upload_image.cgi',
    data: formData,
    type: 'POST',
    contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
    processData: false, // NEEDED, DON'T OMIT THIS
    complete: function(jqXHR, status) {
      if (status == 'error') {
        showMessage('danger', 'Save image error.')
        return;
      }
      showMessage('success', 'Image uploaded.')
    }
  });

  return false;
}

function showMessage(type, html, static) {
  var header = 'Info';
  if (type == 'success')
    header = 'Success:';
  else if (type == 'warning')
    header = 'Warning!';
  else if (type == 'danger')
    header = 'Error!';

  var id = alertID++;
  var message = '<div id="alert' + id + '" class="alert alert-dismissible alert-' + type + '">';
  message += '<button type="button" class="close" data-dismiss="alert">&times;</button>'
  message += '<span class="font-weight-bold">' + header + '</span> ' + html;
  message += '</div>';
  $('#messages').append(message);

  if (static == undefined || static == false)
  {
    window.scrollTo(0, 0);
    $('#alert' + id).fadeTo(5000, 500).slideUp(500, function(){
      $('#alert' + id).alert('close');
    });
  }
}