const areaForms = [];
const buttons = [];

$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=position_based_image&action=get', function (settings) {
        $('#scIP').val(settings.sourceCamera.IP);
        $('#scPort').val(settings.sourceCamera.port);
        $('#scUser').val(settings.sourceCamera.user);
        $('#scPassword').val(settings.sourceCamera.password);

        $('#tcIP').val(settings.targetCamera.IP);
        $('#tcPort').val(settings.targetCamera.port);
        $('#tcUser').val(settings.targetCamera.user);
        $('#tcPassword').val(settings.targetCamera.password);

        $('#mIP').val(settings.modem.IP);
        $('#mPort').val(settings.modem.port);
        $('#mUser').val(settings.modem.user);
        $('#mPassword').val(settings.modem.password);

        for (let area of settings.areas)
        {
            addAreaFormHTML(area);
        }
    });

    $(".form-control").change(inputChanged);
    $("#addNewPosition").click(addNewPosition_Click);
    $(".myForm").submit(function () {
        return false;
    });
});

function addNewPosition_Click()
{
    addAreaFormHTML();
}

function removePosition_Click()
{
    const index = buttons.indexOf(this);
    areaForms.splice(index, 1);
    buttons.splice(index, 1);
    $(this).parent().remove();
    inputChanged();
}

let number = 0;
function addAreaFormHTML(area = null)
{
    number += 1;
    const ids = ["coordinates", "radius", "serviceID"];
    const texts = ["GPS coordinates (copy from Google Maps)", "radius (m)", "service ID"];
    const placeholders = ["50.054877509994405, 14.375785127748992", "400", "0"]
    const form = document.createElement("form");
    $(form).addClass("form-group");
    $(form).addClass("flex");

    const areaForm = {};
    for (let i = 0; i < 3; i++)
    {
        let id = ids[i].concat(number);
        const label = document.createElement("label");
        $(label).attr("for", id);
        $(label).text(texts[i]);

        const input = document.createElement("input");
        $(input).attr("id", id);
        $(input).attr("type", "text");
        $(input).attr("placeholder", placeholders[i]);
        $(input).addClass("form-control");
        $(input).change(inputChanged);

        const div = document.createElement("div");
        $(div).addClass(ids[i]);
        $(div).addClass("form-group");
        $(div).append(label, input);
        
        $(form).append(div);
        areaForm[ids[i]] = input;
    }

    if (area != null)
    {
        $(`#coordinates${number}`).val(`${area.coordinates.latitude}, ${area.coordinates.longitude}`);
        $(`#radius${number}`).val(area["radius"]);
        $(`#serviceID${number}`).val(area["serviceID"]);
    }

    const button = document.createElement("button");
    $(button).attr("type", "button");
    $(button).addClass("btn");
    $(button).addClass("btn-danger");
    $(button).addClass("removePosition");
    $(button).text("X");
    $(button).click(removePosition_Click);
    $(form).append($(button));

    buttons.push(button);
    areaForms.push(areaForm);
    $("#list").append(form);
}

function inputChanged() {
    let settings =
    {
        sourceCamera:
        {
            IP: $('#scIP').val(),
            port: $('#scPort').val(),
            user: $('#scUser').val(),
            password: $('#scPassword').val()
        },

        targetCamera:
        {
            IP: $('#tcIP').val(),
            port: $('#tcPort').val(),
            user: $('#tcUser').val(),
            password: $('#tcPassword').val()
        },

        modem:
        {
            IP: $('#mIP').val(),
            port: $('#mPort').val(),
            user: $('#mUser').val(),
            password: $('#mPassword').val()
        },

        areas: []
    };

    for (let area of areaForms)
    {
        const splitedCoordinates = $(area.coordinates).val().split(",");
        const areaValues =
        {
            coordinates: 
            {
                latitude: splitedCoordinates[0].trim(),
                longitude: splitedCoordinates[1].trim()
            },
            radius: $(area.radius).val(),
            serviceID: $(area.serviceID).val()
        }
        settings.areas.push(areaValues);
    }

    $.post('/local/camscripter/package/settings.cgi?package_name=position_based_image&action=set', JSON.stringify(settings));
}
