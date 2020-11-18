(() => {
    // tsConnectionHistoryRepo, tsNoteRepo

    const _getOrCreateNoteObject = async (noteSent) => {
        let result = await tsNoteRepo.getByIndex('text', noteSent);
        if (!(result && result.length > 0)){
            result = {
                noteId: (new Date()).getTime(),
                text: noteSent
            };

            await tsNoteRepo.insert(result);
        }else {
            result.dateLastSent = (new Date()).getTime();
            await tsNoteRepo.update(result);
        }

        return result;
    }

    const _findConnection = async (input) => {
        let result = null;
        if (input.memberId) {
            result = await tsConnectionHistoryRepo.get(input.memberId);
        }

        if (!result) {
            result = await tsConnectionHistoryRepo.getByIndex('lastName', input.lastName);
            if (result && result.length > 0){
                result = result.filter(c => c.firstName === input.firstName);
            }

            result = result.length === 1 ? result[0] : null;
        }

        if (result && !result.memberId && input.memberId){
            result.memberId = input.memberId;
            result.connectionId = input.memberId;
            await tsConnectionHistoryRepo.update(result);
        }

        return result;
    }

    const _saveConnectionRequest = async (noteSent, linkedInProfileData) => {
        const noteObject = await _getOrCreateNoteObject(noteSent);
        if (!linkedInProfileData.connectionId){
            linkedInProfileData.connectionId = linkedInProfileData.memberId || `${linkedInProfileData.firstName}-${linkedInProfileData.lastName}`;
            linkedInProfileData.noteId = noteObject.noteId;
            linkedInProfileData.dateConnectionRequestSent = (new Date()).getTime();
        }

        await tsConnectionHistoryRepo.insert(linkedInProfileData);
        return {noteObject, linkedInProfileData};
    }

    const _recordConnectionRequestAccepted = async (connection) => {
        const connectionEntry = await _findConnection(connection);
        if (connectionEntry) {
            connectionEntry.dateConnectionRequestAcceptanceRecorded = (new Date()).getTime();
            await tsConnectionHistoryRepo.update(connectionEntry);
        }

        return connectionEntry;
    }

    const _recordCallScheduled = async (connection) => {
        const connectionEntry = await _findConnection(connection);
        if (connectionEntry) {
            connectionEntry.tookACall = true;
            await tsConnectionHistoryRepo.update(connectionEntry);
            await _recordEventHistoryEntry(connection, 'Call Scheduled');
        }

        return connectionEntry;
    }

    const _recordEventHistoryEntry = async (connection, note) => {
        const connectionEntry = await _findConnection(connection);
        if (connectionEntry) {
            if (!connectionEntry.eventHistory){
                connectionEntry.eventHistory = [];
            }
            const eventHistoryEntry = {
                description: note,
                dateRecorded: (new Date()).getTime()
            }

            connectionEntry.eventHistory.push(eventHistoryEntry);
            await tsConnectionHistoryRepo.update(connectionEntry);
        }

        return connectionEntry;
    }

    const _getConnectionRequestNoteRecipients = async () => {
        const allNotes = await tsNoteRepo.getAll();
        const allHistory = await tsConnectionHistoryRepo.getAll();

        allNotes.forEach((note) => {
            const connectionsRequests = allHistory.filter(r => r.noteId === note.noteId);
            note.connectionsRequests = connectionsRequests;
        });

        return allNotes
    }

    class ConnectionLifeCycleLogic {
        saveConnectionRequest = _saveConnectionRequest;
        recordConnectionRequestAccepted = _recordConnectionRequestAccepted;
        recordCallScheduled = _recordCallScheduled;
        recordEventHistoryEntry = _recordEventHistoryEntry;
        getConnectionRequestNoteRecipients = _getConnectionRequestNoteRecipients;
    }

    window.connectionLifeCycleLogic = new connectionLifeCycleLogic();
})();