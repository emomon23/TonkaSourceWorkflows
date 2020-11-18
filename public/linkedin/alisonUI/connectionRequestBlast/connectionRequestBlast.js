let _bodyTextArea = null;
let _crStats = [];
let _crDropdown = null;

const _displayMessage = (msg) => {
    $('#msg').text(msg);
}

const _addOptionToDropdown = (value, text) => {
    const option = document.createElement('option');
    $(option).attr('value', value).text(text);

    $(_crDropdown).append(option);
}

const _displayPreviousConnectionRequestNotes = (crStats) => {
    _crStats = crStats;

    crStats.forEach((cr) => {
        let dropdownDisplay = cr.note.split('\n').filter(m => m && m.length ? true : false);
        if (dropdownDisplay.length === 1){
            dropdownDisplay = dropdownDisplay[0]
        }
        else {
            dropdownDisplay = dropdownDisplay[0].indexOf('[first-name]') >= 0 ? dropdownDisplay[1] : dropdownDisplay[0];
        }

        dropdownDisplay = dropdownDisplay.length > 50 ? dropdownDisplay.substr(0, 50) : dropdownDisplay
        dropdownDisplay = `${dropdownDisplay}     - USED: ${cr.totalConnectionRequests}, ACCEPTED: ${cr.acceptedActual}   - (${cr.percentAccepted}%)`;
        _addOptionToDropdown(cr.id, dropdownDisplay);
    });
}

const _postBackToLinkedIn = () => {
    try {
        const jsonString = JSON.stringify({
                body: $('#body').val()
            });

        if (window.linkedInConsoleReference) {
            _displayMessage("posting message back to linked in window - fireConnectionRequestBlast");
            window.linkedInConsoleReference.postMessage({action: 'fireConnectionRequestBlast', parameter: jsonString}, "*");

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

    if (count > 300) {
        $(span).attr('style', "color: red");
        $('#connectionRequestButton').prop('disabled', true);
    } else {
        $(span).removeAttr('style');
        $('#connectionRequestButton').prop('disabled', false);
    }
}

const _validateData = () => {
    if (!$('#body').val().length){
        _displayMessage("Body is required");
        return false;
    }

    // eslint-disable-next-line no-alert
    return confirm("Blast CONNECTION REQUESTS?  Are you sure?");
}

send_onClick = () => {
    if (_validateData()){
        _postBackToLinkedIn();
    }
}

previousCrOnChange = () => {
    let selectedCrId = $(_crDropdown).val();
    selectedCrId = selectedCrId && !isNaN(selectedCrId) ? Number.parseInt(selectedCrId) : selectedCrId;

    const selectedCr = _crStats.find(c => c.id === selectedCrId);
    const body = selectedCr ? selectedCr.note : 'Hello [first-name],\n\n';
    $(_bodyTextArea).val(body);
    _updateCharCount();
}

$(document).ready(() => {
    _bodyTextArea = $('#body')[0];
    window.addEventListener('message', (e) => {
        window.linkedInConsoleReference = e.source;
        _displayMessage('Ready...');
        const action = e.data.action;
        const data = e.data.parameter;

        if (data && data.length){
            _displayPreviousConnectionRequestNotes(JSON.parse(data));
            window.crStats = _crStats; // so I can check it out in the console
        }
        console.log(`post message received from parent.  action: ${action}`);
    });

    $(_bodyTextArea).keyup(() => {
        _updateCharCount();
    });

    _updateCharCount();
    _crDropdown = $('#previousCRs')[0];
});
