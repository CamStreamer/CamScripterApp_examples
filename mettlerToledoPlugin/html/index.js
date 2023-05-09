$(document).ready(() => {
    $.get('/local/camscripter/package/settings.cgi?package_name=mettlerToledoPlugin&action=get', (settings) => {
        $('input[name=u_select][value=' + settings.unit + ']').prop('checked', true);
        $('#scaleIP').val(settings.scale_ip);
        $('#scalePort').val(settings.scale_port);
        $('#scaleDataType').val(settings.scale_data_type);
        $('#cameraIP').val(settings.camera_ip);
        $('#cameraPort').val(settings.camera_port);
        $('#cameraUser').val(settings.camera_user);
        $('#cameraPass').val(settings.camera_pass);
        $(`input[name=widgetTypeOptions][value='${settings.widget_type}']`).prop('checked', true);
        $('#widgetCoordSystem').val(settings.widget_coord_system);
        $('#widgetPosX').val(settings.widget_pos_x);
        $('#widgetPosY').val(settings.widget_pos_y);
        $('#widgetStreamWidth').val(settings.widget_stream_width);
        $('#widgetStreamHeight').val(settings.widget_stream_height);
        $('#widgetScale').val(settings.widget_scale);
        $('#cgServiceId').val(settings.cg_service_id);
        $('#cgFieldName').val(settings.cg_field_name);
        $('#acsProtocol').val(settings.acs_protocol);
        $('#acsIP').val(settings.acs_ip);
        $('#acsWinUser').val(settings.acs_user);
        $('#acsWinPass').val(settings.acs_pass);
        $('#acsSourceKey').val(settings.acs_source_key);

        renderWidgetForm();

        $('input[type="radio"]').on('change', () => {
            renderWidgetForm();
            inputChanged();
        });
        $('.myForm').submit(() => {
            return false;
        });

        $('#title').show(300, () => {
            $('#tabs').show(300, () => {});
        });
    });
});

function renderWidgetForm() {
    const radioVal = $('input[name=widgetTypeOptions]:checked', '.myForm').val();
    if (radioVal === 'generated') {
        $('#generatedWidgetSettings').show();
        $('#customGraphicsSettings').hide();
    } else {
        $('#customGraphicsSettings').show();
        $('#generatedWidgetSettings').hide();
    }
    $('.form-control').off().change(inputChanged);
}

function inputChanged() {
    const settings = {
        scale_ip: $('#scaleIP').val(),
        scale_port: parseInt($('#scalePort').val()),
        scale_data_type: $('#scaleDataType').val(),
        camera_ip: $('#cameraIP').val(),
        camera_port: parseInt($('#cameraPort').val()),
        camera_user: $('#cameraUser').val(),
        camera_pass: $('#cameraPass').val(),
        widget_type: $('input[name=widgetTypeOptions]:checked', '.myForm').val(),
        widget_coord_system: $('#widgetCoordSystem').val(),
        widget_pos_x: parseInt($('#widgetPosX').val()),
        widget_pos_y: parseInt($('#widgetPosY').val()),
        widget_stream_width: parseInt($('#widgetStreamWidth').val()),
        widget_stream_height: parseInt($('#widgetStreamHeight').val()),
        widget_scale: parseFloat($('#widgetScale').val()),
        cg_service_id: parseInt($('#cgServiceId').val()),
        cg_field_name: $('#cgFieldName').val(),
        acs_protocol: $('#acsProtocol').val(),
        acs_ip: $('#acsIP').val(),
        acs_user: $('#acsWinUser').val(),
        acs_pass: $('#acsWinPass').val(),
        acs_source_key: $('#acsSourceKey').val(),
    };
    $.post(
        '/local/camscripter/package/settings.cgi?package_name=mettlerToledoPlugin&action=set',
        JSON.stringify(settings),
        (data) => {}
    );
}
