(() => {

    _initializeKeywordMatchVisualIndicators = async () => {
        await tsCommon.sleep(5000);

        let memberIdCheckboxes = $(linkedInSelectors.projectPipeLinePage.memberIdCheckbox);
        let candidateNames = $(linkedInSelectors.projectPipeLinePage.candidateName);

        if (!(memberIdCheckboxes && candidateNames)){
            return;
        }

        memberIdCheckboxes = memberIdCheckboxes.toArray();
        candidateNames = candidateNames.toArray();

        for (let i=0; i<memberIdCheckboxes.length; i++){
            const memberId = $(memberIdCheckboxes[i]).attr('data-member-id');
            const candidateLink = candidateNames[i];

            const match = candidateKeywordMatchRepository.getCandidateKeywordMatch(memberId);
            if (match){
                const toolTip = match.theyHave.map((h) => {
                    return `${h.title}:${h.foundInJobHistory ? ' Job history. ' : ''}${h.foundInSummary? ' In summary. ': ''}${h.lastUsed? ' LastUsed: ' + h.lastUsed : ''}`;
                }).join('\n');

                $(candidateLink)
                    .attr('title', toolTip)
                    .attr('style', 'color:red');
            }
        }
    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PROJECT_PIPELINE) {
            _initializeKeywordMatchVisualIndicators();
        }
    });
})();