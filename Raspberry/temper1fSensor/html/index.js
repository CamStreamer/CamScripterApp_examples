let unit = 'c';
$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=temper1fSensor&action=get', (settings) => {
        $('input[name=u_select][value=' + settings.unit + ']').prop('checked', true);
        $('#cameraIP').val(settings.camera_ip);
        $('#cameraPort').val(settings.camera_port);
        $('#cameraUser').val(settings.camera_user);
        $('#cameraPass').val(settings.camera_pass);
        $('#serviceId').val(settings.service_id);
        $('#fieldName').val(settings.field_name);
        $('#acsIP').val(settings.acs_ip);
        $('#acsWinUser').val(settings.acs_user);
        $('#acsWinPass').val(settings.acs_pass);
        $('#acsSourceKey').val(settings.acs_source_key);
        $('#acsConditionDelay').val(settings.acs_condition_delay ?? 0);
        $('#acsConditionOperator').val(settings.acs_condition_operator ?? 1);
        $('#acsConditionValue').val(settings.acs_condition_value ?? 10);
        unit = settings.unit;
        unitChanged();
    });

    $('.form-control').change(inputChanged);
    $('.unit').click(radioClickedCallback);
    $('.myForm').submit(function () {
        return false;
    });
});

function radioClickedCallback() {
    unit = $(this).val();
    unitChanged();
}

function unitChanged() {
    $('#acsConditionUnit').text(String.fromCharCode(176) + unit.toLocaleUpperCase());
    inputChanged();
}

function inputChanged() {
    const settings = {
        unit: unit,
        camera_ip: $('#cameraIP').val(),
        camera_port: $('#cameraPort').val(),
        camera_user: $('#cameraUser').val(),
        camera_pass: $('#cameraPass').val(),
        service_id: $('#serviceId').val(),
        field_name: $('#fieldName').val(),
        acs_ip: $('#acsIP').val(),
        acs_user: $('#acsWinUser').val(),
        acs_pass: $('#acsWinPass').val(),
        acs_source_key: $('#acsSourceKey').val(),
        acs_condition_delay: parseInt($('#acsConditionDelay').val()),
        acs_condition_operator: parseInt($('#acsConditionOperator').val()),
        acs_condition_value: parseFloat($('#acsConditionValue').val()),
    };
    $.post(
        '/local/camscripter/package/settings.cgi?package_name=temper1fSensor&action=set',
        JSON.stringify(settings),
        (data) => {}
    );
}
