(() => {
    const _baseUrl = tsConstants.FUNCTIONS_URL;

    const _mapContact = (lic) => {
        const mapIfPresent_Keys = ` city 
                                    state 
                                    positions 
                                    scrapedBy
                                    positionsLastScraped
                                    alisonConnections
                                    educations
                                    firstName
                                    lastName
                                    areas
                                    linkedIn
                                    headline
                                    industry
                                    rawExperienceText
                                    role
                                    memberId
                                    linkedInSkills
                                    messagesSent
                                    tags
                                    opportunitiesPresented`;

        const result = {};

        for (var k in lic){
            if (mapIfPresent_Keys.indexOf(k) >= 0){
                result[k] = lic[k];
            }
        }

        result.linkedInIsJobSeeker = lic.isJobSeeker || lic.isActivelyLooking;
        if (lic.referencesGiven) {
            result.referencesGiven = lic.referencesGiven;
        }

        if (lic.referencesReceived){
            result.referencesReceived = lic.referencesReceived
        }

        if (lic.summary){
            result.linkedInSummary = lic.summary;
        }

        return result;
    }

    const _getAlisonContact = async(searchFor) => {
        const url = `${_baseUrl}/contactsFullTextSearch?sv=` + searchFor;
        $.get(url, (contactList) => {
            if (contactList && contactList.count === 1){
                alisonHook.callBackToLinkedIn('getAlisonContactResult',  contactList.data[0]);
            }
        })
    }

    const _saveLinkedInContact = async (linkedInRawContact) => {
        const contact = _mapContact(linkedInRawContact);
        const url = `${_baseUrl}/importContact`;

        try {
            $.post(url, contact, (savedContact) => {
                alisonHook.callBackToLinkedIn('getAlisonContactResult',  savedContact);
            });

            $("#message-container")
                .show()
                .attr("style", "background-color: green; width: 100%; height: 25px;")
                .html(`${contact.firstName} ${contact.lastName} has been saved.`);
            
                setTimeout(() => { 
                    $("#message-container").hide();
                }, 4000);
        }
        catch (e) {
            console.error(e);
            $("#message-container")
                .attr("style", "background-color: red;")
                .html('Error saving LinkedIN contact.  Check the console.')
                .show();
            
        }
    }

    const  _getJobSeekersToBeScrapedInABatch = async(howMany) => {
        const p = howMany ? howMany : 5;

        const url = `${_baseUrl}/getLiteJobSeekersToBeScraped?howMany=${p}`;
        const result = await tsCommon.httpGetJson(url);
        return JSON.parse(result);
    }

    class AlisonContactService {
        saveLinkedInContact = _saveLinkedInContact;
        getAlisonContact = _getAlisonContact;
        getJobSeekersToBeScrapedInABatch = _getJobSeekersToBeScrapedInABatch;
    }

    window.alisonContactService = new AlisonContactService();
})();