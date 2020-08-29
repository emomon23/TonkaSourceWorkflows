(function() {
    const _scrapeResults = async (confirmEach = false) => {
        candidates = [];
        var names = '';
        var keepScraping = false;
        var confirmed = true;

        do {
            tsCommon.log("scraping current page, stand by...");

            const contactsOnThisPage = _scrapeCurrentPageCandidateResults(candidates);

            if (confirmEach === true){
                for (var i=0; i<candidates.length; i++){
                    confirmed =  candidates[i].confirm();
                    if (!confirmed){
                        break;
                    }
                }

                if (!confirmed){
                    break;
                }
            }

            tsCommon.log("current page scraped. " + contactsOnThisPage + " contacts on this single page: ");
            if (contactsOnThisPage > 24) {
                await tsCommon.randomSleep(5000, 20000);
            }

            keepScraping = linkedInCommon.advanceToNextLinkedInResultPage();
            if (keepScraping){
                //Wait for it to load
                await tsCommon.sleep(5000);
            }
            else {
                tsCommon.log("done scraping candidates from linked in." + candidates.length + " contacts scraped in all");
            }
        }
        while(keepScraping)

        return candidates;
    }

    const _scrapeCurrentPageCandidateResults = (candidates) => {
        const liResultTags = $("li[class*='search-result']").toArray();
        tsCommon.extendWebElements(liResultTags);

        liResultTags.forEach((liTag) => {
            const profileLink = liTag.mineElementWhereClassContains('profile-link');
            const newContact = _scrapeCandidate(profileLink.text);
            newContact.id = $(liTag).attr('id').replace('search-result-', '');

            candidates.push(newContact);
        });

        return liResultTags.length;
    }

    const _scrapeCandidate = (fullName, confirmWhenDone = false) => {
        const liTag = $("li[class*='search-result']:contains('" + fullName + "')")[0];
        tsCommon.extendWebElement(liTag);

        const profileLink = liTag.mineElementWhereClassContains('profile-link');
        const newContact = linkedInContactFactory.newLinkedInContact(profileLink.text);

        newContact.linkedInRecruiterUrl = $(profileLink).attr("href");

        const locationTag = liTag.mineElementWhereClassContains("location");
        newContact.setLocation($(locationTag).text());

        const imageTag = liTag.mineTag('img');
        newContact.imageUrl = imageTag? $(imageTag).attr('src') : '';

        const is1stDegree = liTag.containsText('is your connection');
        const is2ndDegree = liTag.containsText('2nd degree connection');
        newContact.networkConnection = is1stDegree? 1 : is2ndDegree? 2 : 3;

        const olTag = liTag.mineTag("ol");
        const firstPositionTag = olTag.mineTag("li");
        const rawPosition = $(firstPositionTag).text();

        newContact.setCurrentPosition(rawPosition);

        if (confirmWhenDone){
            newContact.confirm();
        }

        return newContact;
    }

    class SearchResultsScraper {
        constructor(){}

        scrapeResults = _scrapeResults;
        scrapeCurrentPageCandidateResults = _scrapeCurrentPageCandidateResults;
        scrapeCandidate = _scrapeCandidate;
    }

    window.__ts_searchResultScraper = new SearchResultsScraper();
})();

