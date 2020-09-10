(() => {
    const _baseUrl = 'https://us-central1-alison-krause.cloudfunctions.net/';

    const _mapContact = (lic) => {
        const result = {
            city: lic.city,
            positions: lic.positions,
            networkConnection: lic.networkConnection,
            schools: lic.educations,
            firstName: lic.firstName,
            lastName: lic.lastName,
            title: lic.headline,
            imageUrl: lic.imageUrl,
            industry: lic.industry,
            linkedInIsJobSeeker: lic.isJobSeeker,
            linkedInMemberId: lic.memberId,

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

    const _recordMessageSent = async (rawLinkedInContact, text, type='Conversation') => {
        if (!linkedInContact.messagesSent){
            linkedInContact.messagesSent = [];
        }

        linkedInContact.messagesSent.push({date: Date.now(), text, type});
        await _saveLinkedInContact(rawLinkedInContact)

    }

    const _saveLinkedInContact = async (linkedInRawContact) => {
        const contact = _mapContact(linkedInRawContact);
        const url = `${_baseUrl}importContact`;

        $.post(url, contact);
    }

    const _recordConnectionRequestSent = async (rawLinkedInContact, connectionTextSent) => {
        rawLinkedInContact.farmState = 'Connection Requested';
        await _recordMessageSent(rawLinkedInContact, connectionTextSent, 'Connection Request');
    }

    const _recordOpportunityPitch = async(rawLinkedInContact, opportunityId, textSent) => {
        if (!rawLinkedInContact.opportunitiesPresented){
            rawLinkedInContact.opportunitiesPresented = [];
        }

        rawLinkedInContact.opportunitiesPresented.push({opportunityId, textSent, date: Date.now()});
    }

    class AlisonContactService {
        saveLinkedInContact = _saveLinkedInContact;
        recordLinkedInConnectionRequest = _recordConnectionRequestSent;
        recordLinkedInMessageSent = _recordMessageSent
        recordOpportunityPitch = _recordOpportunityPitch;
    }

    window.alisonContactService = new AlisonContactService();
})();