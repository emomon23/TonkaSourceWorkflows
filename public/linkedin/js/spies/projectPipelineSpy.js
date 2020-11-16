(() => {
    const _initializeAsyncCalls = async () => {
        await _initializeKeywordMatchVisualIndicators();
        await _rebindToPresentationTabs();
    }

    const _initializeKeywordMatchVisualIndicators = async () => {
        await tsCommon.sleep(2000);

        let memberIdCheckboxes = $(linkedInSelectors.projectPipeLinePage.memberIdCheckbox);
        let candidateNames = $(linkedInSelectors.projectPipeLinePage.candidateName);

        if (!(memberIdCheckboxes && candidateNames)){
            return;
        }

        memberIdCheckboxes = memberIdCheckboxes.toArray();
        candidateNames = candidateNames.toArray();

        for (let i = 0; i < memberIdCheckboxes.length; i++){
            const memberId = $(memberIdCheckboxes[i]).attr('data-member-id');
            const candidateLink = candidateNames[i];

            const match = candidateKeywordMatchRepository.getCandidateKeywordMatch(memberId);
            if (match){
                const candidate = candidateController.searchForCandidate(memberId);
                const city = candidate ? (candidate.city || '') + '\n' : '';
                const technicalYearString = candidate && candidate.technicalYearString ? `${candidate.technicalYearString}\n` : '';

                const toolTip = match.theyHave.map((h) => {
                    return `${technicalYearString}${city}${h.title}:${h.foundInJobHistory ? ' Job history. ' : ''}${h.foundInSummary ? ' In summary. ' : ''}${h.lastUsed ? ' LastUsed: ' + h.lastUsed : ''}`;
                }).join('\n');

                $(candidateLink)
                    .attr('title', toolTip)
                    .attr('style', 'color:green');
            }
        }
    }

    const tabClicked = () => {
        _initializeKeywordMatchVisualIndicators();
        _rebindToPresentationTabs();
    }

    const _rebindToPresentationTabs = async () => {
        await tsCommon.sleep(1000);
        $(linkedInSelectors.projectPipeLinePage.tab).click(() => {
            tabClicked();
        });
    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PROJECT_PIPELINE) {
            _initializeAsyncCalls();
        }
    });
})();