(function() {

    const _navigateToPublicProfilePage = async(candidate) => {
        //navigate to recruiter profile, 
        //sleep 3 to 6 seconds
        //navigate to public profile
        //sleep 3 to 5 seconds
        //return true
        return false;
    }

    const _sendConnectionRequestToCandidate = async (candidate, connectionNote) => {
        //verify your on the public profile page
        //send message === 'pending'? yes - return false;
        //connect button available? no - return false
        //click connect button,
        //set the text and click send
        //sleep 2 to 3 minus
        //return true;
    }

    const _sendLinkedInMessageToCandidate = async (candidate, body) => {
        //verify your on the public profile page
        //Message button available? No - return false;
        //Click message button
        //set the text and click send
        //sleep 2 to 3 mins
        //return true;

    }

    const _getMessageToSend = (candidate, templates) => {
        const {connectionMessage: connectionMessageTemplate, linkedInMessage:linkedInMessageTemplate} = templates;
        let message = candidate.networkConnection == '1'? linkedInMessageTemplate : connectionMessageTemplate;

        message = message.split('[firstName]').join(candidate.firstName);
        message = message.split('[lastName').join(candidate.lastName);

        return message;
    }

    const _sendMessagesToLinkedInCandidates = async (data) => {
        const {memberIds} = data;

        let goToSleep = true;

        for(let i=0; i<memberIds.length; i++){
            
            if (i > 0 && goToSleep){
                await tsCommon.randomSleep(12000, 27000);
            }

            goToSleep = false;
            if (searchResultsScraper.scrapedCandidates[memberIds[i]] != undefined){
                goToSleep = true;
                const candidate = searchResultsScraper.scrapedCandidates[memberIds[i]].candidate;
                const messageToSend = _getMessageToSend(candidate, data);
                
                const navigateSuccess = await _navigateToPublicProfilePage(candidate);
                if (navigateSuccess){
                    let sendResult = null;

                    if (candidate.networkConnection == '1'){
                        sendResult = await _sendLinkedInMessageToCandidate(candidate, message);
                    }
                    else {
                        sendResult = await _sendConnectionRequestToCandidate(candidate, messageToSend);
                    }


                }
            }
        }
    }

    class LinkedInMessageSender {
        constructor() {}

        sendMessagesToLinkedInCandidates = _sendMessagesToLinkedInCandidates;
    }

    window.linkedInMessageSender = new LinkedInMessageSender();
})();