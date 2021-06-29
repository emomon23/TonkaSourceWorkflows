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

    window.companySummaryRepository.restore = async (obj) => {
        if (!(obj && obj.companyId)){
            return;
        }

        const existing = await companySummaryRepository.get(obj.companyId);
        if (!existing){
            await companySummaryRepository.insert(obj);
        }
        else {
            existing.aliases = tsCommon.mergeStringArrays(existing.aliases, obj.aliases);
            existing.skills = tsCommon.mergeStringArrays(existing.skills, obj.skills);
            existing.tsNotes = tsCommon.mergeStringArrays(existing.tsNotes, obj.tsNotes);

            await companySummaryRepository.update(existing);
        }
    }

    window.companySummaryRepository.getAll().then((companies) => {
        tsCommon.stopWatchStart('cacheCompanies');
        console.log('starting cache companies');

        window.companySummaryRepository.cachedCompanyIndex = {tsCompanyGroups:{}};
        companies.forEach((c) => {
            if (c.companyId || c.name){
                c.name = c.name && c.name.toLowerCase ? c.name.toLowerCase() : '';
                let key = c.companyId ? c.companyId : (c.name);
                window.companySummaryRepository.cachedCompanyIndex[key] = c;

                if (c.name.length) {
                    key = c.name.substr(0, 1);
                    if (!window.companySummaryRepository.cachedCompanyIndex.tsCompanyGroups[key]){
                        window.companySummaryRepository.cachedCompanyIndex.tsCompanyGroups[key] = [];
                    }

                    window.companySummaryRepository.cachedCompanyIndex.tsCompanyGroups[key].push(c);
                }
            }
        });

        const time = tsCommon.stopWatchStop('cacheCompanies') / 1000;
        console.log(`cache Companies stop. time: ${time}`);

        return;
        }).catch((e) => {
            console.log(e.message);
        });

    window.companySummaryRepository.syncGet = (idOrName) => {
        let lookFor = isNaN(idOrName) ? idOrName.toLowerCase() : Number.parseInt(idOrName);
        return companySummaryRepository.cachedCompanyIndex[lookFor];
    }

    window.companySummaryRepository.aliasSearch = (companyNameStartsWithSearch) => {
        if ((!companyNameStartsWithSearch) || companyNameStartsWithSearch.length === 0){
            return null;
        }

        const lCase = companyNameStartsWithSearch.toLowerCase();
        const key = lCase.substr(0, 1);
        const subCompanies = window.companySummaryRepository.cachedCompanyIndex.tsCompanyGroups[key];

        if (subCompanies && subCompanies.length){
                let matches = subCompanies.filter((c) => {
                    const nameMatch = c.name.startsWith(lCase);
                    if (nameMatch){
                        return true;
                    }

                    const aliasMatch = c.aliases && c.aliases.length ? c.aliases.find(a => a.startsWith(lCase)) : null;
                    return aliasMatch ? true : false;
                });

                return matches;
        }

       return [];
    }
})();