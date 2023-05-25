$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=lanScale&action=get', (settings) => {
        console.log(settings);

        $('#scaleIP').val(settings.scale_ip);
        $('#scalePort').val(settings.scale_port);
        $('#refreshRate').val(settings.refresh_rate);
        $('#serviceId').val(settings.service_id);
        $('#cameraProtocol').val(settings.camera_protocol);
        $('#cameraIP').val(settings.camera_ip);
        $('#cameraPort').val(settings.camera_port);
        $('#cameraUser').val(settings.camera_user);
        $('#cameraPass').val(settings.camera_pass);
        $('#valueFieldName').val(settings.value_field_name);
        $('#unitFieldName').val(settings.unit_field_name);
        $('#acsProtocol').val(settings.acs_protocol);
        $('#acsIP').val(settings.acs_ip);
        $('#acsWinUser').val(settings.acs_user);
        $('#acsWinPass').val(settings.acs_pass);
        $('#acsSourceKey').val(settings.acs_source_key);
        $('#msIP').val(settings.milestone_ip);
        $('#msPort').val(settings.milestone_port);
        $('#msString').val(settings.milestone_string);
        $('#msMinimumSpan').val(settings.milestone_minimum_span);
        $('#msSeparators').val(settings.milestone_separator.join(','));
    });

    $('#cameraProtocol').change(protocolChanged);
    $('.form-control').change(inputChanged);

    $('.myForm').submit(() => {
        return false;
    });
});

function protocolChanged() {
    const port = $('#cameraProtocol').val() === 'http' ? 80 : 443;
    $('#cameraPort').val(port);
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
        acs_protocol: $('#acsProtocol').val(),
        acs_ip: $('#acsIP').val(),
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
            .map((item) => parseInt(item)),
    };
    $.post(
        '/local/camscripter/package/settings.cgi?package_name=lanScale&action=set',
        JSON.stringify(settings),
        (data) => {}
    );
}
