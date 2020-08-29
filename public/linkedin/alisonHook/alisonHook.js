var _sourceWindow = null;
var selectedCandidates = [];
var candidateIdsScrapedFromLinkedIn = [];
var marshalledCandidatesFromLinkedIn = [];

selectedCandidates.removeCandidate = (candidate) => {
    const found = selectedCandidates.find(c => c.id === candidate.id);
    if (found){
        const index = selectedCandidates.indexOf(found);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
}

const createListItem = (id, text) => {
    const li = document.createElement("li");
    li.id = `${id}_listItem`;
    li.innerHTML = text;
    $('#list').append(li);
    
}

const removeListItem = (id) => {
    const li = $(`#${id}_listItem`);
    if (li){
        $(li).remove();
    }
}

const toggleContactSelection = (data) => {
    var isSelected = data.isSelected;
    var candidate = data.candidate;

    if (isSelected){
        selectedCandidates.push(candidate);
        const text = `${candidate.firstName} ${candidate.lastName}`;
        createListItem(candidate.id, text);
    }
    else {
        selectedCandidates.removeCandidate(candidate);
        removeListItem(candidate.id);
    }
}

const requestLinkedInMarshalCandidates = () => {
    callBackToParent("candidatesMarshallToAlisonUIRequested", {});
}

const candidatesMarshallToAlisonUIResponse = (data) => {
    const candidatesBatch = data.candidates;
    if (candidatesBatch && candidatesBatch.length > 0){
        marshalledCandidatesFromLinkedIn = marshalledCandidatesFromLinkedIn.concat(candidatesBatch);
    }

    if (data.isThisTheLastBatch){
        //What do you want to do?
    }
}

const onScrapeCandidatesResult_Complete = (data) => {
    candidateIdsScrapedFromLinkedIn = data.candidateIds;
    console.log("recruiter said it's scraped " + totalNumberOfCurrentlyScrapedCandidates + " candidates");
}

const callBackToParent = (actionString, data) => {
    if (_sourceWindow){
        var jsonString = JSON.stringify(data);
        _sourceWindow.postMessage({action: actionString, parameter: jsonString}, "*");
    }
}

const initialization =() => { console.log("initialization called from linked in user script")};

$(document).ready(() => {
    window.addEventListener('message', function(e) {
        var d = e.data;
        _sourceWindow = e.source;
  
        const action = d.action;
        const data = JSON.parse(d.parameter || '{}');

        const script = 'if (' + action + ') ' + action + '(data);';
        eval(script);
    });

    $('#scrapResults').click(() => {
        callBackToParent('scrapeCandidateResults');
    });

    $('#sendMessage').click(() => {
        var template = $('#message').val();
        var data = {template, selectedCandidates}
        callBackToParent('sendMessageToCandidates', data);
    });
});
