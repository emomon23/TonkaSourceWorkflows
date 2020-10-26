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
    }

    const _analyzeCandidatePositions = (arrayOfCandidates) => {
        arrayOfCandidates.forEach((c) => {
            _analyzeASingleCandidatesPositions(c);
            const jobStatistics = statistician.calculateJobStatistics(c.positions);
            c.jobStatistics = jobStatistics;
            const jobJumper = statistician.calculateJobJumperGrade(jobStatistics);
            c.grades = {
                jobJumper
            };
        })
    }

    const _checkIfInternship = (position) => {
        const searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        const intern = _internWords.filter(w => searchText.indexOf(w) >= 0).length >= 0;
    
        return intern ? true : false;
    }

    const _checkIfManagement = (position) => {
        const searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        const management = _managementWords.filter(w => searchText.indexOf(w) >= 0).length >= 0;
    
        return management ? true : false;
    }

    const _checkIfTechnicallyRelevant = (position) => {
        if (!position){
            return null;
        }
      
        const searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        const eliminate = _eliminationWords.filter(w => searchText.indexOf(w) >= 0).length >= 0;
    
        if (eliminate){
            return false;
        }
    
        return  _technicalTitleWords.filter(w => searchText.indexOf(w) >= 0).length >= 0;
    }

    const _createDateFromEndDate = (p) => {
        if (!(p.endDateMonth && p.endDateYear)){
            return new Date();
        }

        let lastDay = p.endDateMonth === 2 ? 28 : 30;
        if ('3578'.indexOf(p.endDateMonth) >= 0 || p.endDateMonth === 10){
            lastDay = 31;
        }

        return new Date(`${p.startDateMonth}/${lastDay}/${p.endDateYear}`);
    }

    const _createDateFromStartDate = (p) => {
        return new Date(`${p.startDateMonth}/1/${p.startDateYear}`);
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