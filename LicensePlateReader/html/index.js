$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=LicensePlateReader&action=get', function (settings) {
        $('#scIP').val(settings.sourceCamera.IP);
        $('#scProtocol').val(settings.sourceCamera.protocol);
        $('#scPort').val(settings.sourceCamera.port);
        $('#scUser').val(settings.sourceCamera.user);
        $('#scPassword').val(settings.sourceCamera.password);

        $('#tcIP').val(settings.targetCamera.IP);
        $('#tcProtocol').val(settings.targetCamera.protocol);
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
    
    $("#scProtocol").change(() => protocolChanged("sc"));
    $("#tcProtocol").change(() => protocolChanged("tc"));
    $(".form-control").change(inputChanged);

    $(".myForm").submit(function () {
        return false;
    });
});

function protocolChanged(prefix) {
    if ($(`#${prefix}Protocol`).val() === "http")
    {
        $(`#${prefix}Port`).val(80);
    }
    else
    {
        $(`#${prefix}Port`).val(443);
    }
}

function inputChanged() {
    let settings =
    {
        sourceCamera:
        {
            IP: $('#scIP').val(),
            protocol: $('#scProtocol').val(),
            port: $('#scPort').val(),
            user: $('#scUser').val(),
            password: $('#scPassword').val()
        },

        targetCamera:
        {
            IP: $('#tcIP').val(),
            protocol: $('#tcProtocol').val(),
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
