(() => {
    const _getCompaniesByNameContains = async (namePart) => {
        const companies = await companySummaryRepository.getAll();
        const lookFor = namePart.toLowerCase();
        return companies.filter(c => c.name && c.name.indexOf(lookFor) >= 0);
    }


    const TONKA_SOURCE_DATABASE = "TSCompanyData";
    const VERSION = 2;
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
            idProperty: 'key',
            indexes: ['title', 'company', 'isActiveString',]
        },
        {
            storeName: 'companyTitles',
            idProperty: 'companyId',
            indexes: []
        },
        {
            storeName: 'skillCompanies',
            idProperty: 'skill',
            indexes: []
        }
    ]

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMAS);

    window.companyJobsRepository = _storeFactory.createStore('companyJobs');
    window.companyEmploymentHistoryRepository = _storeFactory.createStore('companyEmploymentHistory')
    window.companySummaryRepository = _storeFactory.createStore('companySummary');
    window.companyTitlesRepository = _storeFactory.createStore('companyTitles');
    window.skillCompaniesRepository = _storeFactory.createStore('skillCompanies');

    window.companySummaryRepository.getCompaniesByNameContains = _getCompaniesByNameContains;
})();