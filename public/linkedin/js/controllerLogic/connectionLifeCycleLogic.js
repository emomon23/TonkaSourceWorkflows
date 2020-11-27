(() => {

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

    const _getOrFindTheMemberIdFromInput = async (input) => {
        if (!(input.memberId || (input.firstName && input.lastName))){
            throw new error('ERROR - Unable to record correspondence.  connection is not an object or missing identifiers');
        }

        if (!isNaN(input)){
            return input;
        }

        let memberId = input.memberId ? input.memberId : null;

        if (!memberId){
            const candidateRecord = await candidateController.searchForCandidate(input);
            memberId = candidateRecord ? candidateRecord.memberId : null;
        }

        return memberId;
    }

    const _findConnectionRequest = async (input) => {
        const memberId = await _getOrFindTheMemberIdFromInput(input);

        if (!memberId){
            return null;
        }

        return await tsConnectionHistoryRepo.get(memberId);
    }

    const _getFirstAndLastNameFromInput = async (input, memberId) => {
        if (input.lastName){
            return input;
        }

        const candidate = await candidateController.getCandidate(memberId);
        return candidate;
    }

    const _saveConnectionRequest = async (noteSent, inputCandidate) => {
        try {
            const memberId = await _getOrFindTheMemberIdFromInput(inputCandidate);
            const candidateRecord = await _getFirstAndLastNameFromInput(inputCandidate, memberId);

            if (!memberId){
                return null;
            }

            const noteObject = await _getOrCreateNoteObject(noteSent);
            const linkedInProfileData = {
                lastName: candidateRecord.lastName,
                firstName: candidateRecord.firstName,
                memberId,
                noteId: noteObject.noteId,
                dateConnectionRequestSent: (new Date()).getTime()
            }

            await tsConnectionHistoryRepo.insert(linkedInProfileData);

            let history = {
                candidate: candidateRecord,
                text: note,
                type: 'CR',
                recordCorrespondence: true
            }
            await _recordCorrespondence(history);

            return {noteObject, linkedInProfileData};

        } catch (e) {
            console.log(`Error in _saveConnectionRequest. ${e.message}`);
            window.lastCrError = e;
            return null;
        }
    }

    const _recordConnectionRequestAccepted = async (connection) => {
        const connectionEntry = await _findConnectionRequest(connection);
        if (connectionEntry) {
            connectionEntry.dateConnectionRequestAcceptanceRecorded = (new Date()).getTime();
            await tsConnectionHistoryRepo.update(connectionEntry);
        }

        return connectionEntry;
    }

    const _recordCorrespondenceOnConnectionRequestRecord = async (candidate) => {
        try {
            const connectionEntry = await _findConnectionRequest(candidate);

            if (connectionEntry && !connectionEntry.dateConnectionCorresponded) {
                connectionEntry.dateConnectionCorresponded = (new Date()).getTime();
                await tsConnectionHistoryRepo.update(connectionEntry);
            }

            return connectionEntry;
        } catch (e){
            tsCommon.logError(e, '_recordCorrespondenceOnConnectionRequestRecord');
            return null;
        }
    }

    const _recordCorrespondence = async (correspondenceObject, isConnectionRequest = false) => {
        const candidate = await candidateController.searchForCandidate(correspondenceObject.candidate);
        if (!(candidate && candidate.memberId)){
            tsCommon.log("Unable to find candidate to record correspondence!", 'ERROR');
            return;
        }

        if (!isConnectionRequest){
            await _recordCorrespondenceOnConnectionRequestRecord(candidate);
        }

        if (correspondenceObject.recordCorrespondence !== false){
            let update = true;
            let snippet = correspondenceObject.text ? correspondenceObject.text : '';
            snippet = snippet.length > 50 ? snippet.substr(0, 50) : snippet;

            let correspondence = await tsCorrespondenceHistoryRepo.get(candidate.memberId);
            if (!correspondence){
                update = false;
                correspondence = {
                    memberId: candidate.memberId,
                    lastName: candidate.lastName,
                    firstName: candidate.firstName,
                    history: []
                }
            }

            correspondence.lastMessageSentDate = (new Date()).getTime();
            correspondence.lastMessageType = correspondenceObject.type;

            if (correspondenceObject.subject){
                correspondence.lastMessageSubject = correspondenceObject.subject;
            }

            if (snippet && snippet.length > 0){
                correspondence.lastMessageSnippet = snippet;
            }

            correspondence.history.push({date: correspondence.lastMessageSentDate, type: correspondence.lastMessageType});

            if (update){
                await tsCorrespondenceHistoryRepo.update(correspondence);
            }
            else {
                await tsCorrespondenceHistoryRepo.insert(correspondence);
            }
        }
    }

    const _recordCallScheduled = async (connection) => {
        if (typeof connection === "string"){
            connection = _splitFirstAndLastNames(connection);
        }

        if (!connection){
            return null;
        }

        const connectionEntry = await _findConnectionRequest(connection);
        if (connectionEntry) {
            connectionEntry.tookACall = true;
            await tsConnectionHistoryRepo.update(connectionEntry);
            await _recordEventHistoryEntry(connection, 'Call Scheduled');
        }

        return connectionEntry;
    }

    const _recordEventHistoryEntry = async (connection, note) => {
        const connectionEntry = await _findConnectionRequest(connection);
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
        findConnection = _findConnectionRequest;
    }

    window.connectionLifeCycleLogic = new ConnectionLifeCycleLogic();
})();

