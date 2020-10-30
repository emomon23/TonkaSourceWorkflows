(() => {
    const _technicalTitleWords = ['developer', 'programmer', 'engineer', 'engr ', ' edi ', ' (edi) ', 'software ', 'architect', 'qa ', 'ios ', 'android ']
    const _eliminationWords = ['student', 'prime digital', 'recruit', 'sales'];
    const _managementWords = ['manager', 'director', 'vice pres', 'vp ', ' vp', 'exec.', 'executive', 'president', 'ceo', 'founder'];
    const _internWords = ['intern '];

    const _analyzeASingleCandidatesPositions = (candidate) => {
        if (!(candidate && candidate.positions)){
            return;
        }

        candidate.positions.forEach((p) => {
            p.isTechnicallyRelevant = _checkIfTechnicallyRelevant(p);
            p.isManagement = _checkIfManagement(p);
            p.isInternship = _checkIfInternship(p);
        });

        //eg '18, 5, 17, 120' (the months they've spent on each technical job)
        candidate.technicalYearString = _buildCandidateTechnicalYearsString(candidate);
    }

    const _analyzeCandidatePositions = (arrayOfCandidates) => {
        arrayOfCandidates.forEach((c) => {
            _analyzeASingleCandidatesPositions(c);

            const jobStatistics = statistician.calculateJobStatistics(c);
            c.statistics = (c.statistics) ? { ...c.statistics, jobStatistics } : { jobStatistics };

            const jobJumper = statistician.calculateJobJumperGrade(jobStatistics);
            c.grades = (c.grades) ? { ...c.grades, jobJumper } : { jobJumper };
        })
    }

    const _buildCandidateTechnicalYearsString = (candidate) => {
        let results = [];
        const technicalPositions = candidate.positions ? candidate.positions.filter(p => p.isTechnicallyRelevant) : [];

        for(let i=0; i < technicalPositions.length; i++){
            const p = technicalPositions[i];
            const startDate = statistician.createDateFromMonthAndYear(p.startDateMonth, p.startDateYear)
            const endDate = statistician.createDateFromMonthAndYear(p.endDateMonth, p.endDateYear);
            const months = statistician.calculateMonthsBetweenDates(startDate, endDate);
            const years = Number.parseInt(months / 12);
            const monthsRemaining = months % 12;

            const result = (p.current === true) ? `${years}y${monthsRemaining}m c --- "${p.title}"` : `${years}y${monthsRemaining}m --- "${p.title}"`;
            results.push(result);
        }

        return (results.length > 0) ? results.join("<br/>") : 'None';
    }

    const _checkIfInternship = (position) => {
        const searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        const intern = _internWords.filter(w => searchText.indexOf(w) >= 0).length > 0;

        return intern ? true : false;
    }

    const _checkIfManagement = (position) => {
        const searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        const management = _managementWords.filter(w => searchText.indexOf(w) >= 0).length > 0;

        return management ? true : false;
    }

    const _checkIfTechnicallyRelevant = (position) => {
        if (!position){
            return null;
        }

        const searchText =  (`${position.title ? position.title : ''} ${position.description ? position.description : ''}`).toLowerCase();
        const eliminate = _eliminationWords.filter(w => searchText.indexOf(w) >= 0);

        if (eliminate.length){
            return false;
        }

        const technicalWords =  _technicalTitleWords.filter(w => searchText.indexOf(w) >= 0);
        return technicalWords.length;

    }

    const _getOrCreateCompanyAverageDoc = (companyAverages, position) => {
        if (!(position && position.companyName && position.companyId)){
            return null;
        }

        const key = `${position.companyName.toLowerCase()}_${position.companyId}`;
        if (companyAverages[key]){
            return companyAverages[key];
        }

        const newCompany = {mgmt:{}};
        companyAverages[key] = newCompany;
        return newCompany;
    }

    const _createCompanyAverageDurationObject = (postAnalysisCandidatesArray) => {
        const companyAverages = {};

        if (postAnalysisCandidatesArray){
            postAnalysisCandidatesArray.forEach((candidate) => {
                if (candidate.positions){
                    candidate.positions.forEach((p) => {
                        const companyDoc = _getOrCreateCompanyAverageDoc(companyAverages, p);
                        if (companyDoc && p.current === false) {
                            let appendTo = p.isManagement ? companyDoc.mgmt : companyDoc;
                            appendTo[candidate] = p.durationYears;
                        }
                    });
                }
            });
        }

        return companyAverages;
    }

    class PositionAnalyzer {
        analyzeCandidatePositions = _analyzeCandidatePositions;
        createCompanyAverageDurationObject = _createCompanyAverageDurationObject;
    }

    window.positionAnalyzer = new PositionAnalyzer();
})();