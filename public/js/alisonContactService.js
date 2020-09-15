(() => {
    const _baseUrl = 'https://us-central1-alison-krause.cloudfunctions.net/';

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
            messagesSent: lic.messagesSent,
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
        const url = `${_baseUrl}importContact`;

        $.post(url, contact);
        console.log(`${contact.firstName} ${contact.lastName} has been saved.`);
    }

   

    class AlisonContactService {
        saveLinkedInContact = _saveLinkedInContact;
    }

    window.alisonContactService = new AlisonContactService();
})();