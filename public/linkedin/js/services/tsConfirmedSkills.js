(() => {
    const confirmedSkills = [
        {key: 'dotnet', display: '.NET' },
        {key: 'java', display: 'Java' },
        {key: 'angular', display: 'NG' },
        {key: 'react', display: 'React' },
        {key: 'reactNative', display: 'ReactNv' },
        {key: 'ios', display: 'IOS' },
        {key: 'android', display: 'Android' },
        {key: 'xamarin', display: 'Xamarin' },
        {key: 'qaManual', display: 'QA-Man' },
        {key: 'qaAutomation', display: 'QA-Auto' },
        {key: 'devOps', display: 'DevOps' },
        {key: 'busAnalyst', display: 'BA' },
    ]

    const _updateCandidateTsConfirmedSkill = async (strMemberId, skillNameKey, strValue) => {
        const memberId = !isNaN(strMemberId) ? Number.parseInt(strMemberId) : memberId;
        const candidate = await candidateRepository.get(memberId);

        if (!candidate){
            return;
        }

        if (!candidate.tsConfirmedSkills){
            candidate.tsConfirmedSkills = {};
        }

        value = !isNaN(strValue) ? Number.parseInt(strValue) : strValue;
        candidate.tsConfirmedSkills[skillNameKey] = value;

        await candidateRepository.update(candidate);
    }

    const _appendTSSkillInputToCandidateResult = (container, confirmedSkillProperty, displayValue, candidate) => {
        const span = $(document.createElement('span')).text(displayValue);
        const input = $(document.createElement('input')).attr('style', 'width:20px; margin-left:5px; margin-right:10px')
                                                        .attr('memberId', candidate.memberId)
                                                        .attr('skill', confirmedSkillProperty);

        let value = '';
        if (candidate && candidate.tsConfirmedSkills && candidate.tsConfirmedSkills[confirmedSkillProperty]){
            value = candidate.tsConfirmedSkills[confirmedSkillProperty];
        }

        $(input).val(value);

        $(container).append(span)
                    .append(input);


        $(input).change((e) => {
            const txtBox = e.target;
            const memberId = $(txtBox).attr('memberId');
            const skillName = $(txtBox).attr('skill');
            const rank = $(txtBox).val();

            _updateCandidateTsConfirmedSkill(memberId, skillName, rank);
        });
    }

    const _displayTSConfirmedSkillsForCandidate = (container, candidate, display = 'inline') => {
        const div = document.createElement('div');
        $(div).attr('style', `display:${display}`).text("Rank: ");

        $(container).append(div);

        confirmedSkills.forEach((skillDefinition) => {
            _appendTSSkillInputToCandidateResult(div, skillDefinition.key, skillDefinition.display, candidate);
        });
    }

    class TSConfirmCandidateSkillService {
        displayTSConfirmedSkillsForCandidate = _displayTSConfirmedSkillsForCandidate
    }

    window.tsConfirmCandidateSkillService = new TSConfirmCandidateSkillService();
})();