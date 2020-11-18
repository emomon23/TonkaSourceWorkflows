(() => {
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

            request.onerror = (error) => { reject(error); };

            request.onupgradeneeded = (e) => {
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

    const _saveObject = async (objectStoreName, data, dataIdProperty, db) => {
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
            return await _saveObject(this.objectStore, obj, dataIdProperty, this.__dbRef);
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
            this.stores[storeName] = result;
            return result;
        }
    }

    class BaseIndexDbFactory {
        createStoreFactory = (dbName, dbVersion, schema) => {
            return new IndexDbStoreFactory(dbName, dbVersion, schema);
        }
    }

    window.baseIndexDbFactory = new BaseIndexDbFactory();
})();

// const storeFactory = baseIndexDbFactory.createStoreFactory("TonkaSource", 1, schema);
// const candidateRepository = storeFactory.createStore("candidate");
// await candidateRepository.getAll();
