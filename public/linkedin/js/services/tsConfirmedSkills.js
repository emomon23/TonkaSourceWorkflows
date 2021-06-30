(() => {
    let confirmedSkillsList = skillStats.getTSConfirmationSkills();

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

    const _appendTextInput = (container, memberId, labelText, width, value, strClass = '', rows = 1, spanHref = null) => {
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

        let label = span;
        if (spanHref && spanHref.length){
            label = document.createElement('a');
            $(label).append(span)
                    .attr('href', spanHref);
        }

        $(container).append(label)
                    .append(input);

        return {input, span};
    }

    const _appendTSSkillInputToCandidateResult = (container, confirmedSkillProperty, displayValue, candidate) => {
        let value = '';
        if (candidate && candidate.tsConfirmedSkills && candidate.tsConfirmedSkills[confirmedSkillProperty]){
            value = candidate.tsConfirmedSkills[confirmedSkillProperty];
        }

        const nodes = _appendTextInput(container, candidate.memberId, displayValue, 15, value, 'skillRank tsCandidateControl');
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

    const _displayFlagIndianName = (container, candidate) => {
        if (!candidate.origin) {
            const div = document.createElement('div');
            const firstName = $(document.createElement('span'))
                                .attr('style', 'color:blue; padding-left:15px')
                                .attr('memberId', candidate.memberId)
                                .attr('class', 'tsCandidateControl')
                                .text(`${candidate.firstName}`)
                                .click((e) => {
                                    const memberId = $(e.target).attr('memberId');
                                    candidateController.flagOrigin(memberId, 'India', ['firstName']);
                                    $(e.target).attr('style', 'color:green; padding-left:15px');
                                });

            const lastName = $(document.createElement('span'))
                                .attr('style', 'color:blue; padding-left:45px')
                                .attr('memberId', candidate.memberId)
                                .attr('class', 'tsCandidateControl')
                                .text(`${candidate.lastName}`)
                                .click((e) => {
                                    const memberId = $(e.target).attr('memberId');
                                    candidateController.flagOrigin(memberId, 'India', ['lastName']);

                                    $(e.target).attr('style', 'color:green; padding-left:45px');
                                });

            const both = $(document.createElement('span'))
                                .attr('style', 'color:blue; padding-left:45px')
                                .attr('memberId', candidate.memberId)
                                .attr('class', 'tsCandidateControl')
                                .text('Both')
                                .click((e) => {
                                    const memberId = $(e.target).attr('memberId');
                                    candidateController.flagOrigin(memberId, 'India', ['firstName', 'lastName']);

                                    $(e.target).attr('style', 'color:green; padding-left:45px');
                                });

            $(div).text('sponsor indicator')
                    .append(firstName)
                    .append(lastName)
                    .append(both);

            $(container).append(div);
        }

    }

    const _toggleIsJobSeeker = async (e) => {
        const checkbox = e.target;
        const memberId = $(checkbox).attr('memberId');

        const isJobSeeker = $(checkbox).is(':checked');

        candidateController.toggleIsTsJobSeeker(memberId, isJobSeeker);
    }

    const _displayIsConfirmedJobSeeker = (container, candidate) => {
        // TS Job Seeker, Is Ts job seeker

        let checkbox = {
                        type:'checkbox',
                        memberId: candidate.memberId,
                        style: 'margin-left: 5px',
                        class: 'tsCandidateControl',
                        isTsJobSeeker: candidate.isTsJobSeeker // just a debug attribute
                    };

        if (candidate && candidate.isTsJobSeeker){
            checkbox.checked = true;
        }

        const formInput = tsUICommon.createInput(container,{text: 'TS Job Seeker', class: 'tsCandidateControl'}, checkbox);
        $(formInput.input).bind('change', _toggleIsJobSeeker);

    }

    const _displayTsNotes = (container, candidate) => {
        const div = document.createElement('div');
        $(div).attr('id', 'tsNotesDiv')
              .attr('class', 'tsCandidateControl')
              .attr('style', 'margin-top:5px');

        $(container).append(div);

        const value = candidate && Array.isArray(candidate.tsNotes) ? candidate.tsNotes.join('\n\n') : '';
        const nodes = _appendTextInput(div, candidate.memberId, 'Note', 400, value, 'tsCandidateControl tsNote', 7);

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

    const _clearUI = () => {
        $('.tsCandidateControl').remove();
    }

    const _displayTSConfirmedSkillsForCandidate = (container, candidate, display = 'inline') => {
        if (!(container && candidate && candidate.memberId)){
            return;
        }

        const div = document.createElement('div');
        $(div).attr('id', 'tsSkillsDiv')
              .attr('style', `display:${display}; margin-top:5px; margin-bottom:25px`)
              .attr('class', 'tsCandidateControl')
        .text("Rank: ");

        $(container).append(div);

        confirmedSkillsList.forEach((skillDefinition) => {
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
        $(div).attr('id', 'tsPhoneEmailDiv')
              .attr('style', 'margin-bottom: 25px')
              .attr('class', 'tsCandidateControl')
        container.append(div);

        const mailToHref = candidate.email ? `mailTo:${candidate.email}` : null;
        const emailNodes = _appendTextInput(div, candidate.memberId, "Email:", 225, candidate.email, 'tsContactInfo tsEmail tsCandidateControl', 1, mailToHref);



        $(emailNodes.input).change((e) => {
            _updateContactInfo(e.target, "email");
        });

        $(emailNodes.input).dblclick((e) => {
            const input = e.target;
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
        });

        const phoneNumberNodes = _appendTextInput(div, candidate.memberId, "Phone:", 125, candidate.phone, 'tsContactInfo tsPhone tsCandidateControl');
        $(phoneNumberNodes.input).change((e) => {
            _updateContactInfo(e.target, "phone");
        });
    }

    const _displayAllTheTsControls = (container, candidate) => {
        _displayPhoneAndEmail(container, candidate);
        _displayFlagIndianName(container, candidate)
        _displayTSConfirmedSkillsForCandidate(container, candidate);
        _displayTsNotes(container, candidate);
        _displayIsConfirmedJobSeeker(container, candidate);
    }
    class TSConfirmCandidateSkillService {
        displayTSConfirmedSkillsForCandidate = _displayTSConfirmedSkillsForCandidate;
        displayFlagIndianName = _displayFlagIndianName;
        displayTSNote = _displayTsNotes;
        displayIsConfirmedJobSeeker = _displayIsConfirmedJobSeeker;
        displayPhoneAndEmail = _displayPhoneAndEmail;
        displayAllTheTsControls = _displayAllTheTsControls;
        getTSConfirmedSkillsList = () => { JSON.parse(JSON.stringify(confirmedSkillsList));  }
        clearUI = _clearUI;
    }

    window.tsConfirmCandidateSkillService = new TSConfirmCandidateSkillService();
})();