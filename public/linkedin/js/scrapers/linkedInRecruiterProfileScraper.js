(() => {
    const _getMemberId = () => {
        return tsQueryStringParser.memberId;
    }

    const _scrapeProfile = async () => {
        await tsCommon.sleep(2000);
        var memberId = _getMemberId();

        const skills = [];
        var skillElements = $(linkedInSelectors.recruiterProfilePage.skillsList).children("li");

        if (skillElements) {
            $(skillElements).each((index, skillElement) => {
                skills.push($(skillElement).html());
            });
        }

        if (searchResultsScraper.scrapedCandidates[memberId]) {
            searchResultsScraper.scrapedCandidates[memberId].candidate.linkedInSkills = skills; 
        }

        return null;
    }

    class LinkedInRecruiterProfileScraper {
        getMemberId = _getMemberId;
        scrapeProfile = _scrapeProfile;
    }

    window.linkedInRecruiterProfileScraper = new LinkedInRecruiterProfileScraper();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_PROFILE) {
            _scrapeProfile();
        }
    })
})();