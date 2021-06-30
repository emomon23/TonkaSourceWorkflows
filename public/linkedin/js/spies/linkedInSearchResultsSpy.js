(() => {
    let liElements = [];
    const _activelySeekingFilterString = `("seeking new opportunit" OR "seeking an opportun" OR "seeking opportunit" OR "seeking a opportunit" OR "seeking employment" OR "seeking entry" OR "currently seeking " OR "actively seeking" OR "actively looking" OR "currently looking" OR "opentowork" OR "open to work" OR "looking for new" OR "looking for a") `;

    const _addActivelySeekingTextButtonToUI = () => {
        const existing = $('#activelySeekingTextButton')[0];
        if (existing){
            return;
        }

        const labelElement  = $('#keywords-label')[0];

        if (labelElement){
            const a = document.createElement('a');
            $(labelElement).append(a);

            $(a)
                .attr('href', '#')
                .attr('id', 'activelySeekingTextButton')
                .text('  ActivelySeeking')
                .click(async () => {
                    const editBtn = $('li[title*="Profile keywords"] button[class*="add-pills-btn"]')[0];
                    if (editBtn){
                        editBtn.click();
                        await tsCommon.sleep(500);
                        _appendToKeywordsFilter(_activelySeekingFilterString);
                    }
                });
        }
    }

    const _getRawKeywordsString = () => {
        const textArea = $('#facet-keywords textarea')[0];
        return textArea ? $(textArea).val() : '';
    }

    const _appendToKeywordsFilter = async (appendText) => {
        const textArea = $('#facet-keywords textarea')[0];
        if (textArea){
            $(textArea).focus();
            const existingText = $(textArea).val();

            if (existingText && existingText.length){
                await tsUICommon.executeDelete(textArea, existingText.length + 30);
            }

            const insertText = existingText && existingText.length ? `${existingText}\n${appendText}` : appendText;
            document.execCommand('insertText', 'true', insertText);
        }
    }

    const _toggleSearchResults = (e) => {
        const buttonClicked  = $(e.target);
        const candidateHideProperty = $(buttonClicked).attr('hide-candidate-property');
        let buttonText = $(buttonClicked).text();
        const needToHide = $(buttonClicked).attr('current-state') === 'show';
        const changeState = needToHide ? 'hide' : 'show';
        const color = needToHide ? "yellow" : 'orange';
        const decorate = $(buttonClicked).attr('decorate') === "true"

        if (decorate && !tsCommon.getCachedData('decorateSearchResultsFilter')){
            tsConstants.HOSTING_URL = `http://${'localhost:5001'}`
            tsCommand.launchSkillsGPASearch();
        }

        if (!window.hideCandidates){
            window.hideCandidates = {};
        }

        window.hideCandidates[candidateHideProperty] = needToHide;

        if (needToHide){
            buttonText = buttonText.replace('Hide', 'Show');
        }
        else {
            buttonText = buttonText.replace('Show', 'Hide');
        }

        $(buttonClicked)
            .text(buttonText)
            .attr('current-state', changeState)
            .attr('style', `color:${color}; padding-left: 15px`)

        linkedInSearchResultsScraper.updateCandidateDisplayedInResultList();

    }

    const _renderTSFilterButtonsOnTopBar = async () => {
        const topBar =  (await tsUICommon.waitForSelector('#top-bar'))[0];
        const hideCandidates = window.hideCandidates ? window.hideCandidates : {};

        let props = hideCandidates.hideH1b ? { text: 'Show H1', color: 'yellow'} : { text: 'Hide H1', color: 'orange'}
        tsUICommon.createButton({container: topBar, element: 'span', text:props.text, style: `color:${props.color}; padding-left:15px`, attr: {"current-state" : 'show', "hide-candidate-property" : "hideH1b"}, onclick: _toggleSearchResults});

        props = hideCandidates.hideDisqualified ? { text: 'Show Disqualified', color: 'yellow'} : { text: 'Hide Disqualified', color: 'orange'}
        tsUICommon.createButton({container: topBar, element: 'span', text:props.text, style: `color:${props.color}; padding-left:15px`,attr: {"current-state" : 'show', "decorate" : "true", "hide-candidate-property" : "hideDisqualified"}, onclick: _toggleSearchResults});

        props = hideCandidates.hideNoKeyword ? { text: 'Show No KW Matches', color: 'yellow'} : { text: 'Hide No KW Matches', color: 'orange'}
        tsUICommon.createButton({container: topBar, element: 'span', text:'Hide No KW Matches', style: `color:${props.color}; padding-left:15px`, attr: {"current-state" : 'show', "decorate" : "true", "hide-candidate-property" : "hideNoKeyword"}, onclick: _toggleSearchResults});

    }

    const _displayTSConfirmedSkillsForSearchResultList = async () => {
        let liElements = null;

        for (let i = 0; i < 8; i++){
            liElements = $('li[id*="search-result-"]');
            if (liElements && liElements.length > 0){
                liElements = liElements.toArray();
                break;
            }

            liElements = null;
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(500);
        }

        if (!liElements){
            return;
        }

        const memberIds = liElements.map((li) => {
            const memberId = $(li).attr('id').replace('search-result-', '');
            return !isNaN(memberId) ? Number.parseInt(memberId) : memberId;
        });

        const candidates = await candidateRepository.getSubset(memberIds);
        if (!candidates && candidates.length){
            return;
        }

        for (let i = 0; i < liElements.length; i++){
            const candidate = candidates.find(c => c.memberId === memberIds[i]);
            if (candidate) {
                tsConfirmCandidateSkillService.displayPhoneAndEmail(liElements[i], candidate);
                tsConfirmCandidateSkillService.displayFlagIndianName(liElements[i], candidate)
                tsConfirmCandidateSkillService.displayTSConfirmedSkillsForCandidate(liElements[i], candidate);
                tsConfirmCandidateSkillService.displayTSNote(liElements[i], candidate);
                tsConfirmCandidateSkillService.displayIsConfirmedJobSeeker(liElements[i], candidate);
            }
        }
    }

    const _bindToElements = async () => {
        liElements = $('li[id*="search-result-"]');
        await _bindToRecruiterProfileLinks();
        _addActivelySeekingTextButtonToUI();
        _displayTSConfirmedSkillsForSearchResultList();

        linkedInApp.showTsReady();
    }

    const _bindToRecruiterProfileLinks = async () => {
        try {
            const profileLinks = await tsUICommon.jQueryWait('a[href*="/recruiter/profile/"]');

            for (let i = 0; i < profileLinks.length; i++){
                const l = profileLinks[i];
                $(l).attr('target', '_blank');
            }

            $(profileLinks)
                .on('click', async (e) => {
                    let parent = e.target.parentElement;
                    while (parent && parent.tagName !== 'LI'){
                        parent = parent.parentElement;
                    }

                    if (parent){
                        const memberId = $(parent).attr('id').replace('search-result-', '');
                        linkedInSearchResultsScraper.persistLastRecruiterProfile(memberId);
                    }
                });
        }
        catch (e) {
            tsCommon.logError(e);
        }
    }

    class LinkedInSearchResultsSpy {
        bindToRecruiterProfileLinks = _bindToRecruiterProfileLinks;
        appendToKeywordsFilter = _appendToKeywordsFilter;
        getRawKeywordsString = _getRawKeywordsString;
        getActivelySeekingString = () => {return _activelySeekingFilterString};
        bindToElements = _bindToElements;
    }

    window.linkedInSearchResultsSpy = new LinkedInSearchResultsSpy();

    const _delayReady = async () => {
        await tsCommon.sleep(1500);
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS) {
            _bindToElements();
            _renderTSFilterButtonsOnTopBar();
        }

        $('a[class*="page-link"]').click(() => {
            _delayReady();
        })
    }
    $(document).ready(() => {
       _delayReady();
    })
})();