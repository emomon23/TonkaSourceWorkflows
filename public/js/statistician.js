(() => {
    let processedSkillStatistics = {};

    const _assessPositionSkills = (position, type) => {
        const skillsInPosition = [];
        for (let key in skillStats.skillStatsList) {
            const skill = skillStats.skillStatsList[key];

            // When we are scraping from search results, there will be 25 candidates with 5-15 jobs on average.
            // We only have titles, and we want to minimize the assessment cost to only core skills as their
            // titles are more likely to state 'Angular Developer' or 'JavaScript Engineer' over 'jQuery Developer'
            if (!skill.ignoreForAnalytics && (type === 'ALL_SKILLS' || (type === 'CORE_SKILLS' && skill.isCoreSkill))) {
                const flattenedSkillSearchPhrases = _flattenSkillSearchPhrases(skill);
                if (_doesPositionHaveSkill(flattenedSkillSearchPhrases, position)) {
                    skillsInPosition.push(key);
                }
            }
        }
        return skillsInPosition;
    }

    const _assumptionForMonthsOfUse = (jobStatistics, skillStatistics) => {
        if (skillStatistics.isInHeadline) {
            // If In Summary, candidate is identifying themselves with this skill.  Start by saying it's within their current position
            if (jobStatistics && jobStatistics.current) {
                return [Number.parseInt(jobStatistics.current / 0.083), 'ASSUMPTION - Found in Headline :: Using number of years at current job.'];
            }
            // Don't have a current position, so lets then default this skill to 12 months of use
            return [12, 'ASSUMPTION - Found in Headline :: Defaulting to 12 months of use.'];
        } else if (skillStatistics.isInSummary) {
            // If In Summary, candidate is identifying themselves with this skill.  Start by saying it's within their current position
            if (jobStatistics && jobStatistics.current) {
                return [Number.parseInt(jobStatistics.current / 0.083), 'ASSUMPTION - Found in Summary :: Using number of years at current job.'];
            }
            // Don't have a current position, so lets then default this skill to 12 months of use
            return [12, 'ASSUMPTION - Found in Summary :: No current job, defaulting to 12 months of use.'];
        } else if (skillStatistics.isInSelfAssessedSkills) {
            // Candidate has made claims they have this skill, we'll give them 12 months for this
            // Should update stats so this returns "Years of Use" that we collect, then we can just set it to that value
            return [12, 'ASSUMPTION - Found in Self-Assessed Skills :: Defaulting to 12 months of use.'];
        } else if (skillStatistics.isInLinkedInSkills) {
            // Candidate has this listed in their Linked IN skills section, maybe they've used it a ton, maybe they've read about it or have dabbled,  Let's only give them credit for 6 months.
            return [6, 'ASSUMPTION - Found in LinkedIn Skills :: Defaulting to 6 months of use.'];
        }
        return [0, 'ASSUMPTION - Could not assess.'];
    }

    const _assumptionForMonthsSinceLastUse = (jobStatistics, skillStatistics) => {
        if (skillStatistics.isInHeadline) {
            // If In Headline, candidate is identifying themselves with this skill.  Start by saying it's within 3 months, just so it's not an A grade if we want them using it right now
            return [3, 'ASSUMPTION - Found in Headline :: Defaulting to 3 months since use.'];
        } else if (skillStatistics.isInSummary) {
            // If In Summary, candidate is identifying themselves with this skill.  Start by saying it's within 3 months, just so it's not an A grade if we want them using it right now
            return [3, 'ASSUMPTION - Found in Summary :: Defaulting to 3 months since use.'];
        } else if (skillStatistics.isInSelfAssessedSkills) {
            // Candidate has made claims they have this skill, we'll say they've used it within the last 5 years
            // Should update stats so this returns "Years of Use" that we collect, then we can just set it to that value
            return [60, 'ASSUMPTION - Found in Self-Assessed Skills :: Defaulting to 60 months since use.'];
        } else if (skillStatistics.isInLinkedInSkills) {
            // Candidate has this listed in their Linked IN skills section, maybe they've used it a ton, maybe they've read about it or have dabbled,  Let's say within 5 years
            return [60, 'ASSUMPTION - Found in LinkedIn Skills :: Defaulting to 60 months since use.'];
        }
        return [9999, 'ASSUMPTION - Could not assess.'];
    }

    const _cleanContactPositions = (positions) => {
        _adjustPositionsWhenRolesChange(positions);
    }

    const _adjustPositionsWhenRolesChange = (positions) => {
        if (positions) {
            for (let k = positions.length - 1; k >= 1; k--) {
                const pos1 = positions[k - 1];
                const pos2 = positions[k];

                const p1Identifier = pos1.companyId ? pos1.companyId : pos1.companyName;
                const p2Identifier = pos2.companyId ? pos2.companyId : pos2.companyName;

                if (p1Identifier === p2Identifier) {
                    pos1.startDateMonth = pos2.startDateMonth;
                    pos1.startDateYear = pos2.startDateYear;
                    pos1.description += ' ' + pos2.description;
                    pos1.title += ' ' + pos2.title;
                    positions.splice(k, 1);
                }
            }
        }
        return true;
    }

    const _calculateMonthsSinceWorkedAtPosition = (position) => {
        if (!(position && position.startDateMonth && position.startDateYear)) {
            return Number.max;
        }

        if (!position.endDateMonth) {
            return 0; // They are currently working there
        }

        let dateString = `${position.endDateMonth}/27/${position.endDateYear}`;
        const dateWorked = new Date(dateString);
        return _calculateMonthsBetweenDates(dateWorked, new Date());
    }

    const _calculateJobJumperGrade = (contactJobStatistics) => {
        let jobJumper = {
            gpa: 0,
            grade: gradeUtil.getGrade(0)
        };

        if (contactJobStatistics) {
            if (contactJobStatistics.average) {
                // If we have an average, lets compare current to it
                jobJumper.gpa = gradeUtil.calculateGpa(contactJobStatistics.average, contactJobStatistics.current);
                jobJumper.grade = gradeUtil.getGrade(jobJumper.gpa);
            } else if (contactJobStatistics.current) {
                // We don't have an average but we have current, lets use our logic to determine if we think he's a jumper
                jobJumper = _calculateJobJumperGradeFromOnlyCurrentPosition(contactJobStatistics.current);
            }
        }
        return jobJumper;
    }

    const _calculateJobJumperGrades = (contactStatisticsList) => {
        if (contactStatisticsList && contactStatisticsList.length) {
            for (let i = contactStatisticsList.length - 1; i >= 0; i--) {
                const jobJumper = _calculateJobJumperGrade(contactStatisticsList[i].jobStatistics)
                contactStatisticsList[i].grades = (contactStatisticsList[i].grades) ? { ...contactStatisticsList[i].grades, jobJumper } : { jobJumper }
            }
        }
    }

    const _calculateJobJumperGradeFromOnlyCurrentPosition = (current) => {
        let grades = {
            gpa: 0,
            grade: 'F'
        };

        if (current && !isNaN(current)) {
            // Convert to months
            const months = Number.parseInt((current / 0.08333));

            let grade = 'F';
            switch (true) {
                case months >= 11 && months < 18:
                    // Using 11 months, as if they are "waiting for 1 year to move" we should talk to them now!
                    grade = 'A';
                    break;
                case months >= 18 && months < 24:
                    grade = 'B';
                    break;
                case months > 6 || (months >= 24 && months < 36):
                    grade = 'C';
                    break;
                case months >= 36:
                    grade = 'D';
                    break;
                default:
                    grade = 'F';
            }
            grades = {
                grade,
                gpa: gradeUtil.getGpa(grade)
            };
        }
        return grades;
    }

    const _calculateJobStatistics = (contact) => {
        if (contact && contact.positions && contact.positions.length) {
            const copyOfPositions = JSON.parse(JSON.stringify(contact.positions));
            _cleanContactPositions(copyOfPositions);
            let totalJobs = copyOfPositions.length;
            const yearsOnJobStatistics = {
                numberOfJobs: totalJobs
            };
            let totalJobYears = 0;
            let totalTechnicalJobYears = 0;

            copyOfPositions.forEach((position) => {
                let isCurrentJob = true;
                const startDate = _createDateFromMonthAndYear(position.startDateMonth, position.startDateYear);

                // If no end date, calculate from today
                let endDate = _createDateFromMonthAndYear(new Date().getMonth(), new Date().getFullYear());
                if (position.endDateYear) {
                    endDate = _createDateFromMonthAndYear(position.endDateMonth, position.endDateYear);
                    isCurrentJob = false;
                }

                const totalMonthsOnJob = _calculateMonthsBetweenDates(startDate, endDate);
                const totalYearsOnJob = Math.round(100 * totalMonthsOnJob * 0.08333) / 100;

                // Add to our total job years
                totalJobYears += totalYearsOnJob

                if (position.isTechnicallyRelevant) {
                    const totalTechMonthsOnJob = _calculateMonthsBetweenDates(startDate, endDate);
                    totalTechnicalJobYears += Math.round(100 * totalTechMonthsOnJob * 0.08333) / 100;
                }

                if (isCurrentJob) {
                    // If we have a current job, we don't want to include in average.  We only want to average the
                    // past jobs so that we can compare the current job to the candidates history of jobs
                    totalJobs--;
                    if (!yearsOnJobStatistics.current
                        || (yearsOnJobStatistics.current && totalYearsOnJob > yearsOnJobStatistics.current)) {
                        yearsOnJobStatistics.current = totalYearsOnJob;
                    }
                } else {
                    // Set max years on job
                    if (yearsOnJobStatistics.max) {
                        if (totalYearsOnJob > yearsOnJobStatistics.max) {
                            yearsOnJobStatistics.max = totalYearsOnJob;
                        }
                    } else {
                        yearsOnJobStatistics.max = totalYearsOnJob;
                    }

                    // Set min years on job
                    // Don't use current Job for min calculation
                    if (yearsOnJobStatistics.min) {
                        if (totalYearsOnJob < yearsOnJobStatistics.min) {
                            yearsOnJobStatistics.min = totalYearsOnJob;
                        }
                    } else {
                        yearsOnJobStatistics.min = totalYearsOnJob;
                    }
                }
            });

            if (totalJobYears) {
                // Set average years on job
                yearsOnJobStatistics.average = Math.round(100 * totalJobYears / totalJobs) / 100;
                yearsOnJobStatistics.yearsOfExperience = totalJobYears;
            }

            if (totalTechnicalJobYears) {
                // Set average years on job
                yearsOnJobStatistics.yearsOfTechnicalExperience = totalTechnicalJobYears;
            }
            const jobJumper = _calculateJobJumperGrade(yearsOnJobStatistics);
            contact.grades = (contact.grades) ? { ...contact.grades, jobJumper } : { jobJumper };
            return yearsOnJobStatistics;
        }

        return {};
    }

    const _calculateMonthsBetweenDates = (dateFromP, dateToP) => {
        const dateTo = new Date(dateToP);
        const dateFrom = new Date(dateFromP);

        return dateTo.getMonth() - dateFrom.getMonth() +
            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
    }

    const _calculateMonthsUsingSkill = (positionsWithSkill) => {
        if (positionsWithSkill && positionsWithSkill.length) {
            let monthsUsing = 0;

            const positionsWithSkillCopy = JSON.parse(JSON.stringify(positionsWithSkill));

            positionsWithSkillCopy.forEach((position) => {
                // Start the End Date as today, for "presently using" skills
                let endDate = _createDateFromMonthAndYear(new Date().getMonth(), new Date().getFullYear());
                if (position.endDateYear) {
                    endDate = _createDateFromMonthAndYear(position.endDateMonth, position.endDateYear);
                }
                const startDate = _createDateFromMonthAndYear(position.startDateMonth, position.startDateYear);
                monthsUsing += _calculateMonthsBetweenDates(startDate, endDate);
            });

            return monthsUsing;
        }

        return null;
    }

    const _calculateMonthsSinceLastUse = (positionsWithSkill) => {
        if (positionsWithSkill && positionsWithSkill.length) {
            // Only need to worry about the most current position with the skill
            const mostRecentPosition = positionsWithSkill[0];

            if (!mostRecentPosition.endDateYear) {
                return 0;
            }

            const currentDate = _createDateFromMonthAndYear(new Date().getMonth(), new Date().getFullYear());
            const lastEndDate = _createDateFromMonthAndYear(mostRecentPosition.endDateMonth, mostRecentPosition.endDateYear);

            const monthsSinceLastUse = _calculateMonthsBetweenDates(lastEndDate, currentDate);

            return monthsSinceLastUse;
        }

        return null;
    }

    const _calculateSkillsStatistics = (contactStatisticsList, spliceIfMinNotMet = true) => {
        if (contactStatisticsList && contactStatisticsList.length) {
            const filter = tsUICommon.getItemLocally(tsConstants.localStorageKeys.CANDIDATE_FILTERS);
            if (!filter) {
                return;
            }
            for (let i = contactStatisticsList.length - 1; i >= 0; i--) {
                const allMonthsUsingGpas = [];
                const allWithinMonthsGpas = [];
                const contactSkillsStatistics = contactStatisticsList[i].skillStatistics;
                const grades = {}

                let foundAtLeastOneMatchingSkill = false;
                for (let skill in filter.skills) {
                    const skillStatistics = contactSkillsStatistics[skill];

                    if (skillStatistics) {
                        // Contact has statistics for this skill
                        foundAtLeastOneMatchingSkill = true;
                        skillStatistics.grades = {};
                        const filterSkill = filter.skills[skill];

                        let monthsUsingHowCalculated = "Position Analysis";
                        if (!skillStatistics.monthsOfUse || isNaN(skillStatistics.monthsOfUse)) {
                            [skillStatistics.monthsOfUse, monthsUsingHowCalculated] = _assumptionForMonthsOfUse(contactStatisticsList[i].jobStatistics, skillStatistics);
                        }
                        // Set a default if missing or value is undefined
                        if (filterSkill.monthsUsing === undefined) {
                            filterSkill.monthsUsing = 0;
                        }

                        const monthsUsingGpa = gradeUtil.calculateGpa(filterSkill.monthsUsing, skillStatistics.monthsOfUse);
                        allMonthsUsingGpas.push(monthsUsingGpa);
                        skillStatistics.grades.monthsUsing = {
                            gpa: monthsUsingGpa,
                            grade: gradeUtil.getGrade(monthsUsingGpa),
                            calculatedBy: monthsUsingHowCalculated
                        }

                        let monthsSinceLastUseHowCalculated = "Position Analysis";
                        if (skillStatistics.monthsSinceLastUse === undefined || isNaN(skillStatistics.monthsSinceLastUse)) {
                            [skillStatistics.monthsSinceLastUse, monthsSinceLastUseHowCalculated] = _assumptionForMonthsSinceLastUse(contactStatisticsList[i].jobStatistics, skillStatistics);
                        }
                        // Set a default if missing or value is undefined
                        if (filterSkill.withinMonths === undefined) {
                            filterSkill.withinMonths = 0;
                        }
                        const withinMonthsGpa = gradeUtil.calculateGpa(filterSkill.withinMonths, skillStatistics.monthsSinceLastUse, true);
                        allWithinMonthsGpas.push(withinMonthsGpa);
                        skillStatistics.grades.withinMonths = {
                            gpa: withinMonthsGpa,
                            grade: gradeUtil.getGrade(withinMonthsGpa),
                            calculatedBy: monthsSinceLastUseHowCalculated
                        }
                    } else {
                        allMonthsUsingGpas.push(0);
                        allWithinMonthsGpas.push(0);
                        contactSkillsStatistics[skill] = {
                            grades: {
                                monthsUsing: {
                                    gpa: 0,
                                    grade: 'F',
                                    calculatedBy: 'Skill not found in candidate data.'
                                },
                                withinMonths: {
                                    gpa: 0,
                                    grade: 'F',
                                    calculatedBy: 'Skill not found in candidate data.'
                                }
                            }
                        };
                    }
                }

                if (!foundAtLeastOneMatchingSkill && spliceIfMinNotMet) {
                    contactStatisticsList.splice(i, 1);
                } else {
                    contactStatisticsList[i].grades = {};
                    if (allMonthsUsingGpas.length) {
                        const cumulativeMonthsUsingGpa = gradeUtil.calculateCumulativeGpa(allMonthsUsingGpas);
                        if (spliceIfMinNotMet && filter.minMonthsUsingGpa !== undefined
                            && (cumulativeMonthsUsingGpa === undefined || cumulativeMonthsUsingGpa < filter.minMonthsUsingGpa)) {
                            contactStatisticsList.splice(i, 1);
                        } else {
                            if (contactStatisticsList[i] && contactStatisticsList[i].grades) {
                                contactStatisticsList[i].grades.cumulativeMonthsUsing = {
                                    gpa: cumulativeMonthsUsingGpa,
                                    grade: gradeUtil.getGrade(cumulativeMonthsUsingGpa)
                                }
                            }
                        }
                    }
                    if (allWithinMonthsGpas.length) {
                        const cumulativeWithinMonthsGpa = gradeUtil.calculateCumulativeGpa(allWithinMonthsGpas);
                        if (spliceIfMinNotMet && filter.minWithinMonthsGpa && cumulativeWithinMonthsGpa < filter.minWithinMonthsGpa) {
                            contactStatisticsList.splice(i, 1);
                        } else {
                            if (contactStatisticsList[i] && contactStatisticsList[i].grades) {
                                contactStatisticsList[i].grades.cumulativeWithinMonths = {
                                    gpa: cumulativeWithinMonthsGpa,
                                    grade: gradeUtil.getGrade(cumulativeWithinMonthsGpa)
                                }
                            }
                        }
                    }

                }
            }
            // Leaving this in here as it's a helpful debug routine
            // for (let contactId in contactStatisticsList) {
            //     console.log({cumulativeGrades: contactStatisticsList[contactId].skillStatistics.grades});
            //     for (let skill in contactStatisticsList[contactId].skillStatistics) {
            //         console.log({skill, grades: contactStatisticsList[contactId].skillStatistics[skill].grades});
            //     }
            // };
        }
    }

    const _createDateFromMonthAndYear = (month, year) => {
        if (month && year) {
            return new Date(month + "/01/" + year);
        } else if (year) {
            return new Date("01/01/" + year);
        } else {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            return new Date(currentMonth + "/01/" + currentYear);
        }
    }

    const _doesCandidateContainAnyKeyword = (contact, searchWords) => {

        if (!Array.isArray(searchWords)){
            return false;
        }

        const keywords = searchWords.map(w => w.toLowerCase());

        let result = false;
        for (let i = 0; i < keywords.length; i++){
            const skillMatch = _findSkillStatistic(contact, keywords[i]);
            if (skillMatch){
                // Can't just be 'isInLinkedInSkills'
                const {isInHeadline, isInSelfAssessedSkills, isInSummary, isInTags, isInJobHistory} = skillMatch;
                if (isInHeadline || isInSelfAssessedSkills || isInSummary || isInTags || isInJobHistory){
                    result = true;
                    break;
                }
            }
            else {
                // Is this keyword something like 'EMR', or 'Remote Monitoring' or some that is not a 'Known skill'?
                result = _isKeywordFoundInAnySpecifiedFields(contact, ['headline', 'summary'], keywords[i]);
                if (result === false && Array.isArray(contact.positions)) {
                   for (let p = 0; p < contact.positions.length; p++){
                        const position = contact.positions[p];
                        result = result || _isKeywordFoundInAnySpecifiedFields(position, ['title', 'description', 'displayText'], keywords[i]);
                   }
                }
            }
        }

        return result;
    }

    const _doesCandidateMatchForClipboard = (contact, matchData, useSkillStatistics = false) => {
        /*
            matchData: {
                ignoreStudents: true,
                ignoreManagers: true,
                ignoreInternships: true,
                technicalRelevanceWithinMonths: 6,
                keywords: ['React Native']
            }
         */
        if (matchData) {

            if ((contact.isManagement && matchData.ignoreManagers)
                || (matchData.ignoreStudents && (contact.isIntern || contact.isStudent))) {
                    return false;
            }

            if (matchData && matchData.keywords) {
                const keywordsFound = _doesCandidateContainAnyKeyword(contact, matchData.keywords);
                if (!keywordsFound){
                    return false;
                }
            }

            if (!isNaN(matchData.technicalRelevanceWithinMonths) && matchData.technicalRelevanceWithinMonths !== null) {
                const contactTechnicalLastUsed = matchData.ignoreInternships ? contact.numberOfMonthsSinceTechnicalSkillsUsedProfessionally : contact.numberOfMonthsSinceTechnicalSkillsUsed;
                if (contactTechnicalLastUsed > matchData.technicalRelevanceWithinMonths){
                    return false;
                }
            }
        }

        if (useSkillStatistics) {
            _calculateSkillsStatistics([contact.statistics], false);
            if (contact.statistics && contact.statistics.grades && contact.statistics.grades.cumulativeMonthsUsing && contact.statistics.grades.cumulativeWithinMonths) {
                if (contact.statistics.grades.cumulativeMonthsUsing.grade === 'A' && contact.statistics.grades.cumulativeWithinMonths.grade === 'A') {
                    return true;
                }
            }
            return false;
        }

        return true;
    }

    const _doesPositionHaveSkill = (skillSearchPhrases, pos) => {
        if (skillSearchPhrases && skillSearchPhrases.length > 0) {
            if (tsString.containsAny(pos.description, skillSearchPhrases)
                || tsString.containsAny(pos.title, skillSearchPhrases)) {
                return true;
            }
        }
        return false;
    }

    const _findSkillInSelfAssessedSkills = (searchPhrases, contact) => {
        if (contact.devSkills && contact.devSkills.length) {
            for (let i = 0; i < contact.devSkills.length; i++) {
                const skill = contact.devSkills[i];
                if (tsString.containsAny(skill.skillName, searchPhrases)) {
                    return true;
                }
            }
        }
        return false;
    }

    const _findSkillStatistic = (contact, skillName) => {
        if (! (contact && contact.statistics && contact.statistics.skillStatistics)){
            return null;
        }

        let result = null;
        const lSkillName = skillName.toLowerCase();
        const keyFound = Object.keys(contact.statistics.skillStatistics).find((k) => k.toLowerCase() === lSkillName);

        return keyFound ? contact.statistics.skillStatistics[keyFound] : null;
    }

    const _flattenSkillSearchPhrases = (skillObj, contact) => {
        let flattenedSkills = [];

        // If we have childSkills, recursively call
        if (skillObj.childSkills && skillObj.childSkills.length > 0) {
            skillObj.childSkills.forEach((childSkill) => {
                const childSkillObj = skillStats.skillStatsList[childSkill];
                if (childSkillObj) {
                    flattenedSkills = flattenedSkills.concat(_flattenSkillSearchPhrases(childSkillObj, contact));
                } else {
                    if (contact) {
                        // If we're assessing a contact, we are doing a full skills assessment
                        // If there's not an associated child skill object, then we need to create one and process skills for it
                        _processSkillStats(childSkill, [childSkill], contact);
                    }
                    // Also append the childSkill so that the parent is properly searched as well
                    flattenedSkills.push(childSkill);
                }
            });
        }

        if (skillObj.searchPhrases) {
            flattenedSkills = flattenedSkills.concat(skillObj.searchPhrases);
        }

        return flattenedSkills;
    }

    const _getPositionsWithSkill = (skillSearchPhrases, positions) => {
        if (positions && positions.length) {
            return positions.filter((pos) => {
                return _doesPositionHaveSkill(skillSearchPhrases, pos);
            });
        }
        return null;
    }

    const _getProcessedSkillStatistics = () => {
        return processedSkillStatistics;
    }

    const _isKeywordFoundInAnySpecifiedFields = (obj, properties, lookFor) => {
        let result = false;

        properties.forEach((property) => {
            if (obj && obj[property]){
                const sourceValue = obj[property].toLowerCase ? obj[property].toLowerCase() : obj[property];
                const indexOf =  sourceValue.indexOf ? sourceValue.indexOf(lookFor) : -1;
                result = result || indexOf >= 0;
            }
        });

        return result;
    }

    const _processSkillStats = (skill, skillSearchPhrases, contact) => {
        // Does contact have it in their headline
        const isInHeadline = tsString.containsAny(contact.headline, skillSearchPhrases);

        // Does contact have it in their LinkedIn About/Summary?
        const isInSummary = tsString.containsAny(contact.linkedInSummary + ' ' + contact.summary, skillSearchPhrases);

        // Does contact have it in their LinkedIn Skills Section?
        const isInLinkedInSkills = (contact.linkedInSkills && contact.linkedInSkills.length)
            ? tsString.containsAny(contact.linkedInSkills.join(","), skillSearchPhrases)
            : false;

        // Does contact have it in their tags that we purposefully set?
        const isInTags = tsString.containsAny(contact.tags, skillSearchPhrases);

        // Does contact have it in their skills assessment?
        const isInSelfAssessedSkills = _findSkillInSelfAssessedSkills(skillSearchPhrases, contact);

        // Get the positions with skill
        const positionsWithSkill = _getPositionsWithSkill(skillSearchPhrases, contact.positions);
        if (positionsWithSkill && positionsWithSkill.length) {
            // Breadth: The number of different companies or roles using the same skill; makes you a potential lead.
            processedSkillStatistics[skill] = {
                breadth: positionsWithSkill.length,
                isInHeadline,
                isInLinkedInSkills,
                isInSelfAssessedSkills,
                isInSummary,
                isInTags,
                isInJobHistory : true,
                monthsOfUse: _calculateMonthsUsingSkill(positionsWithSkill),
                monthsSinceLastUse: _calculateMonthsSinceLastUse(positionsWithSkill)
            };
        } else if (isInSummary || isInLinkedInSkills || isInTags || isInSelfAssessedSkills || isInHeadline) {
            processedSkillStatistics[skill] = {
                isInHeadline,
                isInLinkedInSkills,
                isInSelfAssessedSkills,
                isInSummary,
                isInTags,
            };
        }

        return true;
    }

    const _processSkillsStatistics = (contact, type = 'CORE_SKILLS') => {
        const contactCopy = JSON.parse(JSON.stringify(contact));
        _cleanContactPositions(contactCopy.positions);
        for (let key in skillStats.skillStatsList) {
            const skill = skillStats.skillStatsList[key];
            if (type === 'CORE_SKILLS' && !skill.isCoreSkill) {
                continue;
            }
            const flattenedSkillSearchPhrases = _flattenSkillSearchPhrases(skill, contactCopy);
            _processSkillStats(key, flattenedSkillSearchPhrases, contactCopy);
        }

        return processedSkillStatistics;
    }

    const _processStatistics = (contact, type = 'CORE_SKILLS') => {
        // Reset processed statistics
        processedSkillStatistics = {}
        const result = {};

        const skillStatistics = _processSkillsStatistics(contact, type);

        result.skillStatistics = skillStatistics;
        result.skillsList = Object.keys(skillStatistics);
        result.jobStatistics = _calculateJobStatistics(contact);

        return result;
    }

    const _resetProcessedSkills = () => {
        processedSkillStatistics = {};
    };

    const _setSkillsList = (skillsList) => {
        skillStats.skillStatsList = skillsList;
    }

    class Statistician {
        assessPositionSkills = _assessPositionSkills;
        calculateJobJumperGrade = _calculateJobJumperGrade;
        calculateJobJumperGradeFromOnlyCurrentPosition = _calculateJobJumperGradeFromOnlyCurrentPosition;
        calculateJobJumperGrades = _calculateJobJumperGrades;
        calculateJobStatistics = _calculateJobStatistics;
        calculateMonthsSinceWorkedAtPosition = _calculateMonthsSinceWorkedAtPosition;
        calculateMonthsBetweenDates = _calculateMonthsBetweenDates;
        calculateMonthsSinceLastUse = _calculateMonthsSinceLastUse;
        calculateMonthsUsingSkill = _calculateMonthsUsingSkill;
        calculateSkillsStatistics = _calculateSkillsStatistics;
        cleanContactPositions = _cleanContactPositions;
        createDateFromMonthAndYear = _createDateFromMonthAndYear;
        doesCandidateMatchForClipboard = _doesCandidateMatchForClipboard;
        getPositionsWithSkill = _getPositionsWithSkill;
        getProcessedSkillStatistics = _getProcessedSkillStatistics;
        findSkillInSelfAssessedSkills = _findSkillInSelfAssessedSkills;
        processSkillStats = _processSkillStats;
        processSkillsStatistics = _processSkillsStatistics;
        processStatistics = _processStatistics;
        resetProcessedSkills = _resetProcessedSkills;
        setSkillsList = _setSkillsList;
    }

    window.statistician = new Statistician();

})();