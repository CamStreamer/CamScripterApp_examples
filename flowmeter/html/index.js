let savedStarted = false;

$(document).ready(function () {
    loadSettings();

    $('#startBtn').click(start);
    $('#stopBtn').click(stop);
    $('#resetCounterBtn').click(resertCounter);
    $('#calibrationBtn').click(calibrationStart);
    $('#calibrationCalibrateBtn').click(calibrationCalibrate);
    $('.form-control').not('#calibrationVolume').change(inputChanged);

    $('.myForm').submit(function () {
        return false;
    });
});

function loadSettings() {
    $.get('/local/camscripter/package/settings.cgi?package_name=flowmeter&action=get', function (settings) {
        console.log(settings);

        savedStarted = settings.started;
        setButtonsState(settings.started);

        $('#cameraIP').val(settings.camera_ip);
        $('#cameraPort').val(settings.camera_port);
        $('#cameraUser').val(settings.camera_user);
        $('#cameraPass').val(settings.camera_pass);
        $('#groupName').val(settings.group_name);
        $('#startTime').val(settings.start_time);
        $('#width').val(settings.res_w);
        $('#height').val(settings.res_h);
        $('#posX').val(settings.pos_x);
        $('#posY').val(settings.pos_y);
        $('#coordinates').val(settings.coord);
        $('#scale').val(settings.scale);
    });
}

function inputChanged() {
    console.log('params changed');
    const settings = {
        started: savedStarted,
        camera_ip: $('#cameraIP').val(),
        camera_port: parseInt($('#cameraPort').val()),
        camera_user: $('#cameraUser').val(),
        camera_pass: $('#cameraPass').val(),
        group_name: $('#groupName').val(),
        start_time: $('#startTime').val(),
        res_w: parseInt($('#width').val()),
        res_h: parseInt($('#height').val()),
        pos_x: parseInt($('#posX').val()),
        pos_y: parseInt($('#posY').val()),
        coord: $('#coordinates').val(),
        scale: parseFloat($('#scale').val()),
    };
    $.post(
        '/local/camscripter/package/settings.cgi?package_name=flowmeter&action=set',
        JSON.stringify(settings),
        (data) => {}
    );
}

function start() {
    savedStarted = true;
    setButtonsState(savedStarted);
    inputChanged();
    makeAlert('Flow meter reading started!', false);
}

function stop() {
    savedStarted = false;
    setButtonsState(savedStarted);
    inputChanged();
    makeAlert('Flow meter reading stopped!', false);
}

function resertCounter() {
    $.get('/local/camscripter/proxy/flowmeter/reset_counter.cgi', (data) => {})
        .done(() => {
            makeAlert('Counter reseted!', false);
        })
        .fail((xhr) => {
            console.error(xhr.responseText);
            makeAlert('Counter reset error, see the camera log for more details.', true);
        });
}

function calibrationStart() {
    $.get('/local/camscripter/proxy/flowmeter/calibration_start.cgi?')
        .done(() => {
            $('#calibrationModal').modal('show');
        })
        .fail((xhr) => {
            console.error(xhr.responseText);
            makeAlert('Start calibration error, see the camera log for more details.', true);
        });
}

function calibrationCalibrate() {
    const volume = $('#calibrationVolume').val();
    $.get(`/local/camscripter/proxy/flowmeter/calibration_calibrate.cgi?volume=${volume}`)
        .done(() => {
            $('#calibrationModal').modal('hide');
            makeAlert('Calibration finished!', false);
        })
        .fail((xhr) => {
            console.error(xhr.responseText);
            $('#calibrationModal').modal('hide');
            makeAlert('Calibration error, see the camera log for more details.', true);
        });
}

function setButtonsState(started) {
    if (started) {
        $('#startBtn').prop('disabled', true);
        $('#stopBtn').prop('disabled', false);
        $('#resetCounterBtn').prop('disabled', true);
        $('#calibrationBtn').prop('disabled', true);
    } else {
        $('#startBtn').prop('disabled', false);
        $('#stopBtn').prop('disabled', true);
        $('#resetCounterBtn').prop('disabled', false);
        $('#calibrationBtn').prop('disabled', false);
    }
}

let alertIdCounter = 0;
function makeAlert(text, error) {
    const id = alertIdCounter++;
    const alertTypeText = error ? 'Error:' : ' Success:';
    const alertClass = error ? 'alert-danger' : ' alert-success';
    const alert =
        `<div id="alert_${id}" class="alert ${alertClass} alert-dismissible fade show" role="alert">` +
        `<strong>${alertTypeText}</strong> ${text}` +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '</div>';

    $('#alerts').append(alert);

    setTimeout(() => {
        $(`#alert_${id}`).alert('close');
    }, 3000);
}
