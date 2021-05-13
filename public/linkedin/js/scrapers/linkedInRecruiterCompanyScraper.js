(() => {
    let _companySummary = null;
    let _companyId = null;
    let _currentPage = '';
    let _candidateFound = null;
    let _keyStatsPart = null;
    let _companyProfilePart = null;
    let _employeesPart = null;
    let _notesPart = null;
    let _jobsPart = null;
    let _flattenedPersonal = null;

    const _getCompanyId = () => {
        const href = window.location.href;

        const matches = href.match(new RegExp('/recruiter/company/(\\d+)'));
        if (matches && matches.length > 0) {
            return matches[1];
        }
        return null;
    }

    const _noteClick = (e) => {
        let memberId = $(e.target).attr('memberId');
        // eslint-disable-next-line no-alert
        let noteText = prompt('Enter your note');

        if (!noteText || noteText.length === 0){
            return;
        }

        noteText = `${linkedInApp.alisonUserInitials || 'ME'}: ${(new Date()).toLocaleDateString()} - ${noteText}`;

        if (memberId) {
            memberId = Number.parseInt(memberId);
            const candidate = _flattenedPersonal.find((c) => c.memberId === memberId);
            if (!candidate.tsNotes){
                candidate.tsNotes = [];
            }

            candidate.tsNotes.push(noteText);
            candidateController.saveCandidate(candidate);
        }
        else {
            if (!_companySummary.tsNotes){
                _companySummary.tsNotes = [];
            }

            _companySummary.tsNotes.push(noteText);
            companiesController.saveCompanySummary(_companySummary);
        }

        _displayNotesHistory();
    }

    const _scrapeCompany = async () => {
        const companyId = _getCompanyId();

        if (companyId) {
            const companySummary = _companySummary;

            _scrapeName(companySummary);

            // Scrape Industry, Size and Website
            _scrapeDetails(companySummary);

            // Add a link to jobs in the United States
            companySummary.usaJobsUrl = 'https://www.linkedin.com/jobs/search/?f_C=' + companyId + '&f_CR=103644278&locationId=OTHERS.worldwide';

            // Add a link to jobs in MN
            companySummary.mnJobsUrl = 'https://www.linkedin.com/jobs/search/?f_C=' + companyId + '&f_PP=103039849';

            delete companySummary.usaJobUrl;

            try {
                companiesController.saveCompanySummary(companySummary);
            } catch (e) {
                tsCommon.log(e.message, 'ERROR');
            }
            return companySummary;
        }

        return null;
    }

    const _scrapeDetails = (company) => {
        const detailHeaderElements = $(linkedInSelectors.recruiterCompanyPage.COMPANY_DETAIL_HEADERS);
        const detailElements = $(linkedInSelectors.recruiterCompanyPage.COMPANY_DETAILS);

        for(let i = 0; i < detailHeaderElements.length; i++) {
            const detailType = $(detailHeaderElements[i]).text();
            const detail = $(detailElements[i]).text();

            if (detailType === 'Industry') {
                company.industry = detail;
            } else if (detailType === 'Type') {
                company.type = detail;
            } else if (detailType === 'Company Size') {
                company.size = detail;
            } else if (detailType === 'Website') {
                company.website = detail;
            }
        }
    }

    const _scrapeName = (company) => {
        const name = $(linkedInSelectors.recruiterCompanyPage.COMPANY_NAME).text();
        company.name = name;
    }

    const _createContactDiv = (contact) => {
        if (contact.firstName === 'undefined'){
            return null;
        }

        const div = $(document.createElement('div'))
                    .attr('style', 'margin-bottom:15px; padding-left: 10px');

        const href = `https://www.linkedin.com${contact.linkedInRecruiterUrl}`;

        tsUICommon.createLink(div, href, `${contact.firstName} ${contact.lastName}`, '_blank');
        const headline = $(document.createElement('div'))
                    .text(`${contact.headline} - ${contact.location.replace(', United States', '')}`)

        $(div).append(headline);

        if (contact.phone || contact.email){
            const contactInfo = `${contact.phone || ''}  ${contact.email || ''}`;
            const contactDiv = $(document.createElement('div'))
                                    .text(contactInfo);

            $(div).append(contactDiv);
        }

        const noteLink = tsUICommon.createLink(div, '#', 'Note', null, _noteClick);
        $(noteLink).attr('memberId', contact.memberId);

        return div;
    }

    const _createContactsDiv = (divRoleTitle, contactsArray) => {
        if (!contactsArray || contactsArray.length === 0){
            return;
        }

        const roleTitle = $(document.createElement('div'))
                                .attr('style', 'font-weight:bold; margin-bottom:10px; color:orange')
                                .text(divRoleTitle);

        const container = $(document.createElement('div'))
                            .append(roleTitle);


        contactsArray.forEach((c) => {
            const contactDiv = _createContactDiv(c);
            if (contactDiv){
               $(container).append(contactDiv);
            }
        });

        $(_employeesPart).append(container);
    }

    const _parseNote = (strNote, type, candidate) => {
        // ME: 4/3/2021 Some wordy text
        const result = {type};
        const parts = strNote ? strNote.split(' ') : '';

        if (parts.length > 2){
            result.when = new Date(parts[1]);

            const who = parts[0];
            const note = strNote.replace(parts[0], '').replace(parts[1], '').trim();
            const regarding = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Company';

            result.displayText = `${who} ${parts[1]} (regarding ${regarding}) ${note}`;
        }

        return result;
    }

    const _displayNotesHistory = async () => {
        $('.tsNoteHistory').remove();

        let notes = [];

        _flattenedPersonal.forEach((c) => {
            if (c.tsNotes){
                const parsedNotes = c.tsNotes.map((n) => {
                    return _parseNote(n, 'candidate', c);
                });

                notes = notes.concat(parsedNotes);
            }
        });

        if (_companySummary.tsNotes){
            notes = notes.concat(_companySummary.tsNotes.map((n) => {return _parseNote(n, 'company')}));
        }

        tsArray.sortByObjectProperty(notes, 'when', true);

        notes.forEach((note) => {
            const noteDiv = $(document.createElement('div'))
                                    .text(note.displayText)
                                    .attr('class', 'tsNoteHistory')
                                    .attr('style', 'margin-bottom:15px; padding-left:5px');

            $(_notesPart).append(noteDiv);
        })

    }

    const _displayJobs = async () => {
        $(_jobsPart).html(`<div><div style='margin-bottom:15px; font-weight: bold'>Title  | Location | Age | Last Verified</div></div>`);
        const jobs = await jobsController.getCompanyJobs(_companyId);

        tsArray.sortByObjectProperty(jobs, 'lastVerified');
        for (let i = 0; i < jobs.length && i < 6; i++){
            const j = jobs[i];
            const text = `${j.title} | ${j.location} | ${j.age} | ${(new Date(j.lastVerified)).toLocaleDateString()}`
            const jobDiv = $(document.createElement('div'))
                            .text(text)
                            .attr('style', 'margin-bottom:5px');

            $(_jobsPart).append(jobDiv);
        }
    }

    const _showMessage = async (message, color = 'green') => {
        const tsMsgId = 'liCompanyTsTopCardTsMessage';
        const getSelector = `#${tsMsgId}`;
        let msgElement = $(getSelector)[0];

        if (!msgElement){
            const topCardHeader = $('#topcard div')[0];
            if (topCardHeader){
                msgElement = $(document.createElement('span'))
                                .attr('id', tsMsgId);

                $(topCardHeader).append(msgElement);
            }
        }

        $(msgElement).attr('style', `color:${color}; padding-left:15px`)
                    .text(message);

        await tsCommon.sleep(50);
    }

    const _redrawCompanyData = async () => {
        _showMessage('finding business development contacts, stand by...');
        const personnel = await candidateController.findBizDevelopmentContacts(_companyId);

        if (personnel && personnel.managementWasFound){
            _showMessage('');

            $(_employeesPart).html('');
            $(_notesPart).html(`<div>
                <div style="margin-bottom:15px;" >
                    <span style="font-weight:bold">HISTORY</span>
                    <span><a href='#' style='margin-left: 15px' id='companyNoteLink'>Note</a></span>
                </div>
            </div>`);

            await tsCommon.sleep(50);
            $('#companyNoteLink').click(_noteClick);

            _createContactsDiv('Dev Mgrs', personnel.devManagers);
            _createContactsDiv('QA Mgrs', personnel.qaManagers);
            _createContactsDiv('HR', personnel.hr);
            _createContactsDiv('CEO', personnel.ceo);
            _createContactsDiv('C-Level', personnel.cLevel);
            _createContactsDiv('Developers', personnel.dev);

            _flattenedPersonal = [].concat(personnel.ceo)
                                        .concat(personnel.cLevel)
                                        .concat(personnel.hr)
                                        .concat(personnel.devManagers)
                                        .concat(personnel.qaManagers)
                                        .concat(personnel.dev);



            _displayNotesHistory();
            _displayJobs();
        }
        else {
            _showMessage("No management for this company", 'red');
        }

    }

    class LinkedInRecruiterCompanyScraper {
        getCompanyId = _getCompanyId;
        scrapeCompany = _scrapeCompany;
    }

    window.linkedInRecruiterCompanyScraper = new LinkedInRecruiterCompanyScraper();

    const _delayReady = async () => {
        await tsCommon.sleep(700);

        _currentPage = linkedInCommon.whatPageAmIOn()
        _keyStatsPart = $('#company-key-statistics')[0];
        _jobsPart = $('#company-jobs')[0];
        _notesPart = $('#company-employees')[0];
        _companyProfilePart = $('#topcard')[0];
        _employeesPart = $(document.createElement('div'))
                    .attr('class', 'module primary-module employees');

        $($('#primary-content')[0]).append(_employeesPart);

        if (_currentPage === linkedInConstants.pages.RECRUITER_COMPANY) {
            _companyId = _getCompanyId();
            _companySummary = await companiesController.getSummary(_companyId) || { _companyId };

            if (!isNaN(_companyId)){
                _companyId = Number.parseInt(_companyId);
            }

            _scrapeCompany();
            _redrawCompanyData();
        }
    }

    $(document).ready(() => {
       _delayReady();
    })
})();