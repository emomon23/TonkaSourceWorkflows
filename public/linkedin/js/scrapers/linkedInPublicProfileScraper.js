(() => {
    const _findCachedCandidate = () => {
        const firstAndLastName = _scrapeFirstAndLastNameFromProfile();
        return searchResultsScraper.findCandidate(firstAndLastName);
    }

    const _scrapeFirstAndLastNameFromProfile = () => {
        let element = tsUICommon.findFirstDomElement(['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")']);
        if (element === null){
            return null;
        }

        let wholeName =  $(element).prop("tagName") === "BUTTON" ? $(element).attr('aria-label') : $(element).text();
        ["Connect with ", "Share ", "Save ","’s profile via message", "' profile via message", "profile via message", "'s profile to PDF", "' profile to PDF", "profile to PDF", "Report or block"].forEach((remove) => {
            wholeName = wholeName.split(remove).join('');
        })

        wholeName = wholeName.split(',')[0].trim(); //This will handle "Alan Haggerty, MCEE"
        if (wholeName.indexOf('(') === 0){
            wholeName = wholeName.substr(wholeName.indexOf(' ')); //This will handle "(75) Alan Haggerty"
        }

        const firstAndLast = wholeName.split(' ');
        let result = {}

        if (firstAndLast.length > 1){
            result.firstName = firstAndLast[0];
            firstAndLast.splice(0, 1);
            result.lastName = firstAndLast.join(' ');
        }

        return result;
    }

    const _scrapeProfile = async () => {
        const cachedCandidate = await _findCachedCandidate();
        
        if (cachedCandidate) {
            const updatedCandidate = await linkedInContactInfoScraper.scrapeContactInfo(cachedCandidate);
            searchResultsScraper.scrapedCandidates[cachedCandidate.memberId].candidate = updatedCandidate;
            searchResultsScraper.persistToLocalStorage();
            
            await linkedInApp.upsertContact(updatedCandidate);

            return updatedCandidate;
        } else {
            tsCommon.log("Public Profile Scraper:  Could not locate cached candidate to update.", "WARN");
        }
        
        return null;
    }

    class LinkedInPublicProfileScraper {
        scrapeProfile = _scrapeProfile;      
    }

    window.linkedInPublicProfileScraper = new LinkedInPublicProfileScraper();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PUBLIC_PROFILE) {
            _scrapeProfile();
        }
    })
})();