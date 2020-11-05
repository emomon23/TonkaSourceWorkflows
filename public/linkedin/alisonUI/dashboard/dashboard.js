let acceptJobSeekerCounter = 0;
const now = (new Date()).getTime();
const seekersIndex = {};
const nonSeekersIndex = {};

let candidateRowTemplate = null;

const _displayMessage = (msg) => {
    $('#msg').text(msg);
}

const _createTableRows = (tableRef, howMany) => {
    for (let i = 0; i < howMany; i++) {
        const clonedRow = candidateRowTemplate.content.cloneNode(true);
        tableRef.appendChild(clonedRow);
    }
}

const _displayCandidateRecord = (row, candidate) => {
    $(row).attr('id', `candidate-row-${candidate.memberId}`);

    const link = $(row).find('.linkToProfile')[0];
    $(link)
        .attr('href', `https://www.linkedin.com${candidate.linkedInRecruiterUrl}`)
        .text(`${candidate.firstName} ${candidate.lastName}`);

    // Any elements with .setMemberId as class name want to have a memberId attribute
    $(row).find('.setMemberId').attr('memberId', candidate.memberId);
}

const _reRenderCandidates = async () => {
    const onlyFirst = $('#firstConnectionFilter')[0].checked ? true : false;
    candidateRepo.resetJobSeekers(now);

    const candidateList = await candidateRepo.getCurrentJobSeekers(onlyFirst);
    const recentlyHiredCandidates = await candidateRepo.getRecentlyHired(onlyFirst);

    _removeAllChildNodes('activeSeekers');
    _removeAllChildNodes('formerSeekers');

    _displayRecords('activeSeekers', candidateList);
    _displayRecords('formerSeekers', recentlyHiredCandidates);
}

const _displayRecords = (tableReferenceString, listOfCandidates) => {
    const tableReference = $(`#${tableReferenceString}`)[0];
    _createTableRows(tableReference, listOfCandidates.length);

    const rowDivs = $(tableReference).find('.candidateRow');
    for (let i = 0; i < listOfCandidates.length; i++){
        _displayCandidateRecord(rowDivs[i], listOfCandidates[i]);
    }

}

const _removeAllChildNodes = (idString) => {
    idString = `#${idString}`;

    const parent = $(idString)[0];

    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

const acceptJobSeeker = async (jsonString) => {
    const candidate = JSON.parse(jsonString);

    acceptJobSeekerCounter += 1;
    _displayMessage(`Accepted ${acceptJobSeekerCounter} job seekers...`);

    try {
        candidate.dashboardSync = now;
        const saveResult = await candidateRepo.saveCandidate(candidate);
        if (saveResult.isJobSeeker && !saveResult.notReallySeeking){
            seekersIndex[saveResult.memberId] = true;
            nonSeekersIndex[saveResult.memberId] = false;
        }
        else {
            seekersIndex[saveResult.memberId] = false;
            nonSeekersIndex[saveResult.memberId] = true;
        }

    } catch (e) {
        _displayMessage(e.message);
    }
}

const firstConnectionFilter_OnChange = () => {
    _reRenderCandidates();
}

const notReallySeeking_Click = async (hideButton) => {
    try {
        const memberId = $(hideButton).attr('memberId');
        await candidateRepo.setNotReallySeeking(memberId, true);
        $(`#candidate-row-${memberId}`).remove();
    }
    catch (err) {
        _displayMessage(`ERROR: ${err.message}`);
    }
}

$(document).ready(() => {
    candidateRowTemplate = $('#candidateRowTemplate')[0];

    window.addEventListener('message', (e) => {
        window.linkedInConsoleReference = e.source;
        const action = e.data.action;
        console.log(`post message received from parent.  action: ${action}`);

        if (action === 'acceptJobSeeker'){
            acceptJobSeeker(e.data.parameter);
        }
        else if (action === 'marshallingCandidatesDone'){
            _reRenderCandidates();
        }
    });

    _displayMessage("window.ready...waiting for job seekers")

});
