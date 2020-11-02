let acceptJobSeekerCounter = 0;

const _displayMessage = (msg) => {
    $('#msg').text(msg);
}

const acceptJobSeeker = async (jsonString) => {
    const candidate = JSON.parse(jsonString);

    acceptJobSeekerCounter+=1;
    console.log(`Accepted ${acceptJobSeekerCounter} job seekers...`);

    try {
        candidateRepo.saveCandidate(candidate);
    } catch (e) {
        _displayMessage(e.message);
    }
}

const displayJobSeekers = () => {
    _displayMessage("Time to render dashboard");
}

$(document).ready(() => {
    window.addEventListener('message', (e) => {
        window.linkedInConsoleReference = e.source;
        const action = e.data.action;
        console.log(`post message received from parent.  action: ${action}`);

        if (action === 'acceptJobSeeker'){
            acceptJobSeeker(e.data.parameter);
        }
        else if (action === 'jobSeekersDone'){
            displayJobSeekers();
        }
    });

    _displayMessage("window.ready...waiting for job seekers")

});
