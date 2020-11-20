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

    const _lastNamesSearch = async (lNamesArray, input) => {
        let totalFound = [];
        for (let i = 0; i < lNamesArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            const search = await tsConnectionHistoryRepo.getByIndex('lastName', lNamesArray[i]);

            if (search && search.length > 0){
                totalFound = totalFound.concat(search);
            }
        }

        if (totalFound && totalFound.length){
            totalFound = totalFound.filter(f => f.firstName === input.firstName);
        }

        if (totalFound && totalFound.length > 1 && input.headline){
            totalFound = totalFound.filter(t => t.headline === input.headline);
        }

        return totalFound && totalFound.length === 1 ? totalFound[0] : null;
    }

    const _findConnection = async (input, filterOnDateConnectionRequestAcceptanceRecorded = false) => {
        let result = null;
        if (input.memberId) {
            let search = !isNaN(input.memberId) ? Number.parseInt(input.memberId) : input.memberId;
            result = await tsConnectionHistoryRepo.get(search);
            if (result){
                return result;
            }
        }

        if (input.imageUrl){
            result = await tsConnectionHistoryRepo.getByIndex('imageUrl', input.imageUrl);
            if (result && result.length === 1){
                return result[0];
            }
        }

        const lNames = input.lastName ? [input.lastName, input.lastName.substr(0, 1), `${input.lastName.substr(0, 1)}.`] : [];

        if (input.headline){
            result = await tsConnectionHistoryRepo.getByIndex('headline', input.headline);
            if (result && result.length > 0){
                result = result.filter(r => r.firstName === input.firstName
                                    && lNames.length === 0 || lNames.indexOf(r.lastName) >= 0);

                if (result.length > 1 && filterOnDateConnectionRequestAcceptanceRecorded){
                    result = result.filter(r => r.dateConnectionRequestAcceptanceRecorded ? false : true)
                }

                if (result.length === 1){
                    return result[0];
                }
            }
        }

        return await _lastNamesSearch(lNames, input);
    }

    const _saveConnectionRequest = async (noteSent, inputCandidate) => {
        try {
            const noteObject = await _getOrCreateNoteObject(noteSent);
            let memberId = null;
            if (inputCandidate.memberId){
                memberId = !isNaN(inputCandidate.memberId) ? Number.parseInt(inputCandidate.memberId) : inputCandidate.memberId;
            }

            const linkedInProfileData = {
                memberId,
                firstName: inputCandidate.firstName,
                lastName: inputCandidate.lastName,
                headline: inputCandidate.headline || null,
                imageUrl: inputCandidate.imageUrl
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
            return null;
        }
    }

    const _recordConnectionRequestAccepted = async (connection) => {
        const connectionEntry = await _findConnection(connection, true);
        if (connectionEntry) {
            connectionEntry.dateConnectionRequestAcceptanceRecorded = (new Date()).getTime();
            await tsConnectionHistoryRepo.update(connectionEntry);
        }

        return connectionEntry;
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
        recordCallScheduled = _recordCallScheduled;
        recordCorrespondence = _recordCorrespondence;
        recordEventHistoryEntry = _recordEventHistoryEntry;
        getConnectionRequestNoteRecipients = _getConnectionRequestNoteRecipients;
        displayStatsConsoleLogMessage = _displayStatsConsoleLogMessage;
        mergeRequests = _mergeRequests;
        findConnection = _findConnection;
    }

    window.connectionLifeCycleLogic = new ConnectionLifeCycleLogic();
})();