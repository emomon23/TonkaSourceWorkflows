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

    const _calculateCandidateTechnicalYearsNow = (candidate) => {
        if (candidate.isJobJumper === undefined || candidate.isJobJumper === null){
            positionAnalyzer.calculateTotalTechnicalYears(candidate);
        }
    }

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.candidateRepository = _storeFactory.createStore('candidate', 'memberId');

    const _stringifyProfile = (c) => {
        if (!c){
            return;
        }

        c.currentPositions = Array.isArray(c.positions) ?  c.positions.filter(p => p.current === true || (!p.endDateYear)  ) : [];
        _calculateCandidateTechnicalYearsNow(c);

        c.stringifiedProfile = `${(c.headline || '').toLowerCase()} ${(c.summary || '').toLowerCase()}`;

        if (c.positions){
            for (let p = 0; p < c.positions.length; p++){
                const pos = c.positions[p];
                c.stringifiedProfile += ` ${(pos.displayText || '').toLowerCase()} ${(pos.companyName || '').toLowerCase()} ${(pos.description || '').toLowerCase()} `;

                if (Array.isArray(pos.skills)){
                    c.stringifiedProfile += pos.skills.join(' ');
                }
            }
        }
    }

    window.candidateRepository.stringifyProfiles = async (sourceCandidateList = null) => {
        const list = sourceCandidateList ? sourceCandidateList : await candidateRepository.getAll();
        const liPrefix = "https://www.linkedin.com";

        const lastProfile = list && list.length > 0 ? list[list.length - 1] : null;
        const alreadyStringified = lastProfile && lastProfile.stringifiedProfile;

        if (alreadyStringified){
            return;
        }

        for (let i = 0; i < list.length; i++) {
            const c = list[i];

            let url = c.linkedInRecruiterUrl || '';
            if (url.indexOf(liPrefix) === -1){
                c.linkedInRecruiterUrl = `${liPrefix}${c.linkedInRecruiterUrl}`;
            }

            _stringifyProfile(c);
        }

        return;
    }

    window.candidateRepository.stringifyProfile = _stringifyProfile;
    window.candidateRepository.profileContainsAnd = _filterProfilesAnd;
    window.candidateRepository.profileContainsOr = _filterProfilesOr

    const _migrateVersionOneTonkaSource = async () => {
        await tsCommon.sleep(5000);

        var migrator = baseIndexDbFactory.createMigrator({fromDbName: TONKA_SOURCE_DATABASE_OLD, fromVersion: 1, fromStoreName: 'candidate', toStore: window.candidateRepository});
        migrator.migrate();
    }

    _migrateVersionOneTonkaSource();
})();