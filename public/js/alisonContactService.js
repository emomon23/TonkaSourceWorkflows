(() => {
    const _baseUrl = tsConstants.FUNCTIONS_URL;

    const _mapContact = (lic) => {
        const { city, 
                state,
                positions,
                scrapedBy,
                positionsLastScraped,
                alisonConnections,
                educators,
                firstName,
                lastName,
                areas,
                linkedIn,
                rawExperienceText,
                role,
                linkedInSkills,
                messagesSent,
                tags,
                opportunitiesPresented,
                referencesReceived,
                summary: linkedInSummary,
                isJobSeeker: linkedInIsJobSeeker,
                memberId: linkedInMemberId,
                headline: title,
                industry: industryGroup,
              } = lic;

        const intermediateObject = {
            state,
            positions,
            scrapedBy,
            positionsLastScraped,
            alisonConnections,
            educators,
            firstName,
            lastName,
            areas,
            linkedIn,
            rawExperienceText,
            role,
            linkedInSkills,
            messagesSent,
            tags,
            opportunitiesPresented,
            referencesReceived,
            linkedInSummary,
            linkedInIsJobSeeker,
            linkedInMemberId,
            title,
            industryGroup,
        }
       
        let result = {}
        for(let k in intermediateObject){
            if (intermediateObject[k]){
                result[k] = intermediateObject[k];
            }
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