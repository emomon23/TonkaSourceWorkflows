(() => {
    const _baseUrl = tsConstants.FUNCTIONS_URL;

    const _mapContact = (lic) => {
        const result = {
            city: lic.city,
            state: lic.state,
            positions: lic.positions,
            alisonConnections: lic.alisonConnections,
            educations: lic.educations,
            firstName: lic.firstName,
            lastName: lic.lastName,
            linkedIn: lic.linkedIn,
            title: lic.headline,
            imageUrl: lic.imageUrl,
            industry: lic.industry,
            linkedInIsJobSeeker: lic.isJobSeeker,
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

        if (lic.skills || lic.linkedInSkillsList){
            result.linkedInSkillsList = lic.skills || lic.linkedInSkillsList;
        }

        return result;
    }

    const _saveLinkedInContact = async (linkedInRawContact) => {
        const contact = _mapContact(linkedInRawContact);
        const url = `${_baseUrl}/importContact`;

        try {
            $.post(url, contact);

            $("#message-container")
                .show()
                .attr("style", "background-color: green; width: 100%; height: 25px;")
                .html(`${contact.firstName} ${contact.lastName} has been saved.`);
            
                setTimeout(function() { 
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

   

    class AlisonContactService {
        saveLinkedInContact = _saveLinkedInContact;
    }

    window.alisonContactService = new AlisonContactService();
})();