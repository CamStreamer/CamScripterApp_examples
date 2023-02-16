let activeTabNum = 0;
let configList = [];

$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=htmlOverlay&action=get', (settings) => {
        configList = settings;
        renderTabs();
        renderActiveTabContent();
    });
});

function renderTabs() {
    let tabsHtml = '';
    for (let i = 0; i < configList.length; i++) {
        tabsHtml += getConfigurationTabHtml(i, configList[i].configName);
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
    $('#tabs').show(400, ()=> {
        $('.form-control').change(inputChanged);
        $('.myForm').submit(function () {
            return false;
        });

        $('#deleteConfigBtn').on('click', removeTab);
    })
}

function getConfigurationTabHtml(sequenceNum, configName) {
    return (
        ` <a class="nav-item nav-link"` +
        ` id="tab_${sequenceNum}"` +
        ' data-toggle="tab"' +
        ' href="#navContent"' +
        ' role="tab"' +
        ` aria-controls="navContent">${configName}</a>`
    );
}

function tabClicked(event) {
    event.preventDefault();

    if (event.target.id.indexOf('plus') !== -1) {
        const newConfig = getDefaultConfiguration(configList.length + 1);
        $(`#tab_plus`).before(getConfigurationTabHtml(configList.length, newConfig.configName));
        $(`#tab_${activeTabNum}`).tab('show');
        $(`#tab_${activeTabNum}`).focus();
        $('#navTab a').unbind().on('click', tabClicked);
        configList.push(newConfig);
        renderActiveTabContent();
        inputChanged();
    } else {
        activeTabNum = parseInt(event.target.id.substring(4));
        renderActiveTabContent();
    }
}

function removeTab() {
    $(`#tab_${activeTabNum}`).remove();
    $('#navTab a:first').tab('show');
    configList.splice(activeTabNum, 1);
    resetTabIds();
    activeTabNum = 0;
    renderActiveTabContent();
    inputChanged();
}

function resetTabIds() {
    const tabs = $('#navTab a');
    $(tabs).each((k, v) => {
        if (v.id !== 'tab_plus') {
            v.id = `tab_${k}`;
        }
    });
}

function renderActiveTabContent() {
    if (activeTabNum >= configList.length) {
        return;
    }

    const config = configList[activeTabNum];
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
}

function getDefaultConfiguration(sequenceNum) {
    return {
        configName: `HtmlOverlay${sequenceNum}`,
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
            coordSystem: 'bottom_left',
            posX: 0,
            posY: 0,
            streamWidth: 1920,
            streamHeight: 1080,
        },
    };
}

function inputChanged() {
    if (activeTabNum < configList.length) {
        $(`#tab_${activeTabNum}`).text($('#configName').val());

        configList[activeTabNum] = {
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
                coordSystem: $('#coordSystem').val(),
                posX: parseInt($('#posX').val()),
                posY: parseInt($('#posY').val()),
                streamWidth: parseInt($('#streamWidth').val()),
                streamHeight: parseInt($('#streamHeight').val()),
            },
        };
    }

    $.post(
        '/local/camscripter/package/settings.cgi?package_name=htmlOverlay&action=set',
        encodeURIComponent(JSON.stringify(configList)),
        (data) => {}
    );
}
