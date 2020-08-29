(function() {
    //These are High Level 'Commands' that the app supports
    //that the alisonHook UI (or user) can call.

    const _sendMessageToCandidates = (data) => {
        console.log(data);
    }

    const _candidatesMarshallToAlisonUIRequested = async () => {
        //post message can only handle about 20 candidates at a time, break it up
        tslog("Alision UI Marshalling Request");
        const groupedCandidates = [];
        const copy = [...candidates];
        const groupBy = 15;

        while (copy.length) {
            groupedCandidates.push(copy.splice(0, groupBy));
        }

        for(var i=0; i<groupedCandidates.length; i++){
            const isThisTheLastBatch = i === groupedCandidates.length-1;
            callTonkaSource('candidatesMarshallToAlisonUIResponse', { candidates: groupedCandidates[i], isThisTheLastBatch});
            await sleep(400);
        }

        tsLog("Marshalling complete");
    }

    const _getCandidatePublicProfile = async (candidateId) => {
        //const found = candidates.find(c => c.id === candidateId);
        const found = candidates[candidateId];
        if (!found){
            tsLog("Unable to find candidate " + candidateId);
            return;
        }

        const linkedInRecruiterUrl = found.linkedInRecruiterUrl;
        const recruiterProfile = httpGetJson(linkedInRecruterUrl);
        await sleep(3000);
    }

    const _scrapeCandidateResults = async() => {
        const scraper = searchResultScraperFactory.getSearchResultScraper();
        window.scrapedCandidates = await scraper.scrapeResults();

        $('.badges abbr').bind("click", function(e) {
            const element = $(e.currentTarget);

            const style = $(element).attr('style') || '';
            const isRed = style.indexOf('red') > -1;
            const changeColor = isRed? 'black' : 'red';

            $(element).attr('style', 'color:' + changeColor);

            const helper = linkedInContactFactory.newLinkedInContact($(element).attr('title'));
            const candidate = candidates.find(c => c.firstName == helper.firstName && c.lastName == helper.lastName);

            if (candidate){
                linkedInCommon.callAlisonHookWindow('toggleContactSelection', {candidate, isSelected: !isRed});
            }
            else {
                console.log({msg: 'Unable to find candidate:', helper});
            }

        });
    }

    class LinkedInApp {
        sendMessageToCandidates = _sendMessageToCandidates;
        candidatesMarshallToAlisonUIRequested = _candidatesMarshallToAlisonUIRequested;
        getCandidatePublicProfile = _getCandidatePublicProfile;
        scrapeCandidateResults = _scrapeCandidateResults;
    }

    window.linkedInApp = new LinkedInApp();

})();

//All messages posted back to the Linked In tab / tamper Monkey
//should be routed to the linkedInApp object.
tsCommon.setUpPostMessageListener('linkedInApp');

window.launchTonkaSource = async () => {
    const url = 'https://tonkasourceworkflows.firebaseapp.com/linkedin/alisonHook/alisonHook.html';
    window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=900,height=800,top=5000,left=5000");

    await tsCommon.sleep(2000);
    linkedInCommon.callAlisonHookWindow('initialization');
}
