(() => {
    const _triggerUrl = '/recruiter/profile/'

    const _bindToPublicProfileAnchorTag = async() => {
        await tsCommon.sleep(300);
        if (window.location.href.indexOf(_triggerUrl) > 0) {
            const publicProfileLink = tsUICommon.findDomElement('a[href*="linkedin.com/in/"][target="_blank"]');
            if (publicProfileLink != null){
               
                $(publicProfileLink).click(() => {
                    const memberId = tsQueryStringParser.memberId;
                    if (memberId != null){
                        const candidateContainer = searchResultsScraper.scrapedCandidates[memberId];
                        if (candidateContainer && candidateContainer.candidate){
                            linkedInCommon.callAlisonHookWindow('saveLinkedInContact', candidateContainer.candidate);
                        } 
                    }
                });

            }
        }
       
    }
   
    const _bindToRecruiterProfileLinks = async() => {
        await tsCommon.sleep(1000);
        const profileLinks = $('a[href*="/recruiter/profile/"]');

        $(profileLinks).bind('click', () => {
            searchResultsScraper.persistToLocalStorage();
        });
    }

    $(document).ready(() => {
        _bindToPublicProfileAnchorTag();

        _bindToRecruiterProfileLinks();
    })
})();