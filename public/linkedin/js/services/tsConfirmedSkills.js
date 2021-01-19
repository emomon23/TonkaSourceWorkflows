(() => {
    const confirmedSkills = [
        {key: 'dotnet', display: '.NET' },
        {key: 'java', display: 'Java' },
        {key: 'angular', display: 'NG' },
        {key: 'react', display: 'React' },
        {key: 'node', display: 'Node'},
        {key: 'reactNative', display: 'ReactNv' },
        {key: 'ios', display: 'IOS' },
        {key: 'android', display: 'Android' },
        {key: 'xamarin', display: 'Xamarin' },
        {key: 'qaManual', display: 'QA-Man' },
        {key: 'qaAutomation', display: 'QA-Auto' },
        {key: 'devOps', display: 'DevOps' },
        {key: 'busAnalyst', display: 'BA' },
        {key: 'aws', display: 'AWS'},
        {key: 'azure', display: 'Azure'},
        {key: 'googleAPI', display: 'GoogAPI'},
        {key: 'firebase', display: 'GoogFireBs'}
    ]

    const _getCandidate = async (strMemberId) => {
        const memberId = !isNaN(strMemberId) ? Number.parseInt(strMemberId) : memberId;
        return await candidateRepository.get(memberId);
    }

    const _updateCandidateTsConfirmedSkill = async (strMemberId, skillNameKey, strValue) => {
        const candidate = await _getCandidate(strMemberId);

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

    const _updateCandidateTsNotes = async (strMemberId, note) => {
        const candidate = await _getCandidate(strMemberId);

        if (!candidate){
            return;
        }

        if (!Array.isArray(candidate.tsNotes)){
            candidate.tsNotes = [];
        }

        const newNote = `${linkedInApp.alisonUserInitials}: ${new Date().toLocaleDateString()} - ${note}`
        candidate.tsNotes.push(newNote);
        await candidateRepository.update(candidate);

        const textArea = $(`textarea[class*="tsNote"][memberId*="${strMemberId}"]`)[0];
        let text = $(textArea).val();
        text = `${newNote}\n\n${text}`;
        $(textArea).val(text);
    }

    const _appendTextInput = (container, memberId, labelText, width, value, strClass = '', rows = 1) => {
        const span = $(document.createElement('span')).text(labelText).attr('memberId', memberId);
        const input = rows === 1 ? document.createElement('input') : document.createElement('textarea');

        $(input).attr('style', `width:${width}px; margin-left:5px; margin-right:10px`)
                .attr('memberId', memberId);

        if (rows > 1){
            $(input).attr('rows', rows);
        }

        if (value || value === 0){
            $(input).val(value);
        }

        if (strClass && strClass.length){
            $(input).attr('class', strClass);
            $(span).attr('class', strClass);
        }

        $(container).append(span)
                    .append(input);

        return {input, span};
    }

    const _appendTSSkillInputToCandidateResult = (container, confirmedSkillProperty, displayValue, candidate) => {
        let value = '';
        if (candidate && candidate.tsConfirmedSkills && candidate.tsConfirmedSkills[confirmedSkillProperty]){
            value = candidate.tsConfirmedSkills[confirmedSkillProperty];
        }

        const nodes = _appendTextInput(container, candidate.memberId, displayValue, 15, value, 'skillRank');
        $(nodes.input).attr('skill', confirmedSkillProperty);
        const input = nodes.input

        $(input).change((e) => {
            const txtBox = e.target;
            const memberId = $(txtBox).attr('memberId');
            const skillName = $(txtBox).attr('skill');
            const rank = $(txtBox).val();

            _updateCandidateTsConfirmedSkill(memberId, skillName, rank);
        });
    }

    const _displayTsNotes = (container, candidate) => {
        const div = document.createElement('div');
        $(div).attr('style', 'margin-top:5px');

        $(container).append(div);

        const value = candidate && Array.isArray(candidate.tsNotes) ? candidate.tsNotes.join('\n\n') : '';
        const nodes = _appendTextInput(div, candidate.memberId, 'Note', 400, value, 'tsNote', 7);

        $(nodes.input).keypress((e) => {
            return false
        });


        $(nodes.span).attr('style', 'color:blue')
                     .click((e) => {

            const memberId = $(e.target).attr('memberId');

            // eslint-disable-next-line no-alert
            const note = window.prompt("Add a note?");
            if (note && note.length > 0){
                _updateCandidateTsNotes(memberId, note);
            }
        })

    }

    const _displayTSConfirmedSkillsForCandidate = (container, candidate, display = 'inline') => {
        if (!(container && candidate && candidate.memberId)){
            return;
        }

        const div = document.createElement('div');
        $(div).attr('style', `display:${display}; margin-top:5px; margin-bottom:25px`).text("Rank: ");

        $(container).append(div);

        confirmedSkills.forEach((skillDefinition) => {
            _appendTSSkillInputToCandidateResult(div, skillDefinition.key, skillDefinition.display, candidate);
        });
    }

    const _updateContactInfo = async (inputElement, key) => {
        const memberId = $(inputElement).attr('memberId');
        const candidate = await _getCandidate(memberId);

        if (!candidate){
            return;
        }

        candidate[key] = $(inputElement).val();
        await candidateRepository.update(candidate);
    }

    const _displayPhoneAndEmail = (container, candidate) => {
        const div = document.createElement('div');
        $(div).attr('style', 'margin-bottom: 25px');
        container.append(div);

        const emailNodes = _appendTextInput(div, candidate.memberId, "Email:", 225, candidate.email, 'tsContactInfo tsEmail');

        $(emailNodes.input).change((e) => {
            _updateContactInfo(e.target, "email");
        });

        $(emailNodes.input).dblclick((e) => {
            const input = e.target;
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
        });

        const phoneNumberNodes = _appendTextInput(div, candidate.memberId, "Phone:", 125, candidate.phone, 'tsContactInfo tsPhone');
        $(phoneNumberNodes.input).change((e) => {
            _updateContactInfo(e.target, "phone");
        });
    }

    class TSConfirmCandidateSkillService {
        displayTSConfirmedSkillsForCandidate = _displayTSConfirmedSkillsForCandidate;
        displayTSNote = _displayTsNotes;
        displayPhoneAndEmail = _displayPhoneAndEmail;
        getTSConfirmedSkillsList = () => { JSON.parse(JSON.stringify(confirmedSkills));  }
    }

    window.tsConfirmCandidateSkillService = new TSConfirmCandidateSkillService();
})();