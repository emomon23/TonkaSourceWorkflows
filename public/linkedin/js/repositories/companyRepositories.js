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

    window.companySummaryRepository.getAll().then(d => window.companySummaryRepository.cachedCompanies = d).catch(e => {});
    window.companySummaryRepository.companyNameAndAliasTypeAheadSearch = (companyNameStartsWithSearch) => {
        let lookFor = companyNameStartsWithSearch.toLowerCase ? companyNameStartsWithSearch.toLowerCase() : companyNameStartsWithSearch;

        if (isNaN(lookFor)){
            return window.companySummaryRepository.cachedCompanies.filter((c) => {
                const name = c.name && c.name.toLowerCase ? c.name.toLowerCase() : '';
                let result = name.startsWith(lookFor);

                if (!result && c.aliases) {
                    const aliasMatch = c.aliases.filter((a) => {
                        const lowerCaseAlias = a.toLowerCase ? a.toLowerCase() : a;
                        return lowerCaseAlias.startsWith(lookFor);
                    });

                    result = aliasMatch.length > 0;
                }

                return result;
            });
        }
        else {
            lookFor = lookFor.toString();
            return window.companySummaryRepository.cachedCompanies.filter((c) => {
                const id = c.companyId.toString();
                return id.startsWith(lookFor);
            });
        }
    }
})();