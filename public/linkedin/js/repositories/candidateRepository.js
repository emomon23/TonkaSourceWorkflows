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

    const _checkIfJobJumper = (candidate, technicalPositions) => {
        if ((!Array.isArray(technicalPositions)) || technicalPositions.length === 0){
            return false;
        }

        if (candidate.currentPositions && candidate.currentPositions.length > 0){
            // Check if they've been on their current job for more than 19 months
            const currentPositionsLongTime = candidate.currentPositions.filter(p => p.durationInMonths > 19).length;
            if (currentPositionsLongTime === candidate.currentPositions.length){
                return false;
            }
        }

        const pastPositions = technicalPositions.filter(p => ((p.current === false) || (!p.endDateYear)));
        if (pastPositions.length < 3){
            return false;
        }

        const jobJumpCount = candidate.jobJumpCount || 0;

        return jobJumpCount >= technicalPositions.length / 2;
    }

    const _calculateCandidateTechnicalYearsNow = (candidate) => {
        const technicalPositions = candidate.positions ? candidate.positions.filter(p => p.isTechnicallyRelevant && !p.isManagement) : [];

        let totalMonths = 0;
        let jumpedJobCount = 0;

        for (let i = 0; i < technicalPositions.length; i++){
            const p = technicalPositions[i];
            const positionDuration = _calculatePositionDurationInMonths(p);
            p.durationInMonths = positionDuration;

            if (positionDuration < 14){
                jumpedJobCount += 1;
            }

            totalMonths += positionDuration;
        }

        candidate.technicalTotalMonths = totalMonths;
        candidate.jumpedJobCount = jumpedJobCount;
        candidate.isJobJumper = _checkIfJobJumper(candidate, technicalPositions);

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