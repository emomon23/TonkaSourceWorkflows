(() => {
    const _registeredRepositories = {}

    const _registerTsRepository = (name, repositoryReference) => {
        _registeredRepositories[name] = repositoryReference;
    }

    const _getBackupOfAllIndexedDbDataString = async () => {
        const copy = JSON.parse(JSON.stringify(_registeredRepositories));

        for(let k in copy) {
            // eslint-disable-next-line no-await-in-loop
            const data = await _registeredRepositories[k].getAll();
            copy[k].rawData = data;
        }

        return JSON.stringify(copy);
    }

    const _backupAllIndexDbDataToFile = async () => {
        const jsonString = await _getBackupOfAllIndexedDbDataString();
        tsUICommon.saveFileContentLocally("tsIndexDbRepositories.json", jsonString);

        return jsonString;
    }

    const _restoreAllIndexDbDataFromFile = async () => {
        try {
            const jsonString = await tsUICommon.readFileContentLocallyAsText();
            if (jsonString){
                const restoreData = JSON.parse(jsonString);
                for (let k in restoreData){
                    const repo = _registeredRepositories[k];
                    if (repo && repo.restore){
                        const incomingData = restoreData[k].rawData;
                        for (let i = 0; i < incomingData.length; i++){
                            try {
                                // eslint-disable-next-line no-await-in-loop
                                await repo.restore(incomingData[i]);
                            }
                            catch (e) {
                                console.log(`Unable to restore record: ${e.message}`);
                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error(e.message);
        }

        console.log('restoreAllIndexDbDataFromFile DONE');
    }

    const _whoseRegistered = () => {
        return _registeredRepositories;
    }

    /*
    const _validateBackup = (rbo) => {
        if (!(rbo.dbName && rbo.versionNumber && rbo.idProperty && rbo.storeName && rbo.indexes)){
            throw new Error("_validateBackup. Invalid repositoryBackupObject")
        }
    }

    const _getRepositoryReferenceFromBackupObject = (repositoryBackupObject) => {
        _validateBackup(repositoryBackupObject);
        let toRepo = null;

        try {
            // eslint-disable-next-line no-eval
            eval(`toRepo = window.${repositoryBackupObject.storeName}Repository`);
        // eslint-disable-next-line no-empty
        } catch { }

        if (!toRepo){
            const _storeFactory = baseIndexDbFactory.createStoreFactory(repositoryBackupObject.dbName, repositoryBackupObject.versionNumber, repositoryBackupObject.schema);
            toRepo = _storeFactory.createStore(repositoryBackupObject.storeName, repositoryBackupObject.idProperty);
        }

        if (!toRepo){
            throw new Error('Unable to get or create a repo based on repositoryBackupObject')
        }

        return toRepo;
    }

    const _getBackup = async (repository) => {
        const data = await repository.getAll();

        return {
            data,
            dbName: repository.dbName,
            versionNumber: repository.versionNumber,
            idProperty: repository.idProperty,
            storeName: repository.objectStore,
            schema: repository.schema,
        }
    }

    const _saveBackupRecord = async (repository, record, idValue) => {
        const existing = await repository.get(idValue);

        if (!existing){
            await repository.insert(record);
        }
        else {
            // which record is the newest?
            const existingLastUpdated = existing.dateLastUpdated ? existing.dateLastUpdated : 0;
            const incomingLastUpdated = record.dateLastUpdated ? record.dateLastUpdated : 0;

            if (incomingLastUpdated > existingLastUpdated){
                await repository.update(record);
            }
        }
    }

    const _syncFromBackup = async (repositoryBackupObject) => {
        const toRepo = _getRepositoryReferenceFromBackupObject(repositoryBackupObject);

        if (toRepo.mergeBackup){
            await toRepo.mergeBackup(repositoryBackupObject);
            return;
        }

        const data = repositoryBackupObject.data;
        for (let i = 0; i < data.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _saveBackupRecord(toRepo, record, record[repositoryBackupObject.idProperty]);
        }
    }

    */

    class BackupRestoreAndSync {
        backupAllIndexDbDataToFile = _backupAllIndexDbDataToFile;
        restoreAllIndexDbDataFromFile = _restoreAllIndexDbDataFromFile;
        getBackupOfAllIndexedDbDataString = _getBackupOfAllIndexedDbDataString;
        registerTsRepository = _registerTsRepository;
        whoseRegistered = _whoseRegistered;
    }

    window.backupRestoreAndSync = new BackupRestoreAndSync();
})();