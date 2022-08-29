const eventForms = [];
const buttons = [];

$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=graphics_for_axix_events&action=get', function (settings) {
        $('#scIP').val(settings.sourceCamera.IP);
        $('#scPort').val(settings.sourceCamera.port);
        $('#scUser').val(settings.sourceCamera.user);
        $('#scPassword').val(settings.sourceCamera.password);

        $('#tcIP').val(settings.targetCamera.IP);
        $('#tcPort').val(settings.targetCamera.port);
        $('#tcUser').val(settings.targetCamera.user);
        $('#tcPassword').val(settings.targetCamera.password);

        for (let event of settings.events)
        {
            addEventFormHTML(event);
        }
    });

    $(".form-control").change(inputChanged);
    $("#addNewEvent").click(addNewEvent_Click);
    $(".myForm").submit(function () {
        return false;
    });
});

function addNewEvent_Click()
{
    addEventFormHTML();
}

function removeEvent_Click()
{
    const index = buttons.indexOf(this);
    eventForms.splice(index, 1);
    buttons.splice(index, 1);
    $(this).parent().remove();
    inputChanged();
}

let number = 0;
function addEventFormHTML(event = null)
{
    number += 1;
    const ids = ["eventName", "serviceID", "duration"];
    const texts = ["event name", "service ID", "duration (hh:mm:ss)"];
    const placeholders = ["name of event", "0", "00:00:00"]
    const form = document.createElement("form");
    $(form).addClass("form-group");
    $(form).addClass("flex");

    const eventForm = {};
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
        
        if (event != null)
        {
            $(input).val(event[ids[i]]);
        }

        const div = document.createElement("div");
        $(div).addClass(ids[i]);
        $(div).addClass("form-group");
        $(div).append(label, input);
        
        $(form).append(div);
        eventForm[ids[i]] = input;
    }

    const button = document.createElement("button");
    $(button).attr("type", "button");
    $(button).addClass("btn");
    $(button).addClass("btn-danger");
    $(button).addClass("removeEvent");
    $(button).text("X");
    $(button).click(removeEvent_Click);
    $(form).append($(button));

    buttons.push(button);
    eventForms.push(eventForm);
    $("#list").append(form);
}

function inputChanged() {
    let settings =
    {
        sourceCamera:
        {
            IP: $('#scIP').val(),
            port: Number.parseInt($('#scPort').val()),
            user: $('#scUser').val(),
            password: $('#scPassword').val()
        },

        targetCamera:
        {
            IP: $('#tcIP').val(),
            port: Number.parseInt($('#tcPort').val()),
            user: $('#tcUser').val(),
            password: $('#tcPassword').val()
        },

        events: []
    };

    for (let event of eventForms)
    {
        const eventValues =
        {
            eventName: $(event.eventName).val(),
            serviceID: Number.parseInt($(event.serviceID).val())
        };

        const duration = $(event.duration).val().split(":");
        const hours = Number.parseInt(duration[0]);
        const minutes = Number.parseInt(duration[1]);
        const seconds = Number.parseInt(duration[2]);
        eventValues.duration = (3600 * hours + 60 * minutes + seconds) * 1000;

        settings.events.push(eventValues);
    }
    
    $.post('/local/camscripter/package/settings.cgi?package_name=graphics_for_axix_events&action=set', JSON.stringify(settings));
}
