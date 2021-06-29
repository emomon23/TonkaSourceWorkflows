(() => {
    const TONKA_SOURCE_DATABASE = "TSOriginNames";
    const VERSION = 1;
    const SCHEMA = {
        storeName: 'origin',
        idProperty: 'originName',
    };

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.originRepository = _storeFactory.createStore('origin', 'memberId');

    window.originRepository.flagPersonNames = async (originName, personNames) => {
        let record = await originRepository.get(originName);
        let insert = false;

        if (!record){
            insert = true;
            record = {
                originName
            }
        }

        personNames.forEach((name) => {
            const key = name.toLowerCase();
            record[key] = true;
        });

        if (insert){
            originRepository.insert(record);
        }
        else {
            originRepository.update(record);
        }
    }

    window.originRepository.restore = async (obj) => {
        if (!(obj && obj.originName)){
            return;
        }

        let originObj = await originRepository.get(obj.originName);
        if (!originObj){
            await originRepository.insert(obj);
        }
        else {
            for (let k in obj){
                originObj[k] = true;
            }

            await originRepository.update(originObj);
        }
    }
})();