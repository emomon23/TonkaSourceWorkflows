(() => {
    let _currentPage = '';
    let _candidateFound = null;

    const  _displayStatisticGrades = (candidate) => {
        if (candidate
            && candidate.statistics
            && candidate.statistics.grades){

                const topCardElement = $(linkedInSelectors.recruiterProfilePage.topCard)[0];

                const newDiv = document.createElement("div");
                $(newDiv).attr('class', "profile-grade-container");

                linkedInCommon.displayGrade('Months Using', newDiv, candidate.statistics.grades.cumulativeMonthsUsing);
                linkedInCommon.displayGrade('Within Months', newDiv, candidate.statistics.grades.cumulativeWithinMonths);

                topCardElement.append(newDiv);
        }
    }

    const _findCandidateInDatabase = async () => {
        const nameElement = $(linkedInSelectors.recruiterProfilePage.fullName)[0];
        const headlineElement = $(linkedInSelectors.recruiterProfilePage.headline)[0];
        const imageElement = $(linkedInSelectors.recruiterProfilePage.imageUrl)[0];
        let candidateSearch = {};

        if (nameElement && (headlineElement || imageElement)){
            const fullName = tsString.cleanText(nameElement);
            candidateSearch = tsString.convertFullNameToObject(fullName);

            if (headlineElement){
                candidateSearch.headline = tsString.cleanText(headlineElement);
            }

            if (imageElement){
                candidateSearch.imageUrl = $(imageElement).attr('src');
            }
        }

        candidateSearch.linkedIn = _scrapePublicProfileLink();

        if (_candidateFound
            && _candidateFound.firstName === candidateSearch.firstName
            && _candidateFound.lastName === candidateSearch.lastName){
                return _candidateFound;
        }
        else {
            _candidateFound = null;
        }

        const cachedCandidate = await searchResultsScraper.getCurrentRecruiterProfileCandidate();
        if (cachedCandidate
            && cachedCandidate.firstName === candidateSearch.firstName
            && cachedCandidate.lastName === candidateSearch.lastName){
                _candidateFound = cachedCandidate;
                return _candidateFound;
        }

        _candidateFound = await candidateController.searchForCandidate(candidateSearch);
        if (_candidateFound){
            return _candidateFound;
        }

        return null;
    }

    const _getMemberId = async () => {
        const candidate = await _findCandidateInDatabase();
        return candidate ? candidate.memberId : null;
    }

    const _scrapeProfile = async (tagString = null) => {
        const candidate = await _findCandidateInDatabase();

        // If we've scraped this candidate, proceed
        if (candidate) {
            candidate.lastScrapedBy = linkedInConstants.pages.RECRUITER_PROFILE;

            // If we're not in automation mode, let's track the fact we've viewed their recruiter profile as a human
            const isAutoScrapingInProgress = tsUICommon.getItemLocally('tsAutoScrapingInProgress');
            if (!isAutoScrapingInProgress) {
                const currentUser = await linkedInApp.getAlisonLoggedInUser();
                if (candidate.lastViewedBy) {
                    candidate.lastViewedBy[currentUser] = new Date().getTime();
                } else {
                    candidate.lastViewedBy = {}
                    candidate.lastViewedBy[currentUser] = new Date().getTime();
                }
            }

            // Scrape Public Profile
            candidate.linkedIn = _scrapePublicProfileLink();
            candidate.rawExperienceText = $(linkedInSelectors.recruiterProfilePage.experienceSection).text().replace('Experience', '');

            const summaryElement = $(linkedInSelectors.recruiterProfilePage.aboutSummary);
            if (summaryElement && summaryElement.length > 0){
                candidate.summary = $(summaryElement).text().replace('Summary', '').trim();
            }

            // Scrape skills
            candidate.linkedInSkills = _scrapeSkills();
            _mergeCandidatePositionsWithScrapedJobExperience(candidate);

            if (tagString && tagString.length > 0){
                candidate.tags += `,${tagString}`;
            }

            linkedInRecruiterFilter.analyzeCandidateProfile(candidate);
            linkedInApp.upsertContact(candidate);

            // Process Statistics
            candidate.statistics = statistician.processStatistics(candidate);

            // Calculate Skill Statistics Grades
            const skillsStatisticsList = [candidate.statistics];
            const skillsFilter = tsUICommon.getItemLocally(tsConstants.localStorageKeys.CANDIDATE_FILTERS);
            if (skillsFilter) {
                statistician.calculateSkillsStatistics(skillsStatisticsList, skillsFilter, false);
            }

            _displayStatisticGrades(candidate);
            try {
                candidateController.saveCandidate(candidate);
            } catch (e) {
                tsCommon.log(e.message, 'ERROR');
            }

        }

        return candidate;
    }

    const _scrapeOutDurationFromHtmlElement = (element) => {
        // (2 years 1 month)
        // (5 months)
        // (1 year 5 months)
        let rawDuration = $(element).text().split('(').join('').split(')').join('');

        let years = rawDuration.indexOf('year') >= 0 ? rawDuration.split('year')[0].trim() : 0;

        let months = 0;
        if (rawDuration.indexOf('month') >= 0){
            const parts = rawDuration.split(' ');
            months = parts[parts.length - 2].trim();
        }

        const result = {
            years: Number.parseInt(years),
            months: Number.parseInt(months),
        };

        result.totalMonthsOnJob = (result.years * 12) + result.months;
        return result;
    }

    const _scrapeOutAndAppendStartDateAndEndDate = (positionElement, durationData) => {
        // June 2015 - November 2015(1 Year 5 months)
        const rangeString = $(positionElement).text().split("(")[0].trim();
        const dateParts = rangeString.split('–');
        durationData.startDate = new Date(dateParts[0].trim());
        durationData.startDateMonth = durationData.startDate.getMonth() + 1;
        durationData.startDateYear = durationData.startDate.getFullYear();

        dateParts[1] = dateParts[1].trim();
        durationData.isPresent = dateParts[1] === 'Present';
        durationData.endDate = durationData.isPresent === true ? new Date() : new Date(dateParts[1]);

        const dateTo = new Date();
        durationData.ageOfPositionInMonths = dateTo.getMonth() - durationData.endDate.getMonth() +
        (12 * (dateTo.getFullYear() - durationData.endDate.getFullYear()));
    }

    const _scrapeOutJobExperiences = () => {
        const professionalExperienceListItems = $('#profile-experience li[class*="position"]').toArray();
        const result = [];

        professionalExperienceListItems.forEach((li) => {
            const job = {};
            job.title = $(li).find("h4").text();
            job.companyName = $(li).find("h5").text();

            const durationElement = $(li).find('span[class*="duration"]');
            // durationData = {years:0, months: 0, totalMonthsOnJob: 0, startDate, endDate, ageOfPositionInMonths: [how long ago did they work here]}
            const durationData = _scrapeOutDurationFromHtmlElement(durationElement);
            const dateRangeElement = $(li).find('p[class*="date-range"]');
            _scrapeOutAndAppendStartDateAndEndDate(dateRangeElement, durationData);

            job.startDateMonth = durationData.startDateMonth;
            job.startDateYear = durationData.startDateYear;

            if (!durationData.isPresent){
                job.endDateMonth = durationData.endDateMonth;
                job.endDateYear = durationData.endDateYear;
            }

            job.description = $(li).find('p[class*="description searchable"]').text();
            job.skills = statistician.assessPositionSkills(job, 'ALL_SKILLS');
            result.push(job);
        });

        return result;
    }

    const _mergeCandidatePositionsWithScrapedJobExperience = (candidate) => {
        /* [{
            title,
            companyName,
            description: (open text),
            durationData: { years: months: totalMonthsOnJob: startDate, endDate, startDateMonth, startDateYear, ageOfPositionInMonths: (0 = present)}
            }]
        */
        const jobExperiences = _scrapeOutJobExperiences();
        jobExperiences.forEach((scrapedExperience) => {
            const jobPosition = candidate.positions.find((p) => {
                return p.companyName === scrapedExperience.companyName
                        && p.startDateMonth === scrapedExperience.startDateMonth
                });

            if (jobPosition){
                jobPosition.description = tsUICommon.cleanseTextOfHtml(scrapedExperience.description);
            }
        });
    }

    const _scrapePublicProfileLink = () => {
        return $(linkedInSelectors.recruiterProfilePage.publicProfileLink).attr("href");
    }

    const _scrapeSkills = () => {
        const skills = [];
        var skillElements = $(linkedInSelectors.recruiterProfilePage.skillsList).children("li");

        if (skillElements) {
            $(skillElements).each((index, skillElement) => {
                skills.push($(skillElement).text());
            });
        }

        return skills;
    }

    class LinkedInRecruiterProfileScraper {
        getMemberId = _getMemberId;
        scrapeProfile = _scrapeProfile;
    }

    window.linkedInRecruiterProfileScraper = new LinkedInRecruiterProfileScraper();

    const _delayReady = async () => {
        await tsCommon.sleep(500);

        _currentPage = linkedInCommon.whatPageAmIOn()
        if (_currentPage === linkedInConstants.pages.RECRUITER_PROFILE) {
            linkedInRecruiterProfileScraper.lastProfileScraped = await _scrapeProfile();
        }

        // Profile pages won't pop up a new window
        const publicProfileLink = await tsUICommon.jQueryWait('li[class*="public-profile"] a');
        await tsCommon.sleep(100);
        $(publicProfileLink).click((e) => {
            const link = $(e.target);
            $(link).attr('target', '');
        })

        linkedInApp.showTsReady();
    }

    $(document).ready(() => {
       _delayReady();
    })
})();