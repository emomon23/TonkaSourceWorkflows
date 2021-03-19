(() => {
    const TONKA_SOURCE_DATABASE_OLD = "TonkaSourceDB";
    const TONKA_SOURCE_DATABASE = "Candidate";
    const VERSION = 1;
    const SCHEMA = {
        storeName: 'candidate',
        idProperty: 'memberId',
        indexes: ['lastName', 'isJobSeekerString', 'headline', 'imageUrl']
    };

    const _filterProfilesOr  = (searchWords, arrayOfCandidates) => {
        const lCaseWords = searchWords.map(w => w.toLowerCase());

        const filteredList = arrayOfCandidates.filter((c) => {
            let result = false;
            for (i = 0; i < lCaseWords.length; i++){
                if (c.stringifiedProfile.indexOf(lCaseWords[i]) >= 0){
                    result = true;
                    break;
                }
            }

            return result;
        });

        filteredList.profileContainsAnd = (searchWords) => { return _filterProfilesAnd(searchWords, this)};
        filteredList.profileContainsOr = (searchWords) => { return _filterProfilesOr(searchWords, this)};
        return filteredList;
    }

    const _filterProfilesAnd  = (searchWords, arrayOfCandidates) => {
        const lCaseWords = searchWords.map(w => w.toLowerCase());

        const filteredList = arrayOfCandidates.filter((c) => {
            let result = true;
            for (i = 0; i < lCaseWords.length; i++){
                if (c.stringifiedProfile.indexOf(lCaseWords[i]) === -1){
                    result = false;
                    break;
                }
            }

            return result;
        });

        filteredList.profileContainsAnd = (searchWords) => { return _filterProfilesAnd(searchWords, this)};
        filteredList.profileContainsOr = (searchWords) => { return _filterProfilesOr(searchWords, this)};

        return filteredList;
    }

    const _calculatePositionDurationInMonths = (p) => {
        if (!p){
            throw new Error("Unable to calculate duration on a null position");
        }

        const startDate = statistician.createDateFromMonthAndYear(p.startDateMonth, p.startDateYear)
        const endDate = statistician.createDateFromMonthAndYear(p.endDateMonth, p.endDateYear);
        return statistician.calculateMonthsBetweenDates(startDate, endDate);
}

    const _calculateCandidateTechnicalYearsNow = (candidate) => {
        const technicalPositions = candidate.positions ? candidate.positions.filter(p => p.isTechnicallyRelevant && !p.isManagement) : [];

        let totalMonths = 0;

        for (let i = 0; i < technicalPositions.length; i++){
            const p = technicalPositions[i];
            totalMonths += _calculatePositionDurationInMonths(p);
        }

        candidate.technicalTotalMonths = totalMonths;

    }

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.candidateRepository = _storeFactory.createStore('candidate', 'memberId');

    window.candidateRepository.stringifyProfiles = async (sourceCandidateList = null) => {
        const list = sourceCandidateList ? sourceCandidateList : await candidateRepository.getAll();
        const liPrefix = "https://www.linkedin.com";

        for (let i = 0; i < list.length; i++) {
            const c = list[i];

            let url = c.linkedInRecruiterUrl || '';
            if (url.indexOf(liPrefix) === -1){
                c.linkedInRecruiterUrl = `${liPrefix}${c.linkedInRecruiterUrl}`;
            }

            _calculateCandidateTechnicalYearsNow(c);
            c.stringifiedProfile = `${(c.headline || '').toLowerCase()} ${(c.summary || '').toLowerCase()}`;

            if (c.positions){
                for (let p = 0; p < c.positions.length; p++){
                    const pos = c.positions[p];
                    c.stringifiedProfile += `${(p.displayText || '').toLowerCase()} ${(p.companyName || '').toLowerCase()} ${(p.description || '').toLowerCase()} `;

                    if (Array.isArray(pos.skills)){
                        c.stringifiedProfile += pos.skills.join(' ');
                    }
                }
            }
        }

        return list;
    }

    window.candidateRepository.profileContainsAnd = _filterProfilesAnd;
    window.candidateRepository.profileContainsOr = _filterProfilesOr

    const _migrateVersionOneTonkaSource = async () => {
        await tsCommon.sleep(5000);

        var migrator = baseIndexDbFactory.createMigrator({fromDbName: TONKA_SOURCE_DATABASE_OLD, fromVersion: 1, fromStoreName: 'candidate', toStore: window.candidateRepository});
        migrator.migrate();
    }

    _migrateVersionOneTonkaSource();
})();