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
            result = result[0];
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

    const _saveConnectionRequest = async (noteSent, inputCandidate) => {
        try {
            const noteObject = await _getOrCreateNoteObject(noteSent);
            const linkedInProfileData = {
                memberId: inputCandidate.memberId || null,
                firstName: inputCandidate.firstName,
                lastName: inputCandidate.lastName,
                headline: inputCandidate.headline || null
            };

            if (!linkedInProfileData.connectionId){
                linkedInProfileData.connectionId = linkedInProfileData.memberId || `${linkedInProfileData.firstName}-${linkedInProfileData.lastName}`;
                linkedInProfileData.noteId = noteObject.noteId;
                linkedInProfileData.dateConnectionRequestSent = (new Date()).getTime();
            }

            await tsConnectionHistoryRepo.insert(linkedInProfileData);
            return {noteObject, linkedInProfileData};
        } catch (e) {
            console.log(`Error in _saveConnectionRequest. ${e.message}`);
            window.lastCrError = e;
        }
    }

    const _recordConnectionRequestAccepted = async (connection) => {
        const connectionEntry = await _findConnection(connection);
        if (connectionEntry) {
            connectionEntry.dateConnectionRequestAcceptanceRecorded = (new Date()).getTime();
            await tsConnectionHistoryRepo.update(connectionEntry);
        }

        return connectionEntry;
    }

    const _recordConnectionRequestsAccepted = async (connectionsArray) => {
        for(let i = 0; i < connectionsArray.length; i++){
            if (connectionsArray[i]){
                // eslint-disable-next-line no-await-in-loop
                await _recordConnectionRequestAccepted(connectionsArray[i]);
            }
        }
    }

    const _recordCorrespondence = async (connection) => {
        if (typeof connection === "string"){
            connection = _splitFirstAndLastNames(connection);
        }

        if (!connection){
            return null;
        }

        const connectionEntry = await _findConnection(connection);
        if (connectionEntry && !connectionEntry.dateConnectionCorresponded) {
            connectionEntry.dateConnectionCorresponded = (new Date()).getTime();
            await tsConnectionHistoryRepo.update(connectionEntry);
        }

        return connectionEntry;
    }

    const _recordCallScheduled = async (connection) => {
        if (typeof connection === "string"){
            connection = _splitFirstAndLastNames(connection);
        }

        if (!connection){
            return null;
        }

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

    const _splitFirstAndLastNames = (fullName) => {
        fullName = fullName.split('\n').join('');
        fullName = tsString.stripExcessSpacesFromString(fullName);

        const parts = fullName.split(' ');
        if (parts.length < 2){
            return null;
        }

        return {
            firstName: parts[0],
            lastName: parts[parts.length - 1]
        };
    }

    const _calculatePercent = (note, subList) => {
        const totalConnectionRequests = note.connectionsRequests.length;
        const subset = subList.length;

        if (subset === 0){
            return 0;
        }

        let result = (subset / totalConnectionRequests) * 100;
        return result.toFixed(2);
    }

    const _getConnectionRequestNoteRecipients = async () => {
        const allNotes = await tsNoteRepo.getAll();
        const allHistory = await tsConnectionHistoryRepo.getAll();

        allNotes.forEach((note) => {
            const connectionsRequests = allHistory.filter(r => r.noteId === note.noteId);
            note.connectionsRequests = connectionsRequests;

            let filter = connectionsRequests.filter(r => r.dateConnectionCorresponded && !isNaN(r.dateConnectionCorresponded) ? true : false);
            note.percentCorrespondence = _calculatePercent(note, filter);
            note.correspondenceActual = filter.length;

            filter = connectionsRequests.filter(r => r.dateConnectionRequestAcceptanceRecorded && !isNaN(r.dateConnectionRequestAcceptanceRecorded) ? true : false);
            note.percentAccepted = _calculatePercent(note, filter);
            note.acceptedActual = filter.length;

            filter = connectionsRequests.filter(r => r.tookACall ? true : false);
            note.percentWhoTookACall = _calculatePercent(note, filter);
            note.whoTookCallActual = filter.length;
        });

        return allNotes
    }

    const _displayStatsConsoleLogMessage = async () => {
        const result = [];
        const connectionBlasts = await _getConnectionRequestNoteRecipients();
        for (let i = 0; i < connectionBlasts.length; i++){
            const blast = connectionBlasts[i];
            const msgObj = {
                id: blast.noteId,
                note: blast.text,
                totalConnectionRequests: blast.connectionsRequests.length,
                percentCorrespondence: blast.percentCorrespondence,
                correspondenceActual: blast.correspondenceActual,
                acceptedActual: blast.acceptedActual,
                whoTookCallActual: blast.whoTookCallActual,
                percentAccepted: blast.percentAccepted,
                percentWhoTookACall: blast.percentWhoTookACall
            };

            result.push(msgObj);
            console.log(msgObj);

        }

        window.crReport = result;
        return result;
    }

    const _mergeMoveRecipientsToAnotherConnectionRequest = async (toNote, fromNote) => {
        if (!(toNote && toNote.noteId)){
            console.log("WTF with the note id");
            return;
        }

        try {
            for (let i = 0; i < fromNote.connectionsRequests.length; i++){
                const cr = fromNote.connectionsRequests[i];
                cr.noteId = toNote.noteId;
                // eslint-disable-next-line no-await-in-loop
                await tsConnectionHistoryRepo.update(cr);
            }

            await tsConnectionHistoryRepo.delete(fromNote.noteId);
        } catch (e) {
            console.log(e.message);
        }
    }

    const _mergeRequests = async (commaSeperatedListOfNoteIds) => {
        let mergeFromIds = commaSeperatedListOfNoteIds.split(',').map(i => i.trim());
        let mergeIntoId =  mergeFromIds[0] && !isNaN(mergeFromIds[0]) ? Number.parseInt(mergeFromIds[0]) : mergeFromIds[0];
        mergeFromIds.splice(0, 1);

        const allConnectionRequests = await _getConnectionRequestNoteRecipients();
        const into = allConnectionRequests.find(a => a.noteId === mergeIntoId);
        const from = allConnectionRequests.filter((a) => {
            return mergeFromIds.indexOf(a.noteId.toString()) >= 0;
        });

        for(let i = 0; i < from.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _mergeMoveRecipientsToAnotherConnectionRequest(into, from[i]);
        }

        return await _displayStatsConsoleLogMessage();
    }

    class ConnectionLifeCycleLogic {
        saveConnectionRequest = _saveConnectionRequest;
        recordConnectionRequestAccepted = _recordConnectionRequestAccepted;
        recordConnectionRequestsAccepted = _recordConnectionRequestsAccepted;
        recordCallScheduled = _recordCallScheduled;
        recordCorrespondence = _recordCorrespondence;
        recordEventHistoryEntry = _recordEventHistoryEntry;
        getConnectionRequestNoteRecipients = _getConnectionRequestNoteRecipients;
        displayStatsConsoleLogMessage = _displayStatsConsoleLogMessage;
        mergeRequests = _mergeRequests;
    }

    window.connectionLifeCycleLogic = new ConnectionLifeCycleLogic();
})();