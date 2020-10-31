(() => {
    const TONKA_SOURCE_DATABASE = "TonkaSourceDB3";

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB ||
    window.msIndexedDB;

    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
    window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange ||
    window.webkitIDBKeyRange || window.msIDBKeyRange

    if (!window.indexedDB) {
        tsCommon.log("Your browser doesn't support a stable version of IndexedDB.", 'ERROR');
    }

    let _db = null;

    const _createStore = (storeName, keyId) => {
        const keyOptions = {keyPath: keyId};

        if (!_db.objectStoreNames.contains(storeName)){
            _db.createObjectStore(storeName, keyOptions);
        }
    }

    const _openDb = () => {
        return new Promise((resolve, reject) => {
            if (_db){
                resolve(_db);
                return;
            }

            const request = window.indexedDB.open(TONKA_SOURCE_DATABASE, 2);

            request.onerror = (error) => { reject(error); };

            request.onupgradeneeded = (e) => {
                _db = e.target.result
                _createStore('candidate', 'memberId');
                _createStore('company', 'companyId');
                _createStore('job', 'jobId');
                _createStore('statistics', 'memberId');
            };

            request.onsuccess = function (e) {
               _db = request.result;
               resolve(_db);
            };
        });
    }

    const _getObjectStore = async (storeName) => {
        await _openDb();
        const transaction = _db.transaction([storeName], "readwrite");
        return transaction.objectStore(storeName);
    }

    const _transactionAdd = (storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = _db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            data.dateCreated = (new Date()).getTime();
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    const _transactionUpdate = (storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = _db.transaction(storeName, "readwrite");
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

    const _transactionGetObject = (storeName, key) => {
        return new Promise((resolve, reject) => {
            if (!(storeName && key)){
                resolve(null);
                return;
            }

            const transaction = _db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    const _transactionGetAll = (storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = _db.transaction(storeName, "readwrite");
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

    const _saveObject = async (objectStoreName, data, dataIdProperty='id') => {
        await _getObjectStore(objectStoreName);

        const keyValue = data[dataIdProperty];
        const existing = await _getObject(objectStoreName, keyValue);

        if (existing){
            await _updateObject(objectStoreName, data);
        }
        else {
            await _insertObject(objectStoreName, data, dataIdProperty);
        }
    }

    const _insertObject = async (objectStoreName, data, dataIdProperty='id') => {
        const store = await _getObjectStore(objectStoreName, dataIdProperty);
        if (!store){
            throw new Error(`Unable create '${objectStoreName}' data`);
        }

        return await _transactionAdd(objectStoreName, data);
    }

    const _updateObject = async (objectStoreName, data, dataIdProperty='id') => {
        const store = await _getObjectStore(objectStoreName, dataIdProperty);
        if (!store){
            throw new Error(`Unable update '${objectStoreName}' data`);
        }

        return await _transactionUpdate(objectStoreName, data);
    }

    const _getObject = async (objectStoreName, key) => {
        await _getObjectStore(objectStoreName);
        return await _transactionGetObject(objectStoreName, key);
    }

    const _getAll = async(objectStoreName) => {
        await _getObjectStore(objectStoreName);
        return await _transactionGetAll(objectStoreName);
    }

    const _deleteObject = (objectStoreName, key) => {
        return new Promise((resolve, reject) => {
            const transaction = _db.transaction(objectStoreName);
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

    const _deleteOldData = async(objectStoreName, objectKeyProperty, daysStale = 90) => {
        const minutesPerDay = 1440;
        const list = await _getAll(objectStoreName);

        for (let i=0; i<list.length; i++){
            const obj = list[i];
            if (obj[objectKeyProperty]) {
                const lastUpdated = obj.dateLastUpdated ? obj.dateLastUpdated : 1;
                const differenceInMinutes = ((new Date()).getTime() - lastUpdated / 1000) / 60;
                const differenceInDays = differenceInMinutes / minutesPerDay;

                if (differenceInDays >= daysStale) {
                    // eslint-disable-next-line no-await-in-loop
                    await _deleteObject(objectStoreName, obj[objectKeyProperty]);
                }
            }
        }
    }

    class BaseIndexDb {
        saveObject = _saveObject;
        insertObject = _insertObject;
        updateObject = _updateObject;
        getObject = _getObject;
        getAll = _getAll;
        deleteObject = _deleteObject;
        deleteOldData = _deleteOldData;
    }

    window.baseIndexDb = new BaseIndexDb();
})();