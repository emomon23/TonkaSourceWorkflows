(() => {
    let _candidates = [];
    let _tsAssignment = null;

    const _findCandidate = (strMemberId) => {
        const memberId = !isNaN(strMemberId) ? Number.parseInt(strMemberId) : memberId;

        return _candidates.find(c => c.memberId === memberId);
    }
    const _projectPipelineSpy_InitializeAsyncCalls = async () => {
        await tsCommon.sleep(1000);
        await _getCandidatesFromDb();
        await _rebindProjectElements();
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

    const _savePipelineToTsAssignment = async () => {
        const candidatesIds = await linkedInSearchResultsScraper.getCurrentSearchResultsPageListOfMemberIds();
        const scrapedPipeLineCandidates = await tsProjectPipelineScrapper.scrapePipeline();

        if (scrapedPipeLineCandidates.length === candidatesIds.length) {
            for (let i = 0; i < candidatesIds.length; i++) {
                const tsProjectCandidate = scrapedPipeLineCandidates[i];
                assignmentController.updateProjectCandidate(_tsAssignment, tsProjectCandidate);
            }
        }
    }

    const _displayTsControlsOnList = async () => {
        await tsCommon.sleep(2000);

        const pipelineRows = $('div[class*="table-container-project"] div[class*="row-inner"]').toArray();
        const candidatesIds = await linkedInSearchResultsScraper.getCurrentSearchResultsPageListOfMemberIds();

        if (pipelineRows.length === candidatesIds.length) {
           for (let i = 0; i < pipelineRows.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                const candidate = await candidateRepository.get(candidatesIds[i]);
                tsConfirmCandidateSkillService.displayAllTheTsControls(pipelineRows[i], candidate);
            }
        }
        else {
            console.error('WTF!?  candidates and rows do not match')
        }


    }

    const rerunDocReady = async (displayControlsMySelf) => {
        await tsCommon.sleep(1000);
        _rebindProjectElements();

        if (displayControlsMySelf){
            _displayTsControlsOnList();
        }

        _savePipelineToTsAssignment();
    }

    const _rebindProjectElements = async () => {
        await tsCommon.sleep(1000);
        $(linkedInSelectors.projectPipeLinePage.tab).click((e) => {
            rerunDocReady(true);
        });

        $('a[class*="page-link"]').click((e) => {
            rerunDocReady(false);
        });
    }

    const _fetchTsAssignmentFromProject = async () => {
        await tsCommon.sleep(2000);

        projectName = $('h2[class*="header-title"]').text();
        _tsAssignment = await assignmentController.getOrCreateAssignment(projectName);

        _savePipelineToTsAssignment();
    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PROJECT_PIPELINE) {
            _projectPipelineSpy_InitializeAsyncCalls();
            _fetchTsAssignmentFromProject();
        }
    });
})();