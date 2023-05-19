$(document).ready(() => {
    $.get('/local/camscripter/package/settings.cgi?package_name=qrBarcodeReader&action=get', (settings) => {
        $('#cameraProtocol').val(settings.camera_protocol);
        $('#cameraIP').val(settings.camera_ip);
        $('#cameraPort').val(settings.camera_port);
        $('#cameraUser').val(settings.camera_user);
        $('#cameraPass').val(settings.camera_pass);
        $('#widgetGraphicType').val(settings.widget_graphic_type);
        $('#widgetVisibilityTime').val(settings.widget_visibility_time);
        $('#widgetCoordSystem').val(settings.widget_coord_system);
        $('#widgetPosX').val(settings.widget_pos_x);
        $('#widgetPosY').val(settings.widget_pos_y);
        $('#widgetStreamWidth').val(settings.widget_stream_width);
        $('#widgetStreamHeight').val(settings.widget_stream_height);
        $('#widgetScale').val(settings.widget_scale);
        $('#acsProtocol').val(settings.acs_protocol);
        $('#acsIP').val(settings.acs_ip);
        $('#acsWinUser').val(settings.acs_user);
        $('#acsWinPass').val(settings.acs_pass);
        $('#acsSourceKey').val(settings.acs_source_key);
    });

    $('#cameraProtocol').change(protocolChanged);
    $('.form-control').change(inputChanged);
    $('.myForm').submit(() => {
        return false;
    });

    $('#title').show(300, () => {
        $('#tabs').show(300, () => {});
    });
});

function protocolChanged() {
    const port = $('#cameraProtocol').val() === 'http' ? 80 : 443;
    $('#cameraPort').val(port);
}

function inputChanged() {
    const settings = {
        camera_protocol: $('#cameraProtocol').val(),
        camera_ip: $('#cameraIP').val(),
        camera_port: parseInt($('#cameraPort').val()),
        camera_user: $('#cameraUser').val(),
        camera_pass: $('#cameraPass').val(),
        widget_graphic_type: $('#widgetGraphicType').val(),
        widget_visibility_time: parseInt($('#widgetVisibilityTime').val()),
        widget_coord_system: $('#widgetCoordSystem').val(),
        widget_pos_x: parseInt($('#widgetPosX').val()),
        widget_pos_y: parseInt($('#widgetPosY').val()),
        widget_stream_width: parseInt($('#widgetStreamWidth').val()),
        widget_stream_height: parseInt($('#widgetStreamHeight').val()),
        widget_scale: parseFloat($('#widgetScale').val()),
        acs_protocol: $('#acsProtocol').val(),
        acs_ip: $('#acsIP').val(),
        acs_user: $('#acsWinUser').val(),
        acs_pass: $('#acsWinPass').val(),
        acs_source_key: $('#acsSourceKey').val(),
    };
    $.post(
        '/local/camscripter/package/settings.cgi?package_name=qrBarcodeReader&action=set',
        JSON.stringify(settings),
        (data) => {}
    );
}
