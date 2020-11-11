const _displayMessage = (msg) => {
    $('#msg').text(msg);
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

$(document).ready(() => {
    window.addEventListener('message', (e) => {
        window.linkedInConsoleReference = e.source;
        _displayMessage('Ready...');
        const action = e.data.action;
        console.log(`post message received from parent.  action: ${action}`);
    });
});
