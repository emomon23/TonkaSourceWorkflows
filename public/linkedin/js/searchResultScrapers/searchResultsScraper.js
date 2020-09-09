(function() {
    const _scrapeCandidateHtml = (candidate) => {
        //Get data from HTML, not found in JSON.
        const liTag = $(`#search-result-${candidate.memberId}`);
        tsCommon.extendWebElement(liTag);

        const profileLink = liTag.mineElementWhereClassContains('profile-link');
        candidate.linkedInRecruiterUrl = $(profileLink).attr("href");

        const imageTag = liTag.mineTag('img');
        candidate.imageUrl = imageTag? $(imageTag).attr('src') : '';
 
        const cityState = candidate.location? candidate.location.split(',') : [""];
        candidate.city = cityState[0];
        candidate.state = cityState.length > 1? cityState[1].trim() : "";

        if (candidate.degree){
            candidate.networkConnection = candidate.degree.replace('FIRST_DEGREE', '1').replace('SECOND_DEGREE', '2').replace('THIRD_DEGREE', 3);
            if ('123'.indexOf(candidate.networkConnection) == -1){
                candidate.networkConnection = '4';
            }
        }
    }

    const _waitForResultsHTMLToRender = async (lastCandidate) => {
        const lastCandidateId = `#search-result-${lastCandidate.memberId}`;
        let liTag = $(lastCandidateId);
        let count = 0;

        while(count < 50 && (!liTag || !$(liTag).attr('id'))){
            await tsCommon.sleep(100);
            liTag = $(lastCandidateId);
        }
    }

    const _searchCandidates = (scrapedCandidates, searchFor) => {
        let candidateReference = null;
        
        try {
            candidateReference = scrapedCandidates[searchFor];
        }catch {}

        if (candidateReference != undefined && canidateReference != null){
            return candidateReference.candidate;
        }

        let firstAndLastName = searchFor.split(' ');
        if (firstAndLastName.length === 2){
            candidateReference
            firstAndLastName[0] = firstAndLastName[0].toLowerCase();
            firstAndLastName[1] = firstAndLastName[1].toLowerCase();

            for(let k in scrapedCandidates) {
                const c = scrapedCandidates[k].candidate;
                const cFirstName = (c.firstName || '').toLowerCase();
                const cLastName = (c.lastName || '').toLowerCase();

                if (cFirstName === firstAndLastName[0] && cLastName === firstAndLastName[1]){
                    candidateReference = c;
                    break;
                }
            }

            return candidateReference;
        }
    }

    const _interceptSearchResults = async (responseObj) => {
        const interceptedResults = JSON.parse(responseObj.responseText);
        const candidatesInResults = interceptedResults.result.searchResults;

        if (candidatesInResults && candidatesInResults.length > 0){
            await _waitForResultsHTMLToRender(candidatesInResults[candidatesInResults.length -1]);

            candidatesInResults.forEach((candidate) => {
                _scrapeCandidateHtml(candidate);
                const existingCachedCandidate = searchResultsScraper.scrapedCandidates[candidate.memberId];
                if (existingCachedCandidate === undefined){
                    searchResultsScraper.scrapedCandidates[candidate.memberId] = {candidate, isSelected:false};
                }
                else if (existingCachedCandidate.isSelected == true) {
                    linkedInApp.changeBadgeColor(candidate.memberId, 'red');
                }
            });

            $('.badges abbr').bind("click", function(e) {
                const element = $(e.currentTarget);

                const style = $(element).attr('style') || '';
                const isRed = style.indexOf('red') > -1;
                const changeColor = isRed? 'black' : 'red';

                $(element).attr('style', 'color:' + changeColor);

                const candidateMemberId = $('li').has(element).attr('id').replace('search-result-', '')
                const container = searchResultsScraper.scrapedCandidates[candidateMemberId];
                
                if (container != undefined){
                    const candidate = container.candidate;
                    container.isSelected = !isRed;
                    const {memberId, firstName, lastName, location, networkConnection, isJobSeeker} = candidate;
                    linkedInCommon.callAlisonHookWindow('toggleCandidateSelection', {memberId, firstName, lastName, location, networkConnection, isJobSeeker, isSelected: !isRed});
                }
                else {
                    console.log({msg: 'Unable to find candidate:', helper});
                }

            });
        }
    }

    class SearchResultsScraper {
        scrapedCandidates = {};
        constructor(){}

        advanceToNextLinkedInResultPage = linkedInCommon.advanceToNextLinkedInResultPage;
        
        deselectCandidate = (memberId) => {
            if (this.scrapedCandidates[memberId] != undefined){
                this.scrapedCandidates[memberId].isSelected = false;
            }
        };

        findCandidate = (searchFor) => {
            return _searchCandidates(this.scrapedCandidates, searchFor);
        }

        interceptSearchResults = _interceptSearchResults;
    }

    window.searchResultsScraper = new SearchResultsScraper();
})();

