(function() {

    const _getMessageToSend = (candidate, templates) => {
        const {connectionMessage: connectionMessageTemplate, linkedInMessage:linkedInMessageTemplate} = templates;
        let message = candidate.networkConnection == '1'? linkedInMessageTemplate : connectionMessageTemplate;

        message = message.split('[firstName]').join(candidate.firstName);
        message = message.split('[lastName').join(candidate.lastName);

        return message;
    }

    const _sendMessagesToLinkedInCandidates = (data) => {
        const {memberIds} = data;

        let goToSleep = true;

        for(let i=0; i<memberIds.length; i++){
            
            if (i > 0 && goToSleep){
                tsCommon.randomSleep(12000, 27000);
            }

            goToSleep = false;
            if (searchResultsScraper.scrapedCandidates[memberIds[i]] != undefined){
                goToSleep = true;
                const candidate = searchResultsScraper.scrapedCandidates[memberIds[i]].candidate;

                const messageToSend = _getMessageToSend(candidate, data);
                console.log(`sending ${candidate.fullName}, message: ${messageToSend}`);
            }
        }
    }

    class LinkedInMessageSender {
        constructor() {}

        sendMessagesToLinkedInCandidates = _sendMessagesToLinkedInCandidates;
    }

    window.linkedInMessageSender = new LinkedInMessageSender();
})();