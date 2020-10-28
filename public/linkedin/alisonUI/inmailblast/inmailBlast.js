const _postBackToLinkedIn = () => {
    const jsonString = JSON.stringify({
            subject: $('#subject').val(),
            body: $('#body').val()
        });

    if (window.linkedInConsoleReference) {
        window.linkedInConsoleReference.postMessage({action: 'fireInMailBlast', parameter: jsonString}, "*");
    }
}

const _validateData = () => {
    if (!($('#subject').val().length && $('#body').val().length)){
        // eslint-disable-next-line no-alert
        alert('Both subject and body are required');
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
    window.addEventListener('message', (e) => {
        window.linkedInConsoleReference = e.source;
        const action = e.data.action;
        console.log(`post message received from parent.  action: ${action}`);
    });
});
