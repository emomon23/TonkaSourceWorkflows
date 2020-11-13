(() => {
    const TONKA_SOURCE_DATABASE = "TSCompanyData";
    const VERSION = 1;
    const SCHEMAS = [
        {
            storeName: 'companySummary',
            idProperty: 'companyId',
            indexes: ['name', 'locations', 'industry', 'companySearchSize']
        },
        {
            storeName: 'companyEmploymentHistory',
            idProperty: 'companyId',
            indexes: ['name']
        },
        {
            storeName: 'companyJobs',
            idProperty: 'companyId',
            indexes: ['name', 'isActiveString',]
        }
    ]

    const _baseIndexDb = baseIndexDbFactor.createBaseIndexDb(TONKA_SOURCE_DATABASE, VERSION, SCHEMAS);

    const _get = async (repo, id) => {
        const storeName = repo.storeName;
        return await _baseIndexDb.getObjectById(storeName, id);
    }

    const _getByIndex = async (repo, indexName, searchFor) => {
        const storeName = repo.storeName;
        return await _baseIndexDb.getObjectsByIndex(storeName, indexName, searchFor);
    }

    const _getListByIds = async (repo, listOfIds) => {
        const storeName = repo.storeName;
        return await _baseIndexDb.getObjectsByListOfKeys(storeName, listOfIds);
    }

    const _update = async (repo, obj, keyProperty = 'companyId') => {
        const storeName = repo.storeName;
        return await _baseIndexDb.updateObject(obj, storeName, keyProperty);
    }

    const _insert = async (repo, obj, keyProperty = 'companyId') => {
        const storeName = repo.storeName;
        return await _baseIndexDb.updateObject(obj, storeName, keyProperty);
    }

    const _delete = async (repo, id) => {
        const storeName = repo.storeName;
        return await _baseIndexDb.deleteObject(storeName, id);
    }

    class CompanySummaryRepository {
        constructor () {
            this.storeName = "companySummary";
        }

        get = async (id) => { return await _get(this, id)};
        getByIndex = async (indexName, searchFor) => { return await _getByIndex(this, indexName, searchFor)};
        getSubset = async (idList) => { return await _getListByIds(this, idList)};

        update = async (obj) => { return await _update(this, obj)};
        insert = async (obj) => { return await _insert(this, obj)};

        delete = async (id) => { return await _delete(this, id)};
    }

    class CompanyEmploymentHistoryRepository {
        constructor () {
            this.storeName = "companyEmploymentHistory";
        }

        get = async (id) => { return await _get(this, id)};
        getByIndex = async (indexName, searchFor) => { return await _getByIndex(this, indexName, searchFor)};
        getSubset = async (idList) => { return await _getListByIds(this, idList)};

        update = async (obj) => { return await _update(this, obj)};
        insert = async (obj) => { return await _insert(this, obj)};

        delete = async (id) => { return await _delete(this, id)};
    }

    class CompanyJobsRepository {
        constructor () {
            this.storeName = "companyJobs"
        }

        get = async (id) => { return await _get(this, id)};
        getByIndex = async (indexName, searchFor) => { return await _getByIndex(this, indexName, searchFor)};
        getSubset = async (idList) => { return await _getListByIds(this, idList)};

        update = async (obj) => { return await _update(this, obj)};
        insert = async (obj) => { return await _insert(this, obj)};

        delete = async (id) => { return await _delete(this, id)};
    }

    window.companyJobsRepository = new CompanyJobsRepository();
    window.companyEmploymentHistoryRepository = new CompanyEmploymentHistoryRepository();
    window.companySummaryRepository = new CompanySummaryRepository();
})();