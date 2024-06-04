$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=weighing_scale&action=get', (settings) => {
        console.log(settings);

        $('#scaleIP').val(settings.scale_ip);
        $('#scalePort').val(settings.scale_port);
        $('#refreshRate').val(settings.refresh_rate);

        $('#cameraProtocol').val(settings.camera_protocol);
        $('#cameraIP').val(settings.camera_ip);
        $('#cameraPort').val(settings.camera_port);
        $('#cameraUser').val(settings.camera_user);
        $('#cameraPass').val(settings.camera_pass);
        $('#serviceId').val(settings.service_id);
        $('#valueFieldName').val(settings.value_field_name);
        $('#unitFieldName').val(settings.unit_field_name);

        $('#eventCameraProtocol').val(settings.camera_protocol);
        $('#eventCameraIP').val(settings.camera_ip);
        $('#eventCameraPort').val(settings.camera_port);
        $('#eventCameraUser').val(settings.camera_user);
        $('#eventCameraPass').val(settings.camera_pass);
        $('#eventConditionDelay').val(settings.event_condition_delay ?? 0);
        $('#eventConditionOperator').val(settings.event_condition_operator ?? 1);
        $('#eventConditionValue').val(settings.event_condition_value ?? 10);

        $('#acsProtocol').val(settings.acs_protocol);
        $('#acsIP').val(settings.acs_ip);
        $('#acsPort').val(settings.acs_port);
        $('#acsWinUser').val(settings.acs_user);
        $('#acsWinPass').val(settings.acs_pass);
        $('#acsSourceKey').val(settings.acs_source_key);

        $('#msIP').val(settings.milestone_ip);
        $('#msPort').val(settings.milestone_port);
        $('#msString').val(settings.milestone_string);
        $('#msMinimumSpan').val(settings.milestone_minimum_span);
        $('#msSeparators').val(settings.milestone_separator.join(','));
    });

    $('#cameraProtocol').change(() => protocolChanged("camera"));
    $('#eventCameraProtocol').change(() => protocolChanged("eventCamera"));
    $('.form-control').change(inputChanged);

    $('.myForm').submit(() => {
        return false;
    });
});

function protocolChanged(prefix) {
    const port = $(`#${prefix}Protocol`).val() === 'http' ? 80 : 443;
    $(`#${prefix}Port`).val(port);
}

function inputChanged() {
    console.log('param changed');
    const settings = {
        scale_ip: $('#scaleIP').val(),
        scale_port: parseInt($('#scalePort').val()),
        refresh_rate: parseInt($('#refreshRate').val()),

        camera_protocol: $('#cameraProtocol').val(),
        camera_ip: $('#cameraIP').val(),
        camera_port: $('#cameraPort').val(),
        camera_user: $('#cameraUser').val(),
        camera_pass: $('#cameraPass').val(),
        service_id: $('#serviceId').val(),
        value_field_name: $('#valueFieldName').val(),
        unit_field_name: $('#unitFieldName').val(),

        event_camera_protocol: $('#eventCameraProtocol').val(),
        event_camera_ip: $('#eventCameraIP').val(),
        event_camera_port: $('#eventCameraPort').val(),
        event_camera_user: $('#eventCameraUser').val(),
        event_camera_pass: $('#eventCameraPass').val(),
        event_condition_delay: $('#eventConditionDelay').val(),
        event_condition_operator: $('#eventConditionOperator').val(),
        event_condition_value: $('#eventConditionValue').val(),

        acs_protocol: $('#acsProtocol').val(),
        acs_ip: $('#acsIP').val(),
        acs_port: parseInt($('#acsPort').val()),
        acs_user: $('#acsWinUser').val(),
        acs_pass: $('#acsWinPass').val(),
        acs_source_key: $('#acsSourceKey').val(),

        milestone_ip: $('#msIP').val(),
        milestone_port: parseInt($('#msPort').val()),
        milestone_string: $('#msString').val(),
        milestone_minimum_span: parseInt($('#msMinimumSpan').val()),
        milestone_separator: $('#msSeparators')
            .val()
            .split(',')
            .map((item) => parseInt(item))
    };

    $.post('/local/camscripter/package/settings.cgi?package_name=weighing_scale&action=set', JSON.stringify(settings));
}
