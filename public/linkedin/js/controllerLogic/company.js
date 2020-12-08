(() => {
    const BLACK_LIST_CONFIG = 'tsCompanyLogic.blackListedCompanies';
    const WHITE_LIST_CONFIG = 'tsCompanyLogic.whiteListedCompanies';

    const _calculateAverageHighLow = (filterFunction) => {
        const subSet = filterFunction();
        let totalMonths = 0;
        let low = 100000;
        let high = 0;

        subSet.forEach((personJob) => {
            totalMonths += personJob.durationInMonths || 0;
            if (totalMonths < low){
                low = totalMonths;
            }

            if (totalMonths > high){
                high = totalMonths;
            }
        });

        if (totalMonths === 0){
            return {
                average: 0,
                high: 0,
                low: 0,
                count: subSet.length
            }
        }


        return {
            average: totalMonths / subSet.length,
            high,
            low,
            count: subSet.length
        }
    }

    const  _calculateTurnoverAverages = (companyEmploymentHistoryIndex) => {
        const result = {};
        const employmentHistoryArray = _mapEmploymentHistoryIndexToEmploymentHistoryArray(companyEmploymentHistoryIndex.employmentHistory);

        // all employees (regardless of management or technical)
        let temp = _calculateAverageHighLow(() => { return employmentHistoryArray});
        result.allEmployeeTurnover = temp;

        // technical (all managers and staff)
        temp = _calculateAverageHighLow(() => { return employmentHistoryArray.filter(eh => eh.isTechnicallyRelevant)});
        result.allTechnicalTurnover = temp;

        // non technical (all mangers and staff)
        temp = _calculateAverageHighLow(() => { return employmentHistoryArray.filter(eh => !eh.isTechnicallyRelevant)});
        result.allNonTechnicalEmployeeTurnover = temp;

        // technical management
        temp = _calculateAverageHighLow(() => { return employmentHistoryArray.filter(eh => eh.isTechnicallyRelevant && eh.isManagement)});
        result.managementTechnicalTurnover = temp;

        // non technical management
        temp = _calculateAverageHighLow(() => { return employmentHistoryArray.filter(eh => !eh.isTechnicallyRelevant && eh.isManagement)});
        result.managementNonTechnicalTurnover = temp;

        // tech staff (ie. developers)
        temp = _calculateAverageHighLow(() => { return employmentHistoryArray.filter(eh => eh.isTechnicallyRelevant && !eh.isManagement)});
        result.technicalStaffNonManagementTurnover = temp;

        // non technical staff (ie. cafe staff)
        temp = _calculateAverageHighLow(() => { return employmentHistoryArray.filter(eh => !eh.isTechnicallyRelevant && !eh.isManagement)});
        result.NonTechnicalStaffNonManagementTurnover = temp;

        return result;
    }

    const _checkIfCompanyIdentifierIsContainedInList = (companyIdentifier, companyName, configSettingListName) => {
        const companyStringSearch = typeof companyIdentifier === "string" ? companyIdentifier : companyIdentifier.toString ? companyIdentifier.toString() : '';
        const companyNumericSearch = !isNaN(companyIdentifier) ? Number.parseInt(companyIdentifier) : null;

        let list = tsConfig.get(configSettingListName);
        if (list === "*"){
            return true;
        }

        if (list){
           if (!Array.isArray(list)){
                list = list.split(',');
                tsCommon.log(`config "${configSettingListName}" is not an array, convert to array for performance gain`, 'WARN');
           }

           return list.indexOf(companyStringSearch) >= 0 || list.indexOf(companyNumericSearch) >= 0 || list.indexOf(companyName) >= 0;
        }

        return false;
    }

    const _checkIfCompanyShouldBeSaved = (scrapedCandidateCompanyAverage) => {
        const companyIdentifier = scrapedCandidateCompanyAverage.id || scrapedCandidateCompanyAverage.name;
        const companyName = scrapedCandidateCompanyAverage.name;

        const isCompanyBlackListed = _checkIfCompanyIdentifierIsContainedInList(companyIdentifier, companyName, BLACK_LIST_CONFIG);
        if (isCompanyBlackListed){
            console.log(`${companyName} (${companyIdentifier}) has been blacklisted`);
            return false;
        }

        const isCompanyInWhiteList = _checkIfCompanyIdentifierIsContainedInList(companyIdentifier, companyName, WHITE_LIST_CONFIG);
        return isCompanyInWhiteList;
    }

    const _getAllJobs = async () => {
        return await companyJobsRepository.getAll();
    }

    const _getCompanyEmploymentHistories = async (companyId) => {
        return await companyEmploymentHistoryRepository.get(companyId);
    }

    const _getCompanyJobs = async (companyId) => {
        return await companyJobsRepository.get(companyId);
    }

    const _getSummary = async (companyId) => {
        return await companySummaryRepository.get(companyId);
    }

    const _getSummaries = async () => {
        return await companySummaryRepository.getAll();
    }

    const _getTitles = async (companyId) => {
        return companyTitlesRepository.get(companyId);
    }

    const _mapEmploymentHistoryIndexToEmploymentHistoryArray = (companyEmploymentHistoryIndex) => {
        const result = [];
        const ignoreKeys = ['id', 'companyId', 'name', 'dateCreated', 'dateLastUpdated'];

        for (let k in companyEmploymentHistoryIndex){
            if (ignoreKeys.indexOf(k) === -1){
                result.push(companyEmploymentHistoryIndex[k]);
            }
        }

        return result;
    }

    const _mergeTitles = (existingTitlesIndexObject, scrapedEmploymentHistoryArray) => {

        const result = existingTitlesIndexObject || {};
        if (scrapedEmploymentHistoryArray && scrapedEmploymentHistoryArray.length) {
            scrapedEmploymentHistoryArray.forEach((eh) => {
                if (eh.lastTitle){
                    if (result[eh.lastTitle]){
                        result[eh.lastTitle] = result[eh.lastTitle] + 1;
                    }
                    else {
                        result[eh.lastTitle] = 1;
                    }
                }
            })
        }

        return result;
    }

    const _saveEmploymentHistory = async (scrapedCompanyAverage, existingEmploymentHistories) => {
        let existing = true;
        let companyEmploymentHistory = existingEmploymentHistories.find(c => c && (c.companyId || c.companyName) === scrapedCompanyAverage.id)

        if (!companyEmploymentHistory){
            companyEmploymentHistory = {
                companyId: scrapedCompanyAverage.id,
                name: scrapedCompanyAverage.name,
                employmentHistory: {}
            }

            existingEmploymentHistories.push(companyEmploymentHistory);
            existing = false;
        }

        scrapedCompanyAverage.employmentHistory.forEach((eh) => {
            const key = `${eh.memberId}_${eh.startDate}`;
            if (!companyEmploymentHistory.employmentHistory[key]){
                companyEmploymentHistory.employmentHistory[key] = eh;
            }
        });

        if (existing) {
            await companyEmploymentHistoryRepository.update(companyEmploymentHistory);
        }
        else {
            await companyEmploymentHistoryRepository.insert(companyEmploymentHistory);
        }

        return companyEmploymentHistory;
    }

    const _saveLiteCompanySummary = async (scrapedCompanyHistory, existingCompanySummariesArray, companyEmploymentHistories) => {
        let existing = true;
        let companySummary = existingCompanySummariesArray.find(c => c && (c.companyId || c.companyName) === scrapedCompanyHistory.id)

        if (!companySummary){
            companySummary = {
                companyId: scrapedCompanyHistory.id,
                name: scrapedCompanyHistory.name
            };

            existingCompanySummariesArray.push(companySummaryRepository);
            existing = false;
        }

        companySummary.averageTurnover = _calculateTurnoverAverages(companyEmploymentHistories);
        companySummary.skills = positionAnalyzer.mergeSkills(companySummary.skills, scrapedCompanyHistory.skills);

        if (existing){
            await companySummaryRepository.update(companySummary);
        }
        else {
            await companySummaryRepository.insert(companySummary);
        }

        return companySummaryRepository;
    }

    const _saveCompanyTitles = async (scrapedCompanyHistory, existingTitles) => {
        let existing = true;
        let companyTitlesDoc = existingTitles.find(c => c && (c.companyId || c.companyName) === scrapedCompanyHistory.id)
        // {companyId, name, titles:{ 'srDev': 1, 'jrDev: 2 }}

        if (!companyTitlesDoc){
            companyTitlesDoc = {
                companyId: scrapedCompanyHistory.id,
                name: scrapedCompanyHistory.name,
                titles: {}
            };

            existingTitles.push(companyTitlesDoc);
            existing = false;
        }

        companyTitlesDoc.titles = _mergeTitles(companyTitlesDoc.titles, scrapedCompanyHistory.employmentHistory);
        if (existing){
            await companyTitlesRepository.update(companyTitlesDoc);
        }
        else {
            await companyTitlesRepository.insert(companyTitlesDoc);
        }

        return companyTitlesDoc;
    }

    const _saveCompanyAnalytics = async (companyAnalytics) => {
        if (! linkedInCommon.checkIfCompanyAnalyticsIsTurnedOn()){
            return;
        }

        const listOfCompanyIds = Object.keys(companyAnalytics);
        const existingSummaries = await companySummaryRepository.getSubset(listOfCompanyIds);
        const existingEmploymentHistories = await companyEmploymentHistoryRepository.getSubset(listOfCompanyIds);
        const existingTitles = await companyTitlesRepository.getSubset(listOfCompanyIds);

        let skillsFoundAtCompanies = [];
        const companiesWithFoundSkills = [];

        for (let i = 0; i < listOfCompanyIds.length; i++){
            const scrapedCompanyAnalytics = companyAnalytics[listOfCompanyIds[i]];

            if (_checkIfCompanyShouldBeSaved(scrapedCompanyAnalytics)){
                // eslint-disable-next-line no-await-in-loop
                const employmentHistory = await _saveEmploymentHistory(scrapedCompanyAnalytics, existingEmploymentHistories);

                // eslint-disable-next-line no-await-in-loop
                await _saveLiteCompanySummary(scrapedCompanyAnalytics, existingSummaries, employmentHistory);

                // eslint-disable-next-line no-await-in-loop
                await _saveCompanyTitles(scrapedCompanyAnalytics, existingTitles);

                // For efficiencies... We're updating new objects here before we execute the saveSkillCompanies
                if (scrapedCompanyAnalytics.skills && scrapedCompanyAnalytics.skills.length > 0) {
                    companiesWithFoundSkills.push(scrapedCompanyAnalytics);
                    skillsFoundAtCompanies = positionAnalyzer.mergeSkills(skillsFoundAtCompanies, scrapedCompanyAnalytics.skills);
                }
            }
        }

        await _saveSkillCompanies(skillsFoundAtCompanies, companiesWithFoundSkills);

        console.log("SaveCompanyAnalytics - DONE");
    }

    const _saveScrapedCompanyProfile = async (scrapedProfile) => {

        console.log("saveScrapedCompanyProfile - DONE");
    }

    const _saveScrapedJobs = async (scrapedJobs) => {
        console.log("saveScrapedJobs - DONE");
    }

    const _saveSkillCompanies = async (skills, companiesWithSkills) => {
        if (! _checkIfCompanyAnalyticsIsTurnedOn()){
            return;
        }
        if (!skills || !skills.length > 0) {
            return;
        }

        const existingSkillCompaniesDocs = await skillCompaniesRepository.getSubset(skills);
        const existingSkills = Object.keys(existingSkillCompaniesDocs);
        skills.forEach(async (skill) => {
            // Get the companyIds of the companies that have the skill reported
            const companiesWithThisSkill = companiesWithSkills.filter( c => c.skills.includes(skill) );
            const companyIdsWithThisSkill = companiesWithThisSkill.map((c) => {
                return c.id
            });

            // Get the existing skillCompanies Doc
            let skillCompaniesDoc = existingSkillCompaniesDocs.find(scd => scd.skill === skill);
            if (skillCompaniesDoc) {
                // Merge the companies and update the document
                skillCompaniesDoc.companies = positionAnalyzer.mergeSkills(skillCompaniesDoc.companies, companyIdsWithThisSkill);
                await skillCompaniesRepository.update(skillCompaniesDoc);
            } else {
                // Create the new skillCompanies document and insert
                skillCompaniesDoc = {
                    "skill": skill,
                    "companies": companyIdsWithThisSkill
                };
                await skillCompaniesRepository.insert(skillCompaniesDoc);
            }
        });
        console.log("SaveSkillCompanies - COMPLETE");
    }

    const _search = async (repo, companyName) => {
        return await repo.getByIndex('name', companyName);
    }

    const _searchEmploymentHistory = async (companyName) => {
        return await _search(companyEmploymentHistoryRepository, companyName);
    }

    const _searchSkillCompanies = async (skills) => {
        if (skills.trim()) {
            const listOfSkills = skills.split(",").map((s) => s.trim());

            const skillCompaniesDocs = await skillCompaniesRepository.getSubset(listOfSkills);
            if (skillCompaniesDocs) {
                // First we need to find the companies that are contained within all the skill elements
                let matchingCompanies = []
                skillCompaniesDocs.forEach((skillCompaniesDoc) => {
                    matchingCompanies = tsArray.intersection(matchingCompanies, skillCompaniesDoc.companies);
                });

                // If we still have companies, lets go get their summary
                if (matchingCompanies.length) {
                    return await companySummaryRepository.getSubset(matchingCompanies);
                }
            }
        }
        return null;
    }

    const _searchSummary = async (companyName) => {
        return await _search(companySummaryRepository, companyName);
    }

    const _searchJobs = async (companyName) => {
        return await _search(companyJobsRepository, companyName);
    }


    // Controller Configuration

    const _isOn = (trueOrFalse = null) => {
        if (trueOrFalse !== null){
            if (trueOrFalse === true || trueOrFalse === false){
                tsConfig.set(SAVE_COMPANY_DATA_CONFIG, trueOrFalse);
            }
            else {
                console.log("Only valid values are true or false");
            }
        }

        return tsConfig.get(SAVE_COMPANY_DATA_CONFIG);
    }

    const _getWhiteList = () => {
        return tsConfig.get(WHITE_LIST_CONFIG);
    }

    const _setWhiteList = (starLitteral_OrArrayOfCompanyIdentifiers) => {
        tsConfig.set(WHITE_LIST_CONFIG, starLitteral_OrArrayOfCompanyIdentifiers);
    }

    const _getBlackList = () => {
        return tsConfig.get(BLACK_LIST_CONFIG);
    }

    const _setBlackList = (starLitteral_OrArrayOfCompanyIdentifiers) => {
        tsConfig.set(BLACK_LIST_CONFIG, starLitteral_OrArrayOfCompanyIdentifiers);
    }

    const _addToList = (currentList, companyIdOrName) => {
        if (!(companyIdOrName && companyIdOrName.length)){
            console.log("you didn't provide a companyId or name");
            return false;
        }

        if (!Array.isArray(currentList)){
            currentList = currentList.split(',').map(c => c.trim());
        }

        if (currentList.indexOf(companyIdOrName) >= 0){
            console.log(`${companyIdOrName} is already black listed`);
            return false;
        }

        currentList.push(companyIdOrName);
        return true;
    }

    const _addToBlackList = (companyIdOrName) => {
        const blackList = _getBlackList();
        if (_addToList(blackList, companyIdOrName)){
            _setBlackList(blackList);
        }

        return _getBlackList();
    }

    const _removeFromBlackList = (companyIdOrName) => {
        let blackList = _getBlackList();
        if (!Array.isArray(blackList)){
            blackList = blackList.split(',').map(c => c.trim());
        }

        let originalCount = blackList.length;
        for (let i = 0; i < blackList.length; i++) {
            if (blackList[i] === companyIdOrName){
                blackList.splice(i, 1);
                break;
            }
        }

        if (originalCount !== blackList.length){
            _setBlackList(blackList);
        }

        return _getBlackList();
    }

    class CompaniesController {
        getAllJobs = _getAllJobs;
        getCompanyJobs = _getCompanyJobs
        getCompanyEmploymentHistories = _getCompanyEmploymentHistories;
        getSummaries = _getSummaries;
        getSummary = _getSummary;
        getTitles = _getTitles;
        saveCompanyAnalytics = _saveCompanyAnalytics;
        saveScrapedCompanyProfile = _saveScrapedCompanyProfile;
        saveScrapedJobs = _saveScrapedJobs;
        searchEmploymentHistory = _searchEmploymentHistory;
        searchJobs = _searchJobs;
        searchSkillCompanies = _searchSkillCompanies;
        searchSummary = _searchSummary;
    }

    class CompaniesControllerConfiguration {
        isOn = _isOn;
        getWhiteList = _getWhiteList;
        setWhiteList = _setWhiteList;
        getBlackList = _getBlackList;
        setBlackList = _setBlackList;
        addToBlackList = _addToBlackList;
        removeFromBlackList = _removeFromBlackList;
    }

    window.companiesController = new CompaniesController();
    window.companiesControllerConfig = new CompaniesControllerConfiguration;
})();