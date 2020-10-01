(() => {
    const _getMemberId = () => {
        return $(linkedInSelectors.recruiterProfilePage.profileId).val();
    }

    const _scrapeProfile = async () => {
        await tsCommon.sleep(2000);
        var memberId = _getMemberId();
        var candidateObj = searchResultsScraper.scrapedCandidates[memberId];

        // If we've scraped this candidate, proceed
        if (candidateObj) {
            var candidate = candidateObj.candidate;

            // Scrape Public Profile
            candidate.linkedIn = _scrapePublicProfileLink();

            // Scrape skills
            candidate.linkedInSkills = _scrapeSkills();

            if (_shouldSaveCandidate(candidate)) {
                await linkedInApp.upsertContact(candidate);
            } else {
                // If we don't save the candidate, we need to update local storage with details
                searchResultsScraper.scrapedCandidates[memberId].candidate = candidate;
                searchResultsScraper.persistToLocalStorage();
            }
        }

        return null;
    }

    const _scrapeOutDurationFromHtmlElement = (element) => {
        //(2 years 1 month)
        //(5 months)
        //(1 year 5 months)
        $(element).text().split('(').join('').split(')').join('');

        const years = rawDuration.indexOf('year') >= 0? rawDuration.split('year')[0] : 0;
        let months = 0;
        if (rawDuration.index('month') >= 0){
            const parts = rawDuration.split(' ');
            months = parts[parts.length -1];
        }
      
        return {
            years,
            months,
            totalMonthsOnJob: months + (years * 12)
        };
    }

    const _scrapeOutAndAppendStartDateAndEndDate = (positionElement, durationData) => {
        //June 2015 - November 2015(1 Year 5 months)
        const dateParts = $(positionElement).text().split('(')[0].split(' - ');
        durationData.startDate = new Date(dateParts[0]);
        durationData.endDate = dateParts[1] === 'Present'? new Date() : new Date(dateParts[1]);

        const dateTo = new Date();
        durationData.ageOfPositionInMonths = dateTo.getMonth() - durationData.endDate.getMonth() + 
        (12 * (dateTo.getFullYear() - durationData.endDate.getFullYear()));
    }

    const _scrapeOutJobExperiences = () => {
        const professionalExperienceListItems = $('#profile-experience li[class*="position"]').toArray();
        const result = [];

        professionalExperienceListItems.forEach((li) => {
            const job = {};
            job.jobTitle = $(li).find("h4").text();
            job.employer = $(li).find("h5").text();

            const durationElement = $(li).find('span[class*="duration"]');

            // durationData = {years:0, months: 0, totalMonthsOnJob: 0, startDate, endDate, ageOfPositionInMonths: [how long ago did they work here]}
            const durationData = _scrapeOutDurationFromHtmlElement(durationElement);
            const dateRangeElement = $(li).find('p[class*="date-range"]');
            _scrapeOutAndAppendStartDateAndEndDate(dateRangeElement, durationData);
            job.durationData = durationData;

            job.description = $(li).find('p[class*="description searchable"]').text();
            let weight = 0;

            // When was their last day on this job?
            // When did they work there? (eg - within the last 2 years, or 10 years ago)
            if (job.durationData.ageOfPositionInMonths < 24) {
                weight = 0.16;
            } else if (job.durationData.ageOfPositionInMonths < 48) {
                weight = 0.12;
            }
            else {
                weight = 0.09
            }

            // How long did they work there?  > 5 years?  3 years?  6 months?
            if (job.durationData.totalMonthsOnJob > 59){
                weight+= 0.03;
            }
            else if (job.durationData.totalMonthsOnJob >35){
                weight+= 0.02;
            }
            else if (job.durationData.totalMonthsOnJob > 6){
                weight+= 0.01;
            }

            job.weight = weight;
            result.push(job);
        });

        return result;
    }

    const _scoreASkillString = (skillString, jobExperiances) => {
        let score = 0;
        skillString = skillString.toLowerCase();

        jobExperiances.forEach((job) => {
            const jd = job.description.toLowerCase();
            if (jd.indexOf(skillString) >= 0){
                score += (job.totalMonthsOnJob * job.weight);
            }
        });

        return score;
    }

    const _scoreThisSkillAndAliases = (skillAndItsAliases, jobExperiances) => {
        const result = [];

        let skillNameScore = _scoreASkillString(skillAndItsAliases.name, jobExperiances);
        if (skillAndItsAliases.aliases){
            skillAndItsAliases.aliases.forEach((alias) => {
                const aliasScore = _scoreASkillString(alias, jobExperiances);
                if (aliasScore > skillNameScore){
                    skillNameScore = aliasScore;
                }
            });

            result.push({name: alias, score: skillNameScore});
        }

        result.push({name: skillAndItsAliases.name, score: skillNameScore});
    }

    const _weighDefinedSkills = () => {
        const skillsThatMatterToTonka = [
            {name: '.NET', aliases: ['c#', 'asp.net', 'asp.mvc', '.net core', 'vb.net']},
            {name: 'xamarin'},
            {name: 'posgress'},
            {name: 'mssql'},
            {name: 'javascript', aliases: ['angular', 'react', 'vue', 'nodejs', 'jquery', 'svelte', 'express',]},
            {name: 'azure'},
            {name: 'aws', aliases: ['amazon']},
            {name: 'java ', aliases: ['java,', 'java.', 'android', 'spring boot', 'springboot']},
            {name: 'ios', aliases: ['swift', 'objective-c']},
            {name: 'blockchain', aliases: ['block chain']}
        ];
        
        let result = [];
        const jobExperiances = _scrapeOutJobExperiences();
        
        skillsThatMatterToTonka.forEach((skillWithAliases) => {
            const scores = _scoreThisSkillAndAliases(skillWithAliases, jobExperiances, result);
            result = result.concat(scores);
        });

        return result;
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

    const _shouldSaveCandidate = (candidate) => {
        // This is our ability to scrape and save anyone we step into after searching
        const shouldSave = $.parseJSON(window.localStorage.getItem(linkedInConstants.localStorageKeys.SAVE_ON_RECRUITER_PROFILE))
        if (shouldSave) {
            return true;
        }
        // Save candidate if isJobSeeker
        if (candidate.isJobSeeker === true) {
            return true;
        }
        return false;
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