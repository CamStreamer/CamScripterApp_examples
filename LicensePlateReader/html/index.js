$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=LicensePlateReader&action=get', function (settings) {
        $('#scIP').val(settings.sourceCamera.IP);
        $('#scPort').val(settings.sourceCamera.port);
        $('#scUser').val(settings.sourceCamera.user);
        $('#scPassword').val(settings.sourceCamera.password);

        $('#tcIP').val(settings.targetCamera.IP);
        $('#tcPort').val(settings.targetCamera.port);
        $('#tcUser').val(settings.targetCamera.user);
        $('#tcPassword').val(settings.targetCamera.password);

        $('#serviceID').val(settings.serviceID);
        $('#timeFormat').val(settings.timeFormat);
        $('#dateFormat').val(settings.dateFormat);
        $('#lpFieldName').val(settings.lpFieldName);
        $('#tsFieldName').val(settings.tsFieldName);
        $('#visibilityTime').val(settings.visibilityTime);
    });

    $(".form-control").change(inputChanged);

    $(".myForm").submit(function () {
        return false;
    });
});

function inputChanged() {
    let settings =
    {
        sourceCamera:
        {
            IP: $('#scIP').val(),
            port: $('#scPort').val(),
            user: $('#scUser').val(),
            password: $('#scPassword').val()
        },

        targetCamera:
        {
            IP: $('#tcIP').val(),
            port: $('#tcPort').val(),
            user: $('#tcUser').val(),
            password: $('#tcPassword').val()
        },

        serviceID: $('#serviceID').val(),
        timeFormat: $('#timeFormat').val(),
        dateFormat: $('#dateFormat').val(),
        lpFieldName: $('#lpFieldName').val(),
        tsFieldName: $('#tsFieldName').val()
    };
    
    let time = parseInt($('#visibilityTime').val());
    if (Number.isNaN(time) || time < 0) {
        settings.visibilityTime = 0;
        $('#visibilityTime').val(0);
    }
    else {
        settings.visibilityTime = time;
        $('#visibilityTime').val(time);
    }

    $.post('/local/camscripter/package/settings.cgi?package_name=LicensePlateReader&action=set', JSON.stringify(settings));
}
