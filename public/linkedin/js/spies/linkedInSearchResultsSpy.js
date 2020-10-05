(() => {
    const _bindToRecruiterProfileLinks = async() => {
        await tsCommon.sleep(1000);
        const profileLinks = $('a[href*="/recruiter/profile/"]');

        $(profileLinks).bind('click', (e) => {
            const memberId = $(e.target).attr('href').replace('/recruiter/profile/', '').split(',')[0];
            searchResultsScraper.persistLastRecruiterProfile(memberId);
            searchResultsScraper.persistToLocalStorage();
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