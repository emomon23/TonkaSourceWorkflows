(() => {
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

    const _getMemberId = async () => {
        const candidate = await searchResultsScraper.getCurrentRecruiterProfileCandidate();
        if (candidate){
            return candidate.memberId;
        }

        return $(linkedInSelectors.recruiterProfilePage.profileId).val();
    }

    const _scrapeProfile = async (tagString = null) => {
        await tsCommon.sleep(1000);
        const scrapedFullName = $(linkedInSelectors.recruiterProfilePage.fullName).text()
        candidate = await searchResultsScraper.getCurrentRecruiterProfileCandidate();

        // If we've scraped this candidate, proceed
        if (candidate) {
            candidate.lastScrapedBy = linkedInConstants.pages.RECRUITER_PROFILE;

            if (scrapedFullName.indexOf(candidate.lastName) === -1){
                tsCommon.log("Candidate in local storage does not match what's on the profile page", "WARN");
                return null;
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
                candidate.tags+= `,${tagString}`;
            }

            linkedInRecruiterFilter.analyzeCandidateProfile(candidate);
            linkedInApp.upsertContact(candidate);

            // Process Statistics
            candidate.statistics = statistician.processStatistics(candidate);

            // Calculate Skill Statistics Grades
            const skillsStatisticsList = [candidate.statistics];
            const skillsFilter = tsUICommon.getItemLocally('TSSkillGPAFilter');
            if (skillsFilter) {
                statistician.calculateSkillsStatistics(skillsStatisticsList, skillsFilter, false);
            }

            _displayStatisticGrades(candidate);
            candidateRepository.saveCandidate(candidate);

        }

        return candidate;
    }

    const _scrapeOutDurationFromHtmlElement = (element) => {
        //(2 years 1 month)
        //(5 months)
        //(1 year 5 months)
        let rawDuration = $(element).text().split('(').join('').split(')').join('');

        let years = rawDuration.indexOf('year') >= 0 ? rawDuration.split('year')[0].trim() : 0;

        let months = 0;
        if (rawDuration.indexOf('month') >= 0){
            const parts = rawDuration.split(' ');
            months = parts[parts.length -2].trim();
        }

        const result = {
            years: Number.parseInt(years),
            months: Number.parseInt(months),
        };

        result.totalMonthsOnJob = (result.years * 12) + result.months;
        return result;
    }

    const _scrapeOutAndAppendStartDateAndEndDate = (positionElement, durationData) => {
        //June 2015 - November 2015(1 Year 5 months)
        const rangeString = $(positionElement).text().split("(")[0].trim();
        const dateParts = rangeString.split('–');
        durationData.startDate = new Date(dateParts[0].trim());
        durationData.startDateMonth = durationData.startDate.getMonth() +1;
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
                jobPosition.description = scrapedExperience.description;
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
                skills.push($(skillElement).html());
            });
        }

        return skills;
    }

    class LinkedInRecruiterProfileScraper {
        getMemberId = _getMemberId;
        scrapeProfile = _scrapeProfile;
    }

    window.linkedInRecruiterProfileScraper = new LinkedInRecruiterProfileScraper();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_PROFILE) {
            _scrapeProfile();
        }
    })
})();