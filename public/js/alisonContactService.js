(() => {
    const _baseUrl = tsConstants.FUNCTIONS_URL;
    const AS_IS = 'asIs';

    const _mapContact = (lic) => {
        const renameMap = {
            city: AS_IS, 
            state: AS_IS,
            positions: AS_IS,
            scrapedBy: AS_IS,
            positionsLastScraped: AS_IS,
            alisonConnections: AS_IS,
            educators: AS_IS,
            firstName: AS_IS,
            lastName: AS_IS,
            areas: AS_IS,
            linkedIn: AS_IS,
            rawExperienceText: AS_IS,
            role: AS_IS,
            linkedInSkills: AS_IS,
            messagesSent: AS_IS,
            tags: AS_IS,
            opportunitiesPresented: AS_IS,
            referencesReceived: AS_IS,
            summary:'linkedInSummary', 
            isJobSeeker:'isLinkedInJobSeeker',
            memberId: 'linkedInMemberId', 
            headline:'title', 
            industry: 'industryGroup' 
        };

        const result = {}
        for(var k in lic){
            if (renameMap[k] && lic[k]){
                const resultKey = renameMap[k] === AS_IS? k : renameMap[k];
                result[resultKey] = lic[k];
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