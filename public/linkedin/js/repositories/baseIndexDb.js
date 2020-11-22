(() => {
    const MIGRATION_STORE_NAME = `TonkaSource_IndexDB_Migration_History`;
    const MIGRATION_DATABASE = "TonkaSource_Migrations";
    const MIGRATION_DATABASE_VERSION = 1;
    const MIGRATION_DATABASE_SCHEMA = {
        storeName: MIGRATION_STORE_NAME,
        idProperty: 'id',
        indexes: []
    }

    if (!window.indexedDB) {
        window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    }
    if (!window.indexedDB) {
        tsCommon.log("Your browser doesn't support a stable version of IndexedDB.", 'ERROR');
    }

    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
    window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange ||
    window.webkitIDBKeyRange || window.msIDBKeyRange

    if (!window.indexedDB) {
        tsCommon.log("Your browser doesn't support a stable version of IndexedDB.", 'ERROR');
    }

    const _createStore = (db, storeName, keyId, indexNamesArray) => {
        const keyOptions = {keyPath: keyId};

        indexNamesArray = indexNamesArray ? indexNamesArray : [];
        indexNamesArray.push('dateLastUpdated');
        indexNamesArray.push('dateCreated');

        if (!db.objectStoreNames.contains(storeName)){
            const store = db.createObjectStore(storeName, keyOptions);
            indexNamesArray.forEach((indexName) => {
                store.createIndex(indexName, indexName, { unique: false });
            });
        }
    }

    const _openDb = (dbName, version, schemas, existingDbValue) => {
        return new Promise((resolve, reject) => {
            if (existingDbValue){
                resolve(existingDbValue);
            }

            const request = window.indexedDB.open(dbName, version);

            request.onerror = (error) => {
                reject(error);
            };

            request.onupgradeneeded = (e) => {
                if (!schemas){
                    reject(new Error(`${dbName} version: ${version} doesn't exist and no schema has been provided to create it`))
                }
                schemas = Array.isArray(schemas) ? schemas : [schemas];

                const db = e.target.result
                for (let i = 0; i < schemas.length; i++){
                    const schema = schemas[i];
                    _createStore(db, schema.storeName, schema.idProperty, schema.indexes);
                }
            };

            request.onsuccess = function (e) {
               const db = request.result;
               resolve(db);
            };
        });
    }

    const _getObjectStore = async (db, storeName) => {
        const transaction = db.transaction([storeName], "readwrite");
        return transaction.objectStore(storeName);
    }

    const _transactionAdd = (db, storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            const now = (new Date()).getTime();

            data.dateCreated = now;
            data.dateLastUpdated = now;

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    const _transactionUpdate = (db, storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            data.dateLastUpdated = (new Date()).getTime();

            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    const _transactionGetObject = (db, storeName, key) => {
        return new Promise((resolve, reject) => {
            if (!(storeName && key)){
                resolve(null);
                return;
            }

            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            const keyParameter = !isNaN(key) ? Number.parseInt(key) : key;
            const request = store.get(keyParameter);

            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    const _transactionGetObjectsByIndex = (storeObject, indexName, searchFor) => {
        return new Promise((resolve, reject) => {
            const results = [];

            const myIndex = storeObject.index(indexName);
            const getRequest = myIndex.getAll(searchFor);

            getRequest.onsuccess = (e) => {
                resolve(getRequest.result);
            }

            getRequest.onerror = (e) => {
                reject(e);
            }
        });
    }

    const _transactionGetAll = (db, storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    const _saveObject = async (db, objectStoreName, data, dataIdProperty = 'id') => {
        await _getObjectStore(db, objectStoreName);

        const keyValue = data[dataIdProperty];
        const existing = await _getObjectById(db, objectStoreName, keyValue);

        if (existing){
            await _updateObject(db, objectStoreName, data);
        }
        else {
            await _insertObject(db, objectStoreName, data, dataIdProperty);
        }
    }

    const _insertObject = async (db, objectStoreName, data, dataIdProperty = 'id') => {
        const store = await _getObjectStore(db, objectStoreName, dataIdProperty);
        if (!store){
            throw new Error(`Unable create '${objectStoreName}' data`);
        }

        return await _transactionAdd(db, objectStoreName, data);
    }

    const _updateObject = async (db, objectStoreName, data, dataIdProperty = 'id') => {
        const store = await _getObjectStore(db, objectStoreName, dataIdProperty);

        if (!store){
            throw new Error(`Unable update '${objectStoreName}' data`);
        }

        return await _transactionUpdate(db, objectStoreName, data);
    }

    const _getObjectById = async (db, objectStoreName, key) => {
        await _getObjectStore(db, objectStoreName);
        return await _transactionGetObject(db, objectStoreName, key);
    }

    const _getObjectsByListOfKeys = (db, objectStoreName, primaryKeys) => {
        const promises = [];
        primaryKeys.forEach((pk) => {
            promises.push(_transactionGetObject(db, objectStoreName, pk));
        })

        return Promise.all(promises);
    }

    const _getObjectsByIndex = async (db, objectStoreName, indexName, searchFor) => {
        const objectStore = await _getObjectStore(db, objectStoreName);
        const results = await _transactionGetObjectsByIndex(objectStore, indexName, searchFor);
        return results;
    }

    const _getAll = async (db, objectStoreName) => {
        await _getObjectStore(db, objectStoreName);
        return await _transactionGetAll(db, objectStoreName);
    }

    const _deleteObject = (db, objectStoreName, key) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([objectStoreName], "readwrite");
            const storeRef = transaction.objectStore(objectStoreName);

            const deleteRequest = storeRef.delete(key);

            deleteRequest.onsuccess = () => {
                resolve();
            }

            deleteRequest.onerror = () => {
                reject(deleteRequest.error);
            }
        });
    }

    const _deleteOldData = async (db, objectStoreName, objectKeyProperty, daysStale = 90) => {
        const minutesPerDay = 1440;
        const list = await _getAll(db, objectStoreName);

        for (let i = 0; i < list.length; i++){
            const obj = list[i];
            if (obj[objectKeyProperty]) {
                const lastUpdated = obj.dateLastUpdated ? obj.dateLastUpdated : 1;
                const differenceInMinutes = ((new Date()).getTime() - lastUpdated / 1000) / 60;
                const differenceInDays = differenceInMinutes / minutesPerDay;

                if (differenceInDays >= daysStale) {
                    // eslint-disable-next-line no-await-in-loop
                    await _deleteObject(db, objectStoreName, obj[objectKeyProperty]);
                }
            }
        }
    }

    const _hasMigrationCompleted = async (migrationRepository, dbsData) => {
        if (!(migrationRepository && migrationRepository.getByIndex && dbsData)){
            return false;
        }

        const id = `${dbsData.fromDbName}_${dbsData.fromStoreName}_${dbsData.fromVersion}`;
        const migrationRecord = await migrationRepository.get(id);

        return migrationRecord ? true : false;

    }

    const _createMigrationRecord = async (migrationRepository, dbsData, resultMessage) => {
        if (!(migrationRepository && migrationRepository.getByIndex && dbsData)){
            return;
        }

        const id = `${dbsData.fromDbName}_${dbsData.fromStoreName}_${dbsData.fromVersion}`;
        const migrationRecord = {id,
                                migrationDate: (new Date()).getTime(),
                                resultMessage
                                };

        await migrationRepository.insert(migrationRecord);
    }

    const _migrate = async (migrationRepository, dbsData, migrateParameters) => {
        // dbsData: {fromDbName: 'Db1', fromVersion: 1, fromStoreName: 'candidate', toStore: candidateRepo}

        const tempSchema = {
            storeName: dbsData.toStore.storeName,
            idProperty: dbsData.toStore.keyPropertyForStore
        };

        const alreadyMigrated = await _hasMigrationCompleted(migrationRepository, dbsData);
        if (alreadyMigrated){
            return false;
        }

        const db1StoreFactory = new IndexDbStoreFactory(dbsData.fromDbName, dbsData.fromVersion, tempSchema);
        const fromStore = db1StoreFactory.createStore(dbsData.fromStoreName);
        const toStore = dbsData.toStore;

        let fromDocuments = [];

        try {
            fromDocuments = await fromStore.getAll();

        } catch (e){
            if (!e.message.indexOf("doesn't exist and no schema has been provided") >= 0){
                throw e;
            }
            else {
                console.log(`Unable to migrate. ${e.message}`);
                return false;
            }
        }

        let errorCount = 0;
        let lastErrorMessage = '';

        for (let i = 0; i < fromDocuments.length; i++){
            const docToSave = fromDocuments[i];

            try {
                if (migrateParameters && migrateParameters.beforeSave){
                    migrateParameters.beforeSave(docToSave);
                }

                // eslint-disable-next-line no-await-in-loop
                await toStore.insert(docToSave);

                if (migrateParameters && migrateParameters.afterSave){
                    migrateParameters.afterSave(docToSave);
                }

            }
            catch(e){
                lastErrorMessage = e.message;
                errorCount += 1;
            }
        }

        const resultMessage = `Total records read from ${dbsData.fromStoreName}: ${fromDocuments.length}.  write errors: ${errorCount} (${lastErrorMessage})`;
        await _createMigrationRecord(migrationRepository, dbsData, resultMessage);

        console.log(resultMessage);
        return errorCount > 0 && errorCount === fromDocuments.length ? false : true
    }

    class BaseIndexDbStoreReference {
        constructor (dbName, versionNumber, schema, objectStore, idProperty){
            this.dbName = dbName;
            this.versionNumber = versionNumber;
            this.schema = schema
            this.__dbRef = null;
            this.objectStore = objectStore;
            this.idProperty = idProperty;
        }

        save = async (obj) => {
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            return await _saveObject(this.__dbRef, this.objectStore, obj, this.idProperty);
        }

        insert = async (obj) => {
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            return await _insertObject(this.__dbRef, this.objectStore, obj, this.idProperty);
        }

        update = async (obj) => {
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            return await _updateObject(this.__dbRef, this.objectStore, obj, this.idProperty);
        }

        get = async (id) => {
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            return await _getObjectById(this.__dbRef, this.objectStore, id);
        }

        getByIndex = async (indexName, searchFor) => {
            let results = [];

            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            const tempResults = await _getObjectsByIndex(this.__dbRef, this.objectStore, indexName, searchFor);

            if (tempResults && tempResults.length){
                results = tempResults.filter(r => r ? true : false);
            }

            return results;
        }


        getSubset = async (primaryKeysArray) => {
            let results = [];
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            const tempResults = await _getObjectsByListOfKeys(this.__dbRef, this.objectStore, primaryKeysArray);

            if (tempResults && tempResults.length){
                results = tempResults.filter(r => r ? true : false);
            }

            return results;
        }

        getAll = async () => {
            let results = [];

            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            const tempResults = await _getAll(this.__dbRef, this.objectStore);

            if (tempResults && tempResults.length){
                results = tempResults.filter(r => r ? true : false);
            }

            return results;
        }

        delete  = async (key) => {
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            return await _deleteObject(this.__dbRef, this.objectStore, key)
        }


        deleteOldData  = async (keyProperty, daysStale) => {
            this.__dbRef = await _openDb(this.dbName, this.versionNumber, this.schema, this.__dbRef);
            return _deleteOldData(this.__dbRef, this.objectStore, keyProperty, daysStale)
        } ;
    }

    class IndexDbStoreFactory {
        constructor (dbName, dbVersion, schema) {
            this.dbName = dbName,
            this.dbVersion = dbVersion,
            this.schema = Array.isArray(schema) ? schema : [schema];
            this.stores = {};
        }

        createStore = (storeName) => {
            if (this.stores[storeName]){
                return this.store[storeName];
            }


            const schemaMatch = this.schema.find(s => s.storeName && s.storeName === storeName);
            if (!schemaMatch){
                throw new Error(`Error in IndexDbStoreFactory.createStore. No schema exists for a store named '${storeName}'`);
            }

            const keyPropertyForStore = schemaMatch.idProperty;

            const result = new BaseIndexDbStoreReference(this.dbName, this.dbVersion, this.schema, storeName, keyPropertyForStore);
            result.storeName = storeName;
            result.keyPropertyForStore = keyPropertyForStore;

            this.stores[storeName] = result;
            return result;
        }
    }

    class IndexDbMigrator {
        constructor (dbsData){
            this.dbsData = dbsData;

            const factory = new IndexDbStoreFactory(MIGRATION_DATABASE, MIGRATION_DATABASE_VERSION, MIGRATION_DATABASE_SCHEMA);
            this.migrationRepository = factory.createStore(MIGRATION_STORE_NAME);
        }

        migrate = async (migrateParameters = null) => {
            if (this.migrationInProgress){
               // return 'In progress...'
            }

            this.migrationInProgress = true;
            const result = await _migrate(this.migrationRepository, this.dbsData, migrateParameters);
            this.migrationInProgress = false;

            return result;
        }
    }

    class BaseIndexDbFactory {
        constructor () {
            this.migrators = {};
        }

        createStoreFactory = (dbName, dbVersion, schema) => {
            const dbNm = dbName === "TonkaSourceDB" ? dbName : `${dbName}__${dbVersion}`;
            return new IndexDbStoreFactory(dbNm, dbVersion, schema);
        }

        createMigrator = (dbsData) => {
            const key = `{${dbsData.fromDbName}_${dbsData.fromStoreName}+${dbsData.fromVersion}}`;

            if (this.migrators[key]){
                return this.migrators[key]
            }
            else {
                const result = new IndexDbMigrator(dbsData);
                this.migrators[key] = result;
                return result;
            }
        }
    }



    window.baseIndexDbFactory = new BaseIndexDbFactory();
})();

// Examples

// ** Repository **
// const storeFactory = baseIndexDbFactory.createStoreFactory("TonkaSource", 1, schema);
// const candidateRepository = storeFactory.createStore("candidate");
// await candidateRepository.getAll();

// ** Migration **
// var migrator = baseIndexDbFactory.createMigrator({fromDbName: 'Db1', fromVersion: 1, fromStoreName: 'candidate', toStore: candidateRepo});
// migrator.migrate()
