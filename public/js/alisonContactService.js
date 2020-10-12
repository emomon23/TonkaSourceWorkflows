(() => {
    const _baseUrl = tsConstants.FUNCTIONS_URL;

    const _mapContact = (lic) => {
        const result = {
            city: lic.city,
            state: lic.state,
            positions: lic.positions,
            positionsLastScraped: lic.positionsLastScraped,
            alisonConnections: lic.alisonConnections,
            educations: lic.educations,
            firstName: lic.firstName,
            lastName: lic.lastName,
            areas: lic.areas,
            linkedIn: lic.linkedIn,
            title: lic.headline,
            summary: lic.summary,
            imageUrl: lic.imageUrl,
            industry: lic.industry,
            industryGroup: lic.role,
            linkedInIsJobSeeker: lic.isJobSeeker || lic.isActivelyLooking,
            linkedInMemberId: lic.memberId,
            linkedInSkills: lic.linkedInSkills,
            messagesSent: lic.messagesSent,
            tags: lic.tags,
            opportunitiesPresented: lic.opportunitiesPresented
        };

        if (lic.referencesGiven) {
            result.referencesGiven = lic.referencesGiven;
        }

        if (lic.referencesReceived){
            result.referencesReceived = lic.referencesReceived
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

    const  _getJobSeekersToBeScrapedInABatch = async() => {
        const url = `${_baseUrl}/getLiteJobSeekersToBeScraped?howMany=10`;
        const result = await tsCommon.httpGetJson(url);
        return result;
    }

    class AlisonContactService {
        saveLinkedInContact = _saveLinkedInContact;
        getAlisonContact = _getAlisonContact;
        getJobSeekersToBeScrapedInABatch = _getJobSeekersToBeScrapedInABatch;
    }

    window.alisonContactService = new AlisonContactService();
})();