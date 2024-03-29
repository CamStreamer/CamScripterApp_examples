const areaForms = [];
const buttons = [];

$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=position_based_image&action=get', function (settings) {
        $('#tcIP').val(settings.targetCamera.IP);
        $('#tcPort').val(settings.targetCamera.port);
        $('#tcUser').val(settings.targetCamera.user);
        $('#tcPassword').val(settings.targetCamera.password);

        $('#width').val(settings.width);
        $('#height').val(settings.height);
        $('#zoomLevel').val(settings.zoomLevel);
        $('#updatePeriod').val(settings.updatePeriod);
        $('#positionX').val(settings.positionX);
        $('#positionY').val(settings.positionY);
        $('#enableMapCO').prop("checked", settings.enableMapCO);
        $('#APIkey').val(settings.APIkey);
        $('#tolerance').val(settings.tolerance);
        $('#streamWidth').val(settings.streamWidth);
        $('#streamHeight').val(settings.streamHeight);

        for (let area of settings.areas) {
            addAreaFormHTML(area);
        }
    });

    $(".form-control").change(inputChanged);
    $(".form-check-input").change(inputChanged);
    $("#addNewPosition").click(addNewPositionClick);
    $(".myForm").submit(function () {
        return false;
    });
});

function addNewPositionClick() {
    addAreaFormHTML();
}

function removePositionClick() {
    const index = buttons.indexOf(this);
    areaForms.splice(index, 1);
    buttons.splice(index, 1);
    $(this).parent().remove();
    inputChanged();
}

let number = 0;
function addAreaFormHTML(area = null) {
    number += 1;
    const ids = ["coordinates", "radius", "serviceIDs"];
    const texts = ["GPS coordinates (copy from Google Maps)", "Radius (m)", "Service IDs"];
    const placeholders = ["50.054877509994405, 14.375785127748992", "400", "0"];
    const values = [`${area?.coordinates.latitude}, ${area?.coordinates.longitude}`,
    area?.radius, ""];

    if (area != null) {
        values[2] = area.serviceIDs.join(", ");
    }

    const form = document.createElement("form");
    $(form).addClass("form-group");
    $(form).addClass("flex");

    const areaForm = {};
    for (let i = 0; i < 3; i++) {
        let id = `${ids[i]}${number}`;
        const label = document.createElement("label");
        $(label).attr("for", id);
        $(label).text(texts[i]);

        const input = document.createElement("input");
        $(input).attr("id", id);
        $(input).attr("type", "text");
        $(input).attr("placeholder", placeholders[i]);
        $(input).addClass("form-control");
        $(input).change(inputChanged);
        if (area != null) {
            $(input).val(values[i]);
        }

        const div = document.createElement("div");
        $(div).addClass(ids[i]);
        $(div).addClass("form-group");
        $(div).append(label, input);

        $(form).append(div);
        areaForm[ids[i]] = input;
    }


    const button = document.createElement("button");
    $(button).attr("type", "button");
    $(button).addClass("btn");
    $(button).addClass("btn-danger");
    $(button).addClass("removePosition");
    $(button).text("X");
    $(button).click(removePositionClick);
    $(form).append($(button));

    buttons.push(button);
    areaForms.push(areaForm);
    $("#list").append(form);
}

function inputChanged() {
    let settings =
    {
        targetCamera:
        {
            IP: $('#tcIP').val(),
            port: $('#tcPort').val(),
            user: $('#tcUser').val(),
            password: $('#tcPassword').val()
        },

        width: Number.parseInt($('#width').val()),
        height: Number.parseInt($('#height').val()),
        zoomLevel: Number.parseInt($('#zoomLevel').val()),
        updatePeriod: Number.parseInt($('#updatePeriod').val()),
        positionX: Number.parseInt($('#positionX').val()),
        positionY: Number.parseInt($('#positionY').val()),
        enableMapCO: $('#enableMapCO').prop('checked'),
        APIkey: $('#APIkey').val(),
        tolerance: Number.parseInt($('#tolerance').val()),
        streamWidth: Number.parseInt($('#streamWidth').val()),
        streamHeight: Number.parseInt($('#streamHeight').val()),

        areas: []
    };

    if (settings.tolerance == undefined || Number.isNaN(settings.tolerance))
    {
        settings.tolerance = 0;
        $('#tolerance').val(0);
    }

    for (let area of areaForms) {
        const radius = Number.parseInt($(area.radius).val());
        const serviceIDs = $(area.serviceIDs).val().split(",");
        const splitedCoordinates = $(area.coordinates).val().split(",");
        const latitude = Number.parseFloat(splitedCoordinates[0]);
        const longitude = Number.parseFloat(splitedCoordinates[1]);

        if (Number.isNaN(radius) || serviceIDs[0] == "" || splitedCoordinates.length != 2 || Number.isNaN(latitude) || Number.isNaN(longitude)) {
            continue;
        }

        for (let i = 0; i < serviceIDs.length; i++) {
            serviceIDs[i] = Number.parseInt(serviceIDs[i]);
        }

        const areaValues =
        {
            coordinates:
            {
                latitude,
                longitude
            },
            radius,
            serviceIDs
        }
        settings.areas.push(areaValues);
    }

    $.post('/local/camscripter/package/settings.cgi?package_name=position_based_image&action=set', JSON.stringify(settings));
}
