(() => {
    const url = `${tsConstants.FUNCTIONS_URL}/fs?page=js/statisticianLogic.js`;
    let processedSkillStatistics = {};

    const _adjustForOverlappingPositions = (positions) => {
        for (let k in positions) {
            const pos1 = positions[k];
            for (let l in positions) {
                const pos2 = positions[l];
                if (pos1 !== pos2) {
                    const pos1StartDate = _createDateFromMonthAndYear(pos1.startDateMonth, pos1.startDateYear);
                    const pos1EndDate = _createDateFromMonthAndYear(pos1.endDateMonth, pos1.endDateYear);
                    const pos2StartDate = _createDateFromMonthAndYear(pos2.startDateMonth, pos2.startDateYear);
                    
                    if (pos2StartDate < pos1EndDate && pos2StartDate > pos1StartDate) {
                        pos1.endDateMonth = pos2StartDate.getMonth()+1;
                        pos1.endDateYear = pos2StartDate.getFullYear();
                    }
                }
            }
        }
    }

    const _calculateMonthsBetweenDates = (dateFrom, dateTo) => {
        return dateTo.getMonth() - dateFrom.getMonth() + 
            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
    }

    const _calculateMonthsUsingSkill = (positionsWithSkill) => {
        if (positionsWithSkill && positionsWithSkill.length) {
            let monthsUsing = 0;
            
            const positionsWithSkillCopy = JSON.parse(JSON.stringify(positionsWithSkill));
            _adjustForOverlappingPositions(positionsWithSkillCopy);

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

    const _calculateJobStatistics = (positions) => {
        if (positions && positions.length) {
            const yearsOnJobStatistics = {};
            let totalJobs = positions.length;
            let totalJobYears = 0;

            positions.forEach((position) => {
                let isCurrentJob = true;
                const startDate = _createDateFromMonthAndYear(position.startDateMonth, position.startDateYear);
                
                // If no end date, calculate from today
                let endDate = _createDateFromMonthAndYear(new Date().getMonth(), new Date().getFullYear());
                if (position.endDateYear) {
                    endDate = _createDateFromMonthAndYear(position.endDateMonth, position.endDateYear);
                    isCurrentJob = false;
                }

                const totalMonthsOnJob = _calculateMonthsBetweenDates(startDate, endDate);
                const totalYearsOnJob = Math.round(100*totalMonthsOnJob * 0.08333)/100;

                if (isCurrentJob) {
                    // If we have a current job, we don't want to include in average.  We only want to average the 
                    // past jobs so that we can compare the current job to the candidates history of jobs
                    totalJobs--;
                    if (!yearsOnJobStatistics.current 
                        || (yearsOnJobStatistics.current && totalYearsOnJob > yearsOnJobStatistics.current)) {
                        yearsOnJobStatistics.current = totalYearsOnJob;
                    }
                } else {
                    // Add to our total job years
                    totalJobYears += totalYearsOnJob

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
                yearsOnJobStatistics.average = Math.round(100*totalJobYears / totalJobs)/100;
            }

            return yearsOnJobStatistics;
        }

        return {};
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

    const _stringContains = (string, substrings = []) => {
        return substrings.some((substring) => {
            if (string.toLowerCase().includes(substring.toLowerCase())) {
                return true;
            }
            return false;
        });
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

    const _flattenSkillSearchPhrases = (skillObj, contact) => {
        let flattenedSkills = [];
        
        if (skillObj.searchPhrases) {
            flattenedSkills = flattenedSkills.concat(skillObj.searchPhrases);
        }
        
        // If we have childSkills, recursively call
        if (skillObj.childSkills && skillObj.childSkills.length > 0) {
            skillObj.childSkills.forEach((childSkill) => {
                const childSkillObj = skillStats.skillStatsList[childSkill];
                if (childSkillObj) {
                    flattenedSkills = flattenedSkills.concat(_flattenSkillSearchPhrases(childSkillObj, contact));
                } else {
                    // If there's not an associated child skill object, then we need to create one and process skills
                    _processSkillStats(childSkill, [childSkill], contact);
                    // Also append the childSkill so that the parent is properly searched as well
                    flattenedSkills.push(childSkill);
                }
            })
        }
        return flattenedSkills;
    }

    const _getPositionsWithSkill = (skillSearchPhrases, positions) => {
        if (positions && positions.length) {
            return positions.filter((pos) => {
                if (skillSearchPhrases && skillSearchPhrases.length > 0) {
                    if (tsString.containsAny(pos.description, skillSearchPhrases)
                        || tsString.containsAny(pos.title, skillSearchPhrases)) {
                        return true;
                    }
                }
                return false;
            });
        }
        return null;
    }

    const _getProcessedSkillStatistics = () => {
        return processedSkillStatistics;
    }

    const _processSkillStats = (skill, skillSearchPhrases, contact) => {
        const positionsWithSkill = _getPositionsWithSkill(skillSearchPhrases, contact.positions);
        
        if (!positionsWithSkill || positionsWithSkill.length === 0) {
            // If the skill is not matched in any position, we can exit early
            return null;
        }

        // Does contact have it in their LinkedIn About/Summary?
        const isInLinkedInSummary = tsString.containsAny(contact.linkedInSummary, skillSearchPhrases);

        // Does contact have it in their LinkedIn Skills Section?
        const isInLinkedInSkills = (contact.linkedInSkills && contact.linkedInSkills.length) 
            ? tsString.containsAny(contact.linkedInSkills.join(","), skillSearchPhrases)
            : false;
        
        // Does contact have it in their tags that we purposefully set?
        const isInTags = tsString.containsAny(contact.tags, skillSearchPhrases);

        // Does contact have it in their skills assessment?
        const isInSelfAssessedSkills = _findSkillInSelfAssessedSkills(skillSearchPhrases, contact);

        // Breadth: The number of different companies or roles using the same skill; makes you a potential lead.
        processedSkillStatistics[skill] = {
            breadth: positionsWithSkill.length,
            isInLinkedInSkills,
            isInLinkedInSummary,
            isInSelfAssessedSkills,
            isInTags,
            monthsOfUse: _calculateMonthsUsingSkill(positionsWithSkill),
            monthsSinceLastUse: _calculateMonthsSinceLastUse(positionsWithSkill)
            
        }
        return true;
    }

    const _processSkillsStatistics = (contact) => {
        for (let key in skillStats.skillStatsList) {
            const skill = skillStats.skillStatsList[key];
            const contactCopy = JSON.parse(JSON.stringify(contact));
            const flattenedSkillSearchPhrases = _flattenSkillSearchPhrases(skill, contactCopy);
            _processSkillStats(key, flattenedSkillSearchPhrases, contactCopy);
        }
        return processedSkillStatistics;
    }

    const _processStatistics = (contact) => {
        const result = {};
        const skillStatistics = _processSkillsStatistics(contact);
        
        result.skillStatistics = skillStatistics;
        result.skillsList = Object.keys(skillStatistics);
        result.jobStatistics = _calculateJobStatistics(contact.positions);

        return result;
    }

    const _resetProcessedSkills = () => {
        processedSkillStatistics = {};
    };
    
    const _setSkillsList = (skillsList) => {
        skillStats.skillStatsList = skillsList;
    }

    class Statistician {
        calculateJobStatistics = _calculateJobStatistics;
        calculateMonthsBetweenDates = _calculateMonthsBetweenDates;
        calculateMonthsSinceLastUse = _calculateMonthsSinceLastUse;
        calculateMonthsUsingSkill = _calculateMonthsUsingSkill;
        createDateFromMonthAndYear = _createDateFromMonthAndYear;
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