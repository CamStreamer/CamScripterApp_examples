let activeTabNum = 0;
let settings = {};

$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=htmlOverlay&action=get', (newSettings) => {
        if (Array.isArray(newSettings)) {
            settings = {
                linuxUser: '',
                overlayList: newSettings,
            };
        } else {
            settings = newSettings;
        }

        $('#linuxUser').val(settings.linuxUser);
        renderTabs();
        renderActiveTabContent();
    });
});

function renderTabs() {
    let tabsHtml = '';
    for (let i = 0; i < settings.overlayList.length; i++) {
        tabsHtml += getConfigurationTabHtml(i, settings.overlayList[i].enabled, settings.overlayList[i].configName);
    }
    tabsHtml +=
        ` <a class="nav-item nav-link"` +
        ` id="tab_plus"` +
        ' href="#navContentEmpty"' +
        ' role="tab"' +
        ` aria-controls="navContentEmpty">+</a>`;

    $('#navTab').html(tabsHtml);
    $('#navTab a').unbind().on('click', tabClicked);
    $('#navTab a:first').tab('show');
    $('#tabs').show(400, () => {
        $('.form-control:not(#cameraList,[class^="dropdown"])').change(inputChanged);
        $('.myForm').submit(function () {
            return false;
        });
        $('#cameraList').on('changed.bs.select', cameraPickerChanged);
        $('#deleteConfigBtn').on('click', removeTab);
    });
    $('[id^="enabledToogle_"]').bootstrapToggle();
}

function getConfigurationTabHtml(sequenceNum, enabled, configName) {
    const toogleChecked = enabled ? 'checked' : '';
    const toogle = `<input id="enabledToogle_${sequenceNum}" type="checkbox" ${toogleChecked} data-toggle="toggle" data-size="xs"></input>`;
    return (
        ` <a class="nav-item nav-link"` +
        ` id="tab_${sequenceNum}"` +
        ' data-toggle="tab"' +
        ' href="#navContent"' +
        ' role="tab"' +
        ` aria-controls="navContent"><span id="tabText_${sequenceNum}">${configName}</span> ${toogle}</a>`
    );
}

function tabClicked(event) {
    event.preventDefault();

    if (event.target.id.length === 0) {
        // Enabled toogle
        const tabId = event.target.closest('a[id^=tab_]').id;
        const tabSequenceNum = parseInt(tabId.substring(4));
        settings.overlayList[tabSequenceNum].enabled = !(settings.overlayList[tabSequenceNum].enabled ?? true);
        $(`#enabledToogle_${tabSequenceNum}`).bootstrapToggle(
            settings.overlayList[tabSequenceNum].enabled ? 'on' : 'off'
        );
        saveConfiguration();
        return false;
    }

    if (event.target.id.indexOf('plus') !== -1) {
        const newConfig = getDefaultConfiguration(findUnusedHtmlOverlayId());
        $(`#tab_plus`).before(
            getConfigurationTabHtml(settings.overlayList.length, newConfig.enabled, newConfig.configName)
        );
        $(`#tab_${activeTabNum}`).tab('show');
        $(`#tab_${activeTabNum}`).focus();
        $('#navTab a').unbind().on('click', tabClicked);
        $('[id^="enabledToogle_"]').bootstrapToggle();
        settings.overlayList.push(newConfig);
        renderActiveTabContent();
        saveConfiguration();
    } else {
        const tabId = event.target.closest('a[id^=tab_]').id;
        activeTabNum = parseInt(tabId.substring(4));
        renderActiveTabContent();
    }

    return true;
}

function removeTab() {
    $(`#tab_${activeTabNum}`).remove();
    $('#navTab a:first').tab('show');
    settings.overlayList.splice(activeTabNum, 1);
    resetTabIds();
    activeTabNum = 0;
    renderActiveTabContent();
    saveConfiguration();
}

function resetTabIds() {
    const tabs = $('#navTab a');
    $(tabs).each((k, v) => {
        if (v.id !== 'tab_plus') {
            v.id = `tab_${k}`;
        }
    });
}

function findUnusedHtmlOverlayId() {
    const configIds = [];
    settings.overlayList.forEach((config) => {
        if (config.configName.indexOf('HtmlOverlay') === 0) {
            const id = parseInt(config.configName.substring(11));
            if (!isNaN(id)) {
                configIds.push(id);
            }
        }
    });

    let id = 1;
    while (configIds.indexOf(id) !== -1) {
        id++;
    }
    return id;
}

function renderActiveTabContent() {
    if (activeTabNum >= settings.overlayList.length) {
        return;
    }

    const config = settings.overlayList[activeTabNum];
    const imageSettings = config.imageSettings;
    const cameraSettings = config.cameraSettings;
    const coSettings = config.coSettings;

    $('#configName').val(config.configName);

    $('#imageUrl').val(imageSettings.url);
    $('#renderWidth').val(imageSettings.renderWidth);
    $('#renderHeight').val(imageSettings.renderHeight);
    $('#refreshRate').val(imageSettings.refreshRate);

    $('#cameraProtocol').val(cameraSettings.protocol);
    $('#cameraIP').val(cameraSettings.ip);
    $('#cameraPort').val(cameraSettings.port);
    $('#cameraUser').val(cameraSettings.user);
    $('#cameraPass').val(cameraSettings.pass);

    $('#coordSystem').val(coSettings.coordSystem);
    $('#posX').val(coSettings.posX);
    $('#posY').val(coSettings.posY);
    $('#streamWidth').val(coSettings.streamWidth);
    $('#streamHeight').val(coSettings.streamHeight);

    renderCameraPicker(config);
}

function getDefaultConfiguration(overlayId) {
    return {
        enabled: true,
        configName: `HtmlOverlay${overlayId}`,
        imageSettings: {
            url: '',
            renderWidth: 500,
            renderHeight: 300,
            refreshRate: 500,
        },
        cameraSettings: {
            protocol: 'http',
            ip: '',
            port: 80,
            user: 'root',
            pass: '',
        },
        coSettings: {
            cameraList: null,
            coordSystem: 'bottom_left',
            posX: 0,
            posY: 0,
            streamWidth: 1920,
            streamHeight: 1080,
        },
    };
}

async function renderCameraPicker() {
    try {
        if (activeTabNum >= settings.overlayList.length) {
            return;
        }

        const cameraSelect = $('#cameraList');
        cameraSelect.selectpicker();
        cameraSelect.empty();

        const activeTabBackup = activeTabNum;
        const config = settings.overlayList[activeTabNum];
        const channelList = await getChannelList(config);
        if (activeTabBackup !== activeTabNum) {
            return;
        }

        const selectedValues = [];
        for (var i = 0; i < channelList.length; i++) {
            cameraSelect.append(`<option value="${channelList[i].index}">${channelList[i].name}</option>`);
            if (config.coSettings?.cameraList?.includes(channelList[i].index)) {
                selectedValues.push(channelList[i].index);
            }
        }
        if (!config.coSettings?.cameraList && channelList.length) {
            selectedValues.push(channelList[0].index);
        }

        cameraSelect.val(selectedValues);
        cameraSelect.selectpicker('refresh');
        cameraPickerChanged();
    } catch (err) {
        console.error(err);
        $('#cameraList').selectpicker('refresh');
    }
}

async function getChannelList(config) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/local/camscripter/proxy.cgi',
            beforeSend: (xhr) => {
                xhr.setRequestHeader('x-target-camera-protocol', config.cameraSettings.protocol);
                xhr.setRequestHeader('x-target-camera-ip', config.cameraSettings.ip);
                xhr.setRequestHeader('x-target-camera-port', config.cameraSettings.port);
                xhr.setRequestHeader('x-target-camera-user', config.cameraSettings.user);
                xhr.setRequestHeader('x-target-camera-pass', config.cameraSettings.pass);
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

function inputChanged() {
    saveConfiguration();
    renderCameraPicker();

    if (activeTabNum < settings.overlayList.length) {
        $(`#tabText_${activeTabNum}`).text(settings.overlayList[activeTabNum].configName);
    }
}

function cameraPickerChanged() {
    if (activeTabNum < settings.overlayList.length) {
        const selected = $('#cameraList').val();
        const newCameraList = selected?.map((camera) => parseInt(camera)) || [];
        if (
            JSON.stringify(settings.overlayList[activeTabNum].coSettings.cameraList) !== JSON.stringify(newCameraList)
        ) {
            settings.overlayList[activeTabNum].coSettings.cameraList = newCameraList;
            saveConfiguration();
        }
    }
}

function saveConfiguration() {
    if (activeTabNum < settings.overlayList.length) {
        (settings.linuxUser = $('#linuxUser').val()),
            (settings.overlayList[activeTabNum] = {
                enabled: settings.overlayList[activeTabNum].enabled ?? true,
                configName: $('#configName').val(),
                imageSettings: {
                    url: $('#imageUrl').val(),
                    renderWidth: parseInt($('#renderWidth').val()),
                    renderHeight: parseInt($('#renderHeight').val()),
                    refreshRate: parseInt($('#refreshRate').val()),
                },
                cameraSettings: {
                    protocol: $('#cameraProtocol').val(),
                    ip: $('#cameraIP').val(),
                    port: parseInt($('#cameraPort').val()),
                    user: $('#cameraUser').val(),
                    pass: $('#cameraPass').val(),
                },
                coSettings: {
                    cameraList: settings.overlayList[activeTabNum].coSettings.cameraList,
                    coordSystem: $('#coordSystem').val(),
                    posX: parseInt($('#posX').val()),
                    posY: parseInt($('#posY').val()),
                    streamWidth: parseInt($('#streamWidth').val()),
                    streamHeight: parseInt($('#streamHeight').val()),
                },
            });

        $.ajax('/local/camscripter/package/settings.cgi?package_name=htmlOverlay&action=set', {
            data: JSON.stringify(settings),
            contentType: 'application/json',
            type: 'POST',
        });
    }
}
