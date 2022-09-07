const eventForms = [];
const buttons = [];

$(document).ready(function () {
    $.get('/local/camscripter/package/settings.cgi?package_name=graphics_for_axis_events&action=get', function (settings) {
        $('#scIP').val(settings.sourceCamera.IP);
        $('#scPort').val(settings.sourceCamera.port);
        $('#scUser').val(settings.sourceCamera.user);
        $('#scPassword').val(settings.sourceCamera.password);

        $('#tcIP').val(settings.targetCamera.IP);
        $('#tcPort').val(settings.targetCamera.port);
        $('#tcUser').val(settings.targetCamera.user);
        $('#tcPassword').val(settings.targetCamera.password);

        for (let event of settings.events) {
            addEventFormHTML(event);
        }
    });

    $(".form-control").change(inputChanged);
    $("#addNewEvent").click(addNewEventClick);
    $(".myForm").submit(function () {
        return false;
    });
});

function addNewEventClick() {
    addEventFormHTML();
}

function removeEventClick() {
    const index = buttons.indexOf(this);
    eventForms.splice(index, 1);
    buttons.splice(index, 1);
    $(this).parent().remove();
    inputChanged();
}

let number = 0;
function addEventFormHTML(event = null) {
    number += 1;
    const ids = ["eventName", "serviceID", "duration"];
    const texts = ["Event Name", "Service ID", "Duration (hh:mm:ss)"];
    const placeholders = ["name of event", "0", "00:00:00"]
    const form = document.createElement("form");
    $(form).addClass("form-group");
    $(form).addClass("flex");

    const eventForm = {};
    for (let i = 0; i < 3; i++) {
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

        if (event != null) {
            $(input).val(event[ids[i]]);
        }

        const div = document.createElement("div");
        $(div).addClass(ids[i]);
        $(div).addClass("form-group");
        $(div).append(label, input);

        $(form).append(div);
        eventForm[ids[i]] = input;
    }

    const invertConditionCheckbox = document.createElement("input");
    $(invertConditionCheckbox).attr("id", "invert" + number);
    $(invertConditionCheckbox).attr("type", "checkbox");
    $(invertConditionCheckbox).addClass("form-check-input");
    $(invertConditionCheckbox).change(inputChanged);
    eventForm["invert"] = invertConditionCheckbox;
    if (event?.invert) {
        $(invertConditionCheckbox).prop("checked", true);
    }

    const invertConditionLabel = document.createElement("label");
    $(invertConditionLabel).addClass("form-check-label");
    $(invertConditionLabel).append(invertConditionCheckbox, "Invert Condition");

    const removeButton = document.createElement("button");
    $(removeButton).attr("type", "button");
    $(removeButton).addClass("btn");
    $(removeButton).addClass("btn-danger");
    $(removeButton).addClass("removeEvent");
    $(removeButton).text("X");
    $(removeButton).click(removeEventClick);

    $(form).append(invertConditionLabel, removeButton);

    buttons.push(removeButton);
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

    for (let event of eventForms) {
        const eventValues =
        {
            eventName: $(event.eventName).val(),
            serviceID: Number.parseInt($(event.serviceID).val()),
            duration: $(event.duration).val(),
            invert: $(event.invert).prop('checked')
        };

        settings.events.push(eventValues);
    }

    $.post('/local/camscripter/package/settings.cgi?package_name=graphics_for_axis_events&action=set', JSON.stringify(settings));
}
