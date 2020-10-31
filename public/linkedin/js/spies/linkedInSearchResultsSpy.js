(() => {
    const _bindToElements = async() => {
        await tsCommon.sleep(1000);
        _bindToRecruiterProfileLinks();

        _bindToJumperGradeRollOver();
    }

    const _bindToJumperGradeRollOver = async () => {
        //wait for the jGrades to render
        let jGrades = null;
        for(let i=0; i<20; i++){
            jGrades = $('div.grade-container');
            if (jGrades.length > 0){
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.sleep(1000);
                break;
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(500);
        }

        if (jGrades.length > 0){
            jGrades = jGrades.toArray();
            jGrades.forEach((jg) => {
                const memberId = $(jg).attr('memberId');
                const candidate = searchResultsScraper.findCandidate(memberId);
                const tooltipText = candidate && candidate.technicalYearString ? candidate.technicalYearString : 'none';
                const tooltip = document.createElement("span");
                $(tooltip).attr("class", "tooltiptext").html(tooltipText);
                $(jg).append(tooltip);
            })
        }
    }

    const _bindToRecruiterProfileLinks = async() => {
        const profileLinks = $('a[href*="/recruiter/profile/"]');

        $(profileLinks).bind('click', (e) => {
            let parent = e.target.parentElement;
            while (parent && parent.tagName !== 'LI'){
                parent = parent.parentElement;
            }

            if (parent){
                const memberId = $(parent).attr('id').replace('search-result-', '');
                searchResultsScraper.persistLastRecruiterProfile(memberId);
            }
        });
    }

    class LinkedInSearchResultsSpy {
        bindToRecruiterProfileLinks = _bindToRecruiterProfileLinks;
    }

    window.linkedInRecruiterProfileSpy = new LinkedInSearchResultsSpy();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS) {
           _bindToElements();
        }
    })
})();