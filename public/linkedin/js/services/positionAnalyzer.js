(() => {
    const _technicalTitleWords = ['developer', 'programmer', 'engineer', 'engr ', ' edi ', ' (edi) ', 'software ', 'architect', 'qa ', 'ios ', 'android ', 'sdet', 'quality assurance', 'user experience', 'ui/ux', 'ui\\ux', 'ux/ui', 'ux\\ui', 'product designer', 'azure ', ' azure', 'java', 'angular', 'react js', 'reactjs', 'vue js', 'vuejs', 'aws ']
    const _eliminationWords = ['student', 'prime digital', 'recruit', 'sales', ' hr', 'hr '];
    const _managementWords = ['manager', 'director', 'vice pres', 'vp ', ' vp', 'exec.', 'executive', 'president', 'ceo', 'founder'];
    const _ownerEliminationWords = ['product owner', 'project owner', 'team owner']
    const _ownerWords = ['owner', 'founder', 'ceo', 'president']
    const _internWords = ['intern '];

    const _roleAnalysisMatchWords = [
        {
            role: 'Dev Manager',
            titleMatchWords: ['devops manager', 'dev ops manager', 'software manager', 'development manager', 'dev manager', 'cloud manager','engineering manager', 'engineer manager', 'head of software', 'head of engin', 'head of engr', 'devops director', 'dev ops director', 'software director', 'development director', 'dev director', 'cloud director','engineering director', 'engineer director', 'director of software', 'director of dev', 'director of eng', 'director of app', 'director application']
        },
        {
            role: 'Project Manager',
            titleMatchWords: ['project manager', 'proj manager', 'product owner', 'project owner']
        },
        {
            role: 'DevOps',
            titleMatchWords: ['devops', 'dev ops']
        },
        {
            role: 'IT Admin',
            titleMatchWords: []
        },
        {
            role: 'Business Analyst',
            titleMatchWords: ['business analyst', 'ba ']
        },
        {
            role: 'QA Automation',
            titleMatchWords: ['automation', 'sdet', 'engineer in test', 'engr in test', 'engr. in test', 'selenium', 'protractor', 'jest', 'cucumber', 'maven', 'appium'],
        },
        {
            role: 'QA Manual',
            titleMatchWords: ['qa engineer', 'qa engr', 'test engineer', 'test lead', 'qa lead', 'quality lead', 'tester', 'quality assurance', 'quality engineer', 'qa analyst', 'quality analyst'],
        },
        {
            role: 'HR',
            titleMatchWords: ['hr ', ' hr', 'human resource']
        },
        {
            role: 'Corp Recruiter',
            titleMatchWords: ['talent acq']
        },
        {
            role: 'Recruiter',
            titleMatchWords: ['recruiter']
        },
        {
            role: 'Scrum Coach',
            titleMatchWords: ['scrum', 'agile']
        },
        {
            role: 'Developer',
            titleMatchWords: ['developer', 'engineer', 'engr', 'architect', 'application consultant', 'software consultant', 'data sci', 'database admin']
        },
        {
            role: 'Executive',
            titleMatchWords: ['ceo', 'founder', 'owner', 'pres.', 'president', 'vice pres', 'vp ', ' vp', 'cto ', ' cto', 'cio ', ' cio', 'cfo ', 'chief ']
        },
    ];

    const _getNumberOfMonthsSinceTecnicalSkillsLastUsed = (candidate, includeInternships) => {
        let mostRecentTechnicalPosition;

        try {
            if (includeInternships){
                mostRecentTechnicalPosition = candidate.positions.filter(p => p.isTechnicallyRelevant)[0];
            }
            else {
                mostRecentTechnicalPosition = candidate.positions.filter(p => p.isTechnicallyRelevant && p.isInternship !== true)[0];
            }
        } catch {
            mostRecentTechnicalPosition = null;
        }

        if (mostRecentTechnicalPosition){
           return statistician.calculateMonthsSinceWorkedAtPosition(mostRecentTechnicalPosition);
        }

        return null;
    }

    const _analyzeCurrentlyWorkingPositions = (candidate) => {
        if (!candidate.currentPositions){
            candidateRepository.stringifyProfile(candidate);
        }

        let currentPositions = candidate.currentPositions || [];

        if (currentPositions.length === 0){
            // They aren't currently working, get their positions within the last year
            const backYear = (new Date()).getFullYear() - 1;
            currentPositions = candidate.positions.filter(p => p.endDateYear >= backYear);
        }

        candidate.isTechnicallyRelevant = _checkIfTechnicallyRelevant({title: candidate.headline});

        if (!candidate.isTechnicallyRelevant){
            candidate.isTechnicallyRelevant = currentPositions.filter(p => _checkIfTechnicallyRelevant(p)).length > 0;
        }

        candidate.isManagement = currentPositions.filter(p => _checkIfManagement(p)).length > 0;
        candidate.isIntern = currentPositions.filter(p => _checkIfInternship(p)).length > 0;

        const titlesString = currentPositions.map(p => p.title).join('.  ');
        candidate.roleGuess = _calculateRoleForAPosition({title: titlesString});

        if (candidate.isTechnicallyRelevant && (candidate.isContractorOverride === null || candidate.isContractorOverride === undefined)){
            const ownerCompany = currentPositions.find((p) => {
                const lookIn = `${p.displayText} ${p.description || ''}`;

                // Look for a company containing their last name (eg. Mike Emo -> iEmosoft);
                const containsLastName = tsString.containsAll(lookIn, [candidate.lastName]);
                if (containsLastName){
                    return true;
                }

                // Don't count 'product owner', 'project owner', etc
                const containsEliminationWords = tsString.containsAny(lookIn, _ownerEliminationWords);
                let containsOwnerWords = false;

                if (!containsEliminationWords) {
                    containsOwnerWords = tsString.containsAny(lookIn, _ownerWords);
                }

                return (containsEliminationWords === false && containsOwnerWords);
            });

            candidate.isContractor = ownerCompany ? true : false;
        }
    }

    const _analyzeASingleCandidatesPositions = (candidate, type = 'CORE_SKILLS') => {
        if (!(candidate && candidate.positions)){
            return;
        }

        candidate.positions.forEach((p) => {
            p.isTechnicallyRelevant = _checkIfTechnicallyRelevant(p);
            p.isManagement = _checkIfManagement(p);
            p.isInternship = _checkIfInternship(p);
            p.roleGuess = _calculateRoleForAPosition(p);
            p.skills = statistician.assessPositionSkills(p, type);
        });

        _analyzeCurrentlyWorkingPositions(candidate);

        candidate.numberOfMonthsSinceTechnicalSkillsUsed = _getNumberOfMonthsSinceTecnicalSkillsLastUsed(candidate, true);
        candidate.numberOfMonthsSinceTechnicalSkillsUsedProfessionally = _getNumberOfMonthsSinceTecnicalSkillsLastUsed(candidate, false);

        // eg '18, 5, 17, 120' (the months they've spent on each technical job)
        candidate.technicalYearString = _buildCandidateTechnicalYearsString(candidate);
    }

    const _analyzeCandidatesPositions = (arrayOfCandidates, type = 'CORE_SKILLS') => {
        arrayOfCandidates.forEach((c) => {
            _analyzeCandidatePositions(c, type);
        });
    }

    const _analyzeCandidatePositions = (c, type = 'CORE_SKILLS') => {
        _analyzeASingleCandidatesPositions(c, type);

        const jobStatistics = statistician.calculateJobStatistics(c);
        c.statistics = (c.statistics) ? { ...c.statistics, jobStatistics } : { jobStatistics };

        const jobJumper = statistician.calculateJobJumperGrade(jobStatistics);
        c.grades = (c.grades) ? { ...c.grades, jobJumper } : { jobJumper };
    }

    const _checkIfJobJumper = (candidate, technicalPositions) => {
        if ((!Array.isArray(technicalPositions)) || technicalPositions.length === 0){
            return false;
        }

        const currentTechnicalPosition = technicalPositions.filter(c => c.current === true);
        if (currentTechnicalPosition && currentTechnicalPosition.length > 0){
            // Check if they've been on their current job for more than 19 months
            const currentPositionsLongTime = currentTechnicalPosition.filter(p => p.durationInMonths > 19).length;
            if (currentPositionsLongTime === currentTechnicalPosition.length){
                return false;
            }
        }

        const pastPositions = technicalPositions.filter(p => ((p.current === false) || (!p.endDateYear)));
        if (pastPositions.length < 3){
            return false;
        }

        const totalJobsJumped = candidate.jumpedJobCount || 0;
        const maxJumpsAllowed = (technicalPositions.length / 2);
        const isRatioHigh = totalJobsJumped >= maxJumpsAllowed;

        if (isRatioHigh){
            const breakHereForJobJumper = 0;
        }

        return isRatioHigh;
    }


    const _buildCandidateTechnicalYearsString = (candidate) => {
        let results = [];
        const technicalPositions = candidate.positions ? candidate.positions.filter(p => p.isTechnicallyRelevant) : [];

        let totalMonths = 0;
        let jumpedJobCount = 0;

        for (let i = 0; i < technicalPositions.length; i++){
            const p = technicalPositions[i];
            const months = _calculatePositionDurationInMonths(p);
            totalMonths += months;
            const years = Number.parseInt(months / 12);
            const monthsRemaining = months % 12;

            if (totalMonths < 14){
                jumpedJobCount += 1;
            }

            const result = (p.current === true) ? `${years}y${monthsRemaining}m c --- "${p.title}"` : `${years}y${monthsRemaining}m --- "${p.title}"`;
            results.push(result);
        }

        candidate.jumpedJobCount = jumpedJobCount;
        candidate.isJobJumper = _checkIfJobJumper(candidate, technicalPositions);

        candidate.technicalTotalMonths = totalMonths;
        return (results.length > 0) ? results.join("<br/>") : 'None';
    }

    const _calculatePositionDurationInMonths = (p) => {
            if (!p){
                throw new Error("Unable to calculate duration on a null position");
            }

            const startDate = statistician.createDateFromMonthAndYear(p.startDateMonth, p.startDateYear)
            const endDate = statistician.createDateFromMonthAndYear(p.endDateMonth, p.endDateYear);
            return statistician.calculateMonthsBetweenDates(startDate, endDate);
    }

    const _calculateRoleForAPosition = (position) => {
        let matchedRole = null;
        const positionTitle = position.title.toLowerCase();

        for(let i = 0; i < _roleAnalysisMatchWords.length; i++){
           const roleToCompareAgainst = _roleAnalysisMatchWords[i];
           let matchedWord = roleToCompareAgainst.titleMatchWords.find(w => positionTitle.indexOf(w) >= 0);

           if (matchedWord){
               matchedRole = roleToCompareAgainst.role;
               break;
           }
        }

        return matchedRole || 'OTHER';
    }

    const _checkIfInternship = (position) => {
        let searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        searchText = searchText.toLowerCase();

        const intern = _internWords.filter(w => searchText.indexOf(w) >= 0).length > 0;

        return intern ? true : false;
    }

    const _checkIfManagement = (position) => {
        let searchText =  `${position.title ? position.title : ''} ${position.description ? position.description : ''}`;
        searchText = searchText.toLowerCase();

        const management = _managementWords.filter(w => searchText.indexOf(w) >= 0).length > 0;

        return management ? true : false;
    }

    const _checkIfTechnicallyRelevant = (position) => {
        if (!position){
            return null;
        }

        let searchText =  (`${position.title ? position.title : ''} ${position.description ? position.description : ''}`);
        searchText = tsUICommon.cleanseTextOfHtml(searchText);
        searchText = searchText.toLowerCase();

        const eliminate = _eliminationWords.filter(w => searchText.indexOf(w) >= 0);

        if (eliminate.length){
            return false;
        }

        const technicalWords =  _technicalTitleWords.filter(w => searchText.indexOf(w) >= 0);
        return technicalWords.length > 0;

    }

    const _getOrCreateCompanyAnalyticsDoc = (companyAnalytics, position) => {
        if (!(position && position.companyName)){
            return null;
        }

        const companyIdentifier = position.companyId || position.companyName;
        if (companyAnalytics[companyIdentifier]){
            return companyAnalytics[companyIdentifier];
        }

        const newCompany = {
            employmentHistory: [],
            id: companyIdentifier,
            name: position.companyName,
            skills: position.skills
        };
        companyAnalytics[companyIdentifier] = newCompany;
        return newCompany;
    }

    const _createPositionSummary = (candidate, position) => {
        const {memberId} = candidate;
        const {title: lastTitle} = position;
        const startDate = statistician.createDateFromMonthAndYear(position.startDateMonth, position.startDateYear);
        const endDate = statistician.createDateFromMonthAndYear(position.endDateMonth, position.endDateYear);
        const durationInMonths = statistician.calculateMonthsBetweenDates(startDate, endDate);

        const isContract = position.title.toLowerCase().indexOf('contract') >= 0 || position.title.toLowerCase().indexOf('consultant') >= 0;
        const roleGuess = _calculateRoleForAPosition(position);
        const isTechnicallyRelevant = _checkIfTechnicallyRelevant(position);
        const isManagement = _checkIfManagement(position);
        const isInternship = _checkIfInternship(position);

        return {
            memberId,
            isTechnicallyRelevant,
            isManagement,
            isInternship,
            isContract,
            lastTitle,
            durationInMonths,
            roleGuess,
            startDate: startDate.getTime(),
            endDate: endDate.getTime()
        }
    }

    // For the purposes of calculating a companies average retention,
    // Don't let promotions or short term leave of absences
    // obscure the average time people stay at a company
    const _mergeCandidateSameCompanyPositions = (positionList) => {
        const positionsCopy = [...positionList];
        const result = [];
        const oneYearGap = 60000 * 60 * 24 * 365;

        positionsCopy.forEach((p) => {
            p.startDate = statistician.createDateFromMonthAndYear(p.startDateMonth, p.startDateYear).getTime();
            p.endDate = statistician.createDateFromMonthAndYear(p.endDateMonth, p.endDateYear).getTime();

            const maxGapDate = p.endDate + oneYearGap;
            const pIdentifier = p.companyId ? p.companyId : p.companyName;
            const mergeWithPrior = result.find((ep) => {
                const epIdentifier = ep.companyId ? ep.companyId : ep.companyName;
                return epIdentifier === pIdentifier && ep.startDate < maxGapDate
            });

            if (mergeWithPrior){
                mergeWithPrior.startDate = p.startDate;
                mergeWithPrior.startDateMonth = p.startDateMonth;
                mergeWithPrior.startDateYear = p.startDateYear;
                mergeWithPrior.skills = tsArray.union(mergeWithPrior.skills, p.skills);
            }
            else {
                result.push(p);
            }
        });

        return result;
    }

    const _processCompanyAnalytics = (candidates) => {
        const companyAnalytics = {};

        if (candidates){
            candidates.forEach((candidate) => {
                if (candidate.positions){
                    const mergedCandidatePositions = _mergeCandidateSameCompanyPositions(candidate.positions);

                    mergedCandidatePositions.forEach((p) => {
                        const companyAnalyticsDoc = _getOrCreateCompanyAnalyticsDoc(companyAnalytics, p);
                        if (companyAnalyticsDoc) {
                            if (p.endDateMonth && p.endDateYear){
                                const positionSummary = _createPositionSummary(candidate, p);
                                companyAnalyticsDoc.employmentHistory.push(positionSummary);
                            }
                        }
                    });
                }
            });
        }

        return companyAnalytics;
    }

    const _getCurrentPositions = (candidate) => {
        if (!(candidate && candidate.positions)){
            return [];
        }

        return candidate.positions.filter((p) => {
            const current = p.current === true || p.current === "true";
            const endMonthExists = p.endDateMonth >= 0 ? true : false;
            const endYearExists = p.endDateYear ? true : false;

            return current === true || (endMonthExists === false && endYearExists === false)
        });
    }
    class PositionAnalyzer {
        analyzeCandidatePositions = _analyzeCandidatePositions;
        analyzeCandidatesPositions = _analyzeCandidatesPositions;
        processCompanyAnalytics = _processCompanyAnalytics;
        getCurrentPositions = _getCurrentPositions;
        calculateTotalTechnicalYears = (c) => {
            _analyzeASingleCandidatesPositions(c);
            _buildCandidateTechnicalYearsString(c);
        }
    }

    window.positionAnalyzer = new PositionAnalyzer();
})();