
class SendLinkedInMessages {
    selectedCandidates = [];

    removeCandidate = (candidate) => {
        const found = this.selectedCandidates.find(c => c.memberId === candidate.memberId);
        if (found){
            const index = selectedCandidates.indexOf(found);
            if (index > -1) {
                array.splice(index, 1);
            }
        }

        tsUICommon.removeListItem(candidate.memberId);
    }

    addCandidate = (candidate) => {
        this.selectedCandidates.push(candidate);
        const text = `${candidate.firstName} ${candidate.lastName}`;
        const listItem = tsUICommon.createListItem('sendMessage_selectedCandidates', candidate.memberId, text);
        tsUICommon.addButton($(listItem).attr('id'), candidate.memberId, "X", 25, 25, () => {
            tsUICommon.removeListItem(candidate.memberId);
            alisonHook.callBackToLinkedIn('candidateUnselect', {memberId: candidate.memberId});
        });
    }

    toggleCandidateSelection = (candidate) => {
        var isSelected = candidate.isSelected;
           
        if (isSelected){
            this.addCandidate(candidate);
        }
        else {
            this.removeCandidate(candidate);
        }
    }

    sendMessages = () => {
        const connectionMessage = $('#connectionMessage').val();
        const linkedInMessage = $('#linkedInMessage').val();
        const subject = $('#txtSubject').val();

        const memberIds = this.selectedCandidates.map(c => c.memberId);
        alisonHook.callBackToLinkedIn('sendMessageToCandidates', {connectionMessage, linkedInMessage, subject,  memberIds});
    }
}

const sendLinkedInMessages = new SendLinkedInMessages();
alisonHook.activeTemplate = sendLinkedInMessages;

$('#sendMessage').click(sendLinkedInMessages.sendMessages);