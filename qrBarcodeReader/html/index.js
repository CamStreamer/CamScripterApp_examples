let settings = null;

$(document).ready(() => {
    $.get('/local/camscripter/package/settings.cgi?package_name=qrBarcodeReader&action=get', (settingsResponse) => {
        settings = settingsResponse;

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

        renderCameraPicker();
    });

    $('#cameraProtocol').change(protocolChanged);
    $('#widgetCameraList').on('changed.bs.select', cameraPickerChanged);
    $('.form-control:not(#widgetCameraList,[class^="dropdown"])').change(inputChanged);
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
    settings = {
        camera_protocol: $('#cameraProtocol').val(),
        camera_ip: $('#cameraIP').val(),
        camera_port: parseInt($('#cameraPort').val()),
        camera_user: $('#cameraUser').val(),
        camera_pass: $('#cameraPass').val(),
        widget_graphic_type: $('#widgetGraphicType').val(),
        widget_camera_list: settings.widget_camera_list,
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

    renderCameraPicker();
    $.post('/local/camscripter/package/settings.cgi?package_name=qrBarcodeReader&action=set', JSON.stringify(settings));
}

async function renderCameraPicker() {
    try {
        const cameraSelect = $('#widgetCameraList');
        cameraSelect.selectpicker();
        cameraSelect.empty();

        const channelList = await getChannelList();

        const selectedValues = [];
        for (let i = 0; i < channelList.length; i++) {
            const newOption = $('<option>').text(channelList[i].name).val(channelList[i].index);
            cameraSelect.append(newOption);
            if (settings?.widget_camera_list?.includes(channelList[i].index)) {
                selectedValues.push(channelList[i].index);
            }
        }
        if (!settings?.widget_camera_list && channelList.length) {
            selectedValues.push(channelList[0].index);
        }

        cameraSelect.val(selectedValues);
        cameraSelect.selectpicker('refresh');
        cameraPickerChanged();
    } catch (err) {
        console.error(err);
        $('#widgetCameraList').selectpicker('refresh');
    }
}

function cameraPickerChanged() {
    const selected = $('#widgetCameraList').val();
    const newCameraList = selected?.map((camera) => parseInt(camera)) || [];
    if (JSON.stringify(settings.widget_camera_list) !== JSON.stringify(newCameraList)) {
        settings.widget_camera_list = newCameraList;
        inputChanged();
    }
}

async function getChannelList() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/local/camscripter/proxy.cgi',
            beforeSend: (xhr) => {
                xhr.setRequestHeader('x-target-camera-protocol', settings.camera_protocol);
                xhr.setRequestHeader('x-target-camera-ip', settings.camera_ip);
                xhr.setRequestHeader('x-target-camera-port', settings.camera_port);
                xhr.setRequestHeader('x-target-camera-user', settings.camera_user);
                xhr.setRequestHeader('x-target-camera-pass', settings.camera_pass);
                xhr.setRequestHeader('x-target-camera-path', '/axis-cgi/param.cgi?action=list&group=root.Image');
            },
        })
            .done((responseData) => {
                const params = parseParamsData(responseData);
                let channelList = [];
                let i = 0;
                while (params[`root.Image.I${i}.Enabled`] !== undefined) {
                    if (params[`root.Image.I${i}.Enabled`] === 'yes') {
                        channelList.push({ index: i, name: params[`root.Image.I${i}.Name`] });
                    }
                    i++;
                }
                resolve(channelList);
            })
            .fail((xhr, status, err) => {
                reject(`Could not get channel list from the camera, status: ${status}`);
            });
    });
}

function parseParamsData(data) {
    let params = {};
    const lines = data.split('\n');
    lines.forEach((line) => {
        const sepPos = line.indexOf('=');
        if (sepPos !== -1 && sepPos + 1 < line.length) {
            params[line.substring(0, sepPos)] = line.substring(sepPos + 1);
        }
    });
    return params;
}
