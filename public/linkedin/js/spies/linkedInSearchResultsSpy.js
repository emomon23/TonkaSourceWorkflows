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
                tsConfirmCandidateSkillService.displayTSConfirmedSkillsForCandidate(liElements[i], candidate);
                tsConfirmCandidateSkillService.displayTSNote(liElements[i], candidate);
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

            $(profileLinks)
                .on('click', (e) => {
                    let parent = e.target.parentElement;
                    while (parent && parent.tagName !== 'LI'){
                        parent = parent.parentElement;
                    }

                    if (parent){
                        const memberId = $(parent).attr('id').replace('search-result-', '');
                        linkedInSearchResultsScraper.persistLastRecruiterProfile(memberId);
                    }

                    $(e.target).attr('target', '_blank');
                });
        }
        catch (e) {
            tsCommon.logError(e);
        }
    }

    class LinkedInSearchResultsSpy {
        bindToRecruiterProfileLinks = _bindToRecruiterProfileLinks;
        appendToKeywordsFilter = _appendToKeywordsFilter;
        getActivelySeekingString = () => {return _activelySeekingFilterString};
    }

    window.linkedInRecruiterProfileSpy = new LinkedInSearchResultsSpy();

    const _delayReady = async () => {
        await tsCommon.sleep(1500);
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS) {
            _bindToElements();
        }

        $('a[class*="page-link"]').click(() => {
            _delayReady();
        })
    }
    $(document).ready(() => {
       _delayReady();
    })
})();