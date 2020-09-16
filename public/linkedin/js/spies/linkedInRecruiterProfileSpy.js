(() => {
    const _bindToPublicProfileLink = async() => {
        await tsCommon.sleep(2000);
        const publicProfileLink = tsUICommon.findDomElement('a[href*="linkedin.com/in/"][target="_blank"]');
        if (publicProfileLink != null){
            
            $(publicProfileLink).bind('click', () => {
                const memberId = linkedInRecruiterProfileScraper.getMemberId();
                if (memberId != null){
                    const candidateContainer = searchResultsScraper.scrapedCandidates[memberId];
                    if (candidateContainer && candidateContainer.candidate){
                        // Add LinkedIn Profile URL to candidate
                        candidateContainer.candidate.linkedIn = $(publicProfileLink).attr('href');
                        linkedInCommon.callAlisonHookWindow('saveLinkedInContact', candidateContainer.candidate);
                    } 
                }
            });

        }
    }
   
    class LinkedInRecruiterProfileSpy {
        bindToPublicProfileLink = _bindToPublicProfileLink;
    }

    window.linkedInRecruiterProfileSpy = new LinkedInRecruiterProfileSpy();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_PROFILE) {
            _bindToPublicProfileLink();
        }
    })
})();