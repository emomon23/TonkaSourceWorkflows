(() => {
    const _bindToElements = async () => {
        await _bindToRecruiterProfileLinks();
        _bindToJumperGradeRollOver();

        linkedInApp.showTsReady();
    }

    const _bindToJumperGradeRollOver = async () => {
        try {
            let jGrades = await tsUICommon.jQueryWait('div.grade-container', 10000);

            if (jGrades.length > 0){
                jGrades = jGrades.toArray();
                for (let j = 0; j < jGrades.length; j++) {
                    const jg = jGrades[j];
                    const memberId = $(jg).attr('memberId');

                    // eslint-disable-next-line no-await-in-loop
                    const candidate = await candidateController.getCandidate(memberId);
                    const tooltipText = candidate && candidate.technicalYearString ? candidate.technicalYearString : 'none';
                    const tooltip = document.createElement("span");
                    $(tooltip).attr("class", "tooltiptext").html(tooltipText);
                    $(jg).append(tooltip);
                }
            }
        }
        catch (e) {
            tsCommon.logError(e);
        }
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
                        searchResultsScraper.persistLastRecruiterProfile(memberId);
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
    }

    window.linkedInRecruiterProfileSpy = new LinkedInSearchResultsSpy();

    const _delayReady = async () => {
        await tsCommon.sleep(500);
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