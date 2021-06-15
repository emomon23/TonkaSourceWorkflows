(() => {
    let _candidates = [];

    const _findCandidate = (strMemberId) => {
        const memberId = !isNaN(strMemberId) ? Number.parseInt(strMemberId) : memberId;

        return _candidates.find(c => c.memberId === memberId);
    }
    const _projectPipelineSpy_InitializeAsyncCalls = async () => {
        await tsCommon.sleep(1000);
        await _getCandidatesFromDb();
        await _rebindToPresentationTabs();
        await _displayTSConfirmedSkills();

        $('a[class*="page-link"]').click(() => {
            _projectPipelineSpy_InitializeAsyncCalls();
        });
    }

    const _displayTSConfirmedSkills = async () => {
        const rows = $('div[class*="row"] div[class*="row-inner"]').toArray();

        for (let i = 0; i < rows.length; i++){
            const div = $(rows[i]);
            const memberId = $(div).find('input[class*="prospect-checkbox"]').attr('data-member-id');
            const candidate = _findCandidate(memberId);

            if (candidate){
                tsConfirmCandidateSkillService.displayPhoneAndEmail(div, candidate);
                tsConfirmCandidateSkillService.displayTSConfirmedSkillsForCandidate(div, candidate);
                tsConfirmCandidateSkillService.displayTSNote(div, candidate);
                tsConfirmCandidateSkillService.displayIsConfirmedJobSeeker(div, candidate);
            }
        }
    }

    const _getCandidatesFromDb = async () => {
        let memberIdCheckboxes = $(linkedInSelectors.projectPipeLinePage.memberIdCheckbox);
        let candidateNames = $(linkedInSelectors.projectPipeLinePage.candidateName);

        if (!(memberIdCheckboxes && candidateNames)){
            return;
        }

        memberIdCheckboxes = memberIdCheckboxes.toArray();
        candidateNames = candidateNames.toArray();

        for (let i = 0; i < memberIdCheckboxes.length; i++){
            const memberId = $(memberIdCheckboxes[i]).attr('data-member-id');
            // eslint-disable-next-line no-await-in-loop
            const candidate = await candidateController.getCandidate(memberId);

            if (candidate){
                _candidates.push(candidate);
            }
        }
    }

    const tabClicked = () => {
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
            _projectPipelineSpy_InitializeAsyncCalls();
        }
    });
})();