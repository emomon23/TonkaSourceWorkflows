(() => {
    const _getMemberId = () => {
        return $(linkedInSelectors.recruiterProfilePage.profileId).val();
    }

    const _scrapeProfile = async () => {
        await tsCommon.sleep(2000);
        var memberId = _getMemberId();
        var candidateObj = searchResultsScraper.scrapedCandidates[memberId];

        // If we've scraped this candidate, proceed
        if (candidateObj) {
            var candidate = candidateObj.candidate;

            // Scrape Public Profile
            candidate.linkedIn = _scrapePublicProfileLink();

            // Scrape skills
            candidate.linkedInSkills = _scrapeSkills();

            if (_shouldSaveCandidate(candidate)) {
                await linkedInApp.upsertContact(candidate);
            } else {
                // If we don't save the candidate, we need to update local storage with details
                searchResultsScraper.scrapedCandidates[memberId].candidate = candidate;
                searchResultsScraper.persistToLocalStorage();
            }
        }

        return null;
    }

    const _scrapePublicProfileLink = () => {
        return $(linkedInSelectors.recruiterProfilePage.publicProfileLink).attr("href");
    }

    const _scrapeSkills = () => {
        const skills = [];
        var skillElements = $(linkedInSelectors.recruiterProfilePage.skillsList).children("li");

        if (skillElements) {
            $(skillElements).each((index, skillElement) => {
                skills.push($(skillElement).html());
            });
        }

        return skills;
    }

    const _shouldSaveCandidate = (candidate) => {
        // This is our ability to scrape and save anyone we step into after searching
        if (linkedInConstants.SAVE_AFTER_RECRUITER_PROFILE_SCRAPE) {
            return true;
        }
        // Save candidate if isJobSeeker
        if (candidate.isJobSeeker === true) {
            return true;
        }
        return false;
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