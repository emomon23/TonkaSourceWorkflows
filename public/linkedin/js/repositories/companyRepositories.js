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
        },
        {
            storeName: 'companyTitles',
            idProperty: 'companyId',
            indexes: []
        }
    ]

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMAS);

    window.companyJobsRepository = _storeFactory.createStore('companyJobs');
    window.companyEmploymentHistoryRepository = _storeFactory.createStore('companyEmploymentHistory')
    window.companySummaryRepository = _storeFactory.createStore('companySummary');
    window.companyTitlesRepository = _storeFactory.createStore('companyTitles');
})();