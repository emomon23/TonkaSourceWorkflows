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
        window.scrapedCandidates = await searchResultsScraper.scrapeResults();
    }

    const _changeBadgeColor = (memberId, color) => {
        try {     
            const query = `#search-result-${memberId} abbr`;
            $($(query)[0]).attr('style', `color:${color}`)
        }
        catch {}
    }

    const _candidateUnselect = async(data) => {
        data = typeof data === "string"? JSON.parse(data) : data;
        const memberId = data.memberId;
        _changeBadgeColor(memberId, 'black');
        searchResultsScraper.deselectCandidate(memberId);
    }

    class LinkedInApp {
        sendMessageToCandidates = _sendMessageToCandidates;
        candidatesMarshallToAlisonUIRequested = _candidatesMarshallToAlisonUIRequested;
        getCandidatePublicProfile = _getCandidatePublicProfile;
        scrapeCandidateResults = _scrapeCandidateResults;
        candidateUnselect = _candidateUnselect;
        changeBadgeColor = _changeBadgeColor;
        user = "";
    }

    window.linkedInApp = new LinkedInApp();

})();

//All messages posted back to the Linked In tab / tamper Monkey
//should be routed to the linkedInApp object.
tsCommon.setUpPostMessageListener('linkedInApp');

tsInterceptor.interceptResponse('get', '/api/smartsearch?', searchResultsScraper.interceptSearchResults);

window.launchTonkaSource = async (who) => {
    if (who == undefined){
        console.log(`WARNING!! launchTonkaSource was called without a 'who' paramter.  I'd like to know if you are Mike or Joe!`);
    }

    const url = 'https://tonkasourceworkflows.firebaseapp.com/linkedin/alisonHook/alisonHook.html';
    window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=900,height=800,top=5000,left=5000");

    await tsCommon.sleep(2000);
    linkedInCommon.callAlisonHookWindow('initialization');

    linkedInApp.user = who;
}
