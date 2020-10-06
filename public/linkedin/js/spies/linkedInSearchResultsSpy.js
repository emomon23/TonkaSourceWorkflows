(() => {
    const _bindToRecruiterProfileLinks = async() => {
        await tsCommon.sleep(1000);
        const profileLinks = $('a[href*="/recruiter/profile/"]');

        $(profileLinks).bind('click', (e) => {
            let parent = e.target.parentElement;
            while (parent && parent.tagName !== 'LI'){
                parent = parent.parentElement;
            }

            if (parent){
                const memberId = $(parent).attr('id').replace('search-result-', '');
                searchResultsScraper.persistLastRecruiterProfile(memberId);
                searchResultsScraper.persistToLocalStorage()
            }
        });
    }

    class LinkedInSearchResultsSpy {
        bindToRecruiterProfileLinks = _bindToRecruiterProfileLinks;
    }

    window.linkedInRecruiterProfileSpy = new LinkedInSearchResultsSpy();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS) {
            _bindToRecruiterProfileLinks();
        }
    })
})();