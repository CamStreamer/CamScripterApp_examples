const nameOfThisPackage = 'imco_power_monitor';

$(document).ready(function () {
    $.get(`/local/camscripter/package/settings.cgi?package_name=${nameOfThisPackage}&action=get`, function (settings) {
        $('#co_protocol').val(settings.co_camera.protocol);
        $('#co_ip').val(settings.co_camera.ip);
        $('#co_port').val(settings.co_camera.port);
        $('#co_user').val(settings.co_camera.user);
        $('#co_password').val(settings.co_camera.password);

        $('#events_protocol').val(settings.events_camera.protocol);
        $('#events_ip').val(settings.events_camera.ip);
        $('#events_port').val(settings.events_camera.port);
        $('#events_user').val(settings.events_camera.user);
        $('#events_password').val(settings.events_camera.password);

        $('#temperature_delay').val(settings.events.temperature_delay);
        $('#temperature_operator').val(settings.events.temperature_operator);
        $('#temperature_value').val(settings.events.temperature_value);
        $('#door_delay').val(settings.events.door_delay);
        $('#battery_percentage').val(settings.events.battery_charge_percentage);
    });

    $('#co_protocol').change(() => protocolChanged('co'));
    $('#events_protocol').change(() => protocolChanged('events'));
    $('.form-control').change(inputChanged);
    $('form').submit(function () {
        return false;
    });
});

function protocolChanged(prefix) {
    $(`#${prefix}_port`).val($(`#${prefix}_protocol`).val() == 'http' ? 80 : 443);
}

function removeEventClick() {
    const index = buttons.indexOf(this);
    eventForms.splice(index, 1);
    buttons.splice(index, 1);
    $(this).parents('form').remove();
    inputChanged();
}

function inputChanged() {
    let settings = {
        co_camera: {
            protocol: $('#co_protocol').val(),
            ip: $('#co_ip').val(),
            port: Number.parseInt($('#co_port').val()),
            user: $('#co_user').val(),
            password: $('#co_password').val(),
        },

        events_camera: {
            protocol: $('#events_protocol').val(),
            ip: $('#events_ip').val(),
            port: Number.parseInt($('#events_port').val()),
            user: $('#events_user').val(),
            password: $('#events_password').val(),
        },

        events: {
            temperature_delay: Number.parseInt($('#temperature_delay').val()),
            temperature_operator: $('#temperature_operator').val(),
            temperature_value: Number.parseInt($('#temperature_value').val()),
            door_delay: Number.parseInt($('#door_delay').val()),
            battery_charge_percentage: Number.parseInt($('#battery_percentage').val()),
        },
    };

    if (settings.events.battery_charge_percentage > 100) {
        settings.events.battery_charge_percentage = 100;
        $('#battery_percentage').val(100);
    } else if (settings.events.battery_charge_percentage < 0) {
        settings.events.battery_charge_percentage = 0;
        $('#battery_percentage').val(0);
    } else if (settings.events.temperature_delay < 0) {
        settings.events.temperature_delay = 0;
        $('#temperature_delay').val(0);
    } else if (settings.events.door_delay < 0) {
        settings.events.door_delay = 0;
        $('#door_delay').val(0);
    }

    $.post(
        `/local/camscripter/package/settings.cgi?package_name=${nameOfThisPackage}&action=set`,
        JSON.stringify(settings)
    );
}
