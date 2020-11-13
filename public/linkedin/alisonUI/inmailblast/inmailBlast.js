let _bodyTextArea = null;

const _displayMessage = (msg) => {
    $('#msg').text(msg);
}

const _postBackToLinkedIn = () => {
    try {
        const jsonString = JSON.stringify({
                subject: $('#subject').val(),
                body: $('#body').val()
            });

        if (window.linkedInConsoleReference) {
            _displayMessage("posting message back to linked in window - fireInMailBlast");
            window.linkedInConsoleReference.postMessage({action: 'fireInMailBlast', parameter: jsonString}, "*");

            setTimeout(() => {
                window.close();
            }, 5000);
        }
        else {
            _displayMessage("Unable to post back to linked in window, don't have a references to 'window.linkedInConsoleReference'");
        }
    }catch(e) {
        _displayMessage("ERROR: " + e.message);
    }
}

const _updateCharCount = () => {
    const span = $('#charCount')[0];
    const count = $(_bodyTextArea).val().length;

    $(span).text(`Char Count: ${count}`);

    if (count > 1900) {
        $(span).attr('style', "color: red");
        $('#sendInMailButton').prop('disabled', true);
    } else {
        $(span).removeAttr('style');
        $('#sendInMailButton').prop('disabled', false);
    }
}

const _validateData = () => {
    const bodyLength = $('#body').val().length;
    if (!($('#subject').val().length && bodyLength)){
        _displayMessage("Both subject and body are required");
        return false;
    }

    // eslint-disable-next-line no-alert
    return confirm("Blast In Mails?  Are you sure?");
}

send_onClick = () => {
    if (_validateData()){
        _postBackToLinkedIn();
    }
}

$(document).ready(() => {
    _bodyTextArea = $('#body')[0];

    window.addEventListener('message', (e) => {
        window.linkedInConsoleReference = e.source;
        _displayMessage('Ready...');
        const action = e.data.action;
        console.log(`post message received from parent.  action: ${action}`);
    });

    $(_bodyTextArea).keyup(() => {
        _updateCharCount();
    });

    _updateCharCount();
});
