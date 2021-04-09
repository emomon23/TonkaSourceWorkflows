(() => {
    let _cachedJobs = null;

    const _saveBatchJobs = async (jobs) => {
        for (let i = 0; i < jobs.length; i++) {
            const scrapedJob = jobs[i];
            // eslint-disable-next-line no-await-in-loop
            const existingJob = await jobsRepository.get(scrapedJob.key);

            if (existingJob){
                existingJob.lastVerified = (new Date()).getTime();
                // eslint-disable-next-line no-await-in-loop
                await jobsRepository.update(existingJob);
            }
            else {
                scrapedJob.lastVerified = (new Date()).getTime();
                // eslint-disable-next-line no-await-in-loop
                await jobsRepository.insert(scrapedJob);
            }
        }
    }

    const _getAllJobs = async (forceRefresh = false) => {
        if (forceRefresh === false && _cachedJobs){
            return _cachedJobs;
        }

        const competitors = await competitorRepository.getAllCompetitors();
        _cachedJobs = await jobsRepository.getAll();
        const now = new Date();

        _cachedJobs.forEach((j) => {
            const jobCompanyName = j.company && j.company.toLowerCase ? j.company.toLowerCase() : '';
            for (let i = 0; i < competitors.length; i++){
                if (jobCompanyName.indexOf(competitors[i]) >= 0){
                    j.isRecruiterCompany = true;
                    break;
                }
            }

            if (j.postedDate){
                j.age = Number.parseInt(tsCommon.dayDifference(now, j.postedDate));
            }

            if (j.lastVerified){
                j.lastVerifiedAge = Number.parseInt(tsCommon.dayDifference(now, j.lastVerified));
            }

            if (!j.linkedInCompanyId){
                let linkedInCompanyPotentialMatches = companySummaryRepository.companyNameAndAliasTypeAheadSearch(jobCompanyName);
                linkedInCompanyPotentialMatches = linkedInCompanyPotentialMatches.filter((c) => { return !isNaN(c.companyId) });

                if (linkedInCompanyPotentialMatches.length === 1){
                    j.linkedInCompanyId =  linkedInCompanyPotentialMatches[0].companyId;
                }
            }
        });

        return _cachedJobs;
    }

    const _deleteJobs = async (jobs) => {
        const jobsArray = Array.isArray(jobKeys) ? jobKeys : [jobKeys];

        for (let i = 0; i < jobsArray; i++){
            // eslint-disable-next-line no-await-in-loop
            await jobsRepository.delete(jobsArray[i]);
        }

        await _getAllJobs(true);
    }

    const _filterByCompany = (jobs, namesList) => {
        if (jobs.length && namesList && namesList.length) {
            return jobs.filter((job) => {
                return namesList.some((name) => {
                    const lCaseName = name && name.toLowerCase ? name.toLowerCase() : "No Match No Match"
                    const companyName = job.company && job.company.toLowerCase ? job.company.toLowerCase() : '';

                    if (companyName.includes(lCaseName)) {
                        return true;
                    }
                    return false;
                });
            });
        }
        return jobs;
    }

    const _hideJobs = async (jobsArray) => {
        for (let i = 0; i < jobsArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            const job = await jobsRepository.get(jobsArray[i].key);

            if (!job){
                throw new Error(`Unable to find job ${jobsArray[i]}`);
            }

            job.isHidden = true;
            // eslint-disable-next-line no-await-in-loop
            await jobsRepository.update(job);
        }

        await _getAllJobs(true);
    }

    const _updateJobStatus = async (jobKey, status) => {
        const job = await jobsRepository.get(jobKey);
        if (!job){
            throw new Error(`Unable to find job ${jobKey}`);
        }

        job.status = status;
        await jobsRepository.update(job);

        jobsController.getAllJobs(true);
    }

    const _associateJobsToLinkedInCompany = async (jobsArray, linkedInCompanyKey) => {
        const linkedInCompanySummary = await companySummaryRepository.get(linkedInCompanyKey);
        const jobCompanyNames = {};

        if (!linkedInCompanySummary){
            throw new Error(`Unable to find linked in companySummary for ${linkedInCompanyKey}`);
        }

        for (let i = 0; i < jobsArray.length; i++){
            jobsArray[i].linkedInCompanyId = linkedInCompanySummary.companyId;
            // eslint-disable-next-line no-await-in-loop
            await jobsRepository.update(jobsArray[i]);

            jobCompanyName[jobsArray[i].company.toLowerCase()] = true;
        }


        if (!linkedInCompanySummary.aliases){
            linkedInCompanySummary.aliases = [];
        }

        for (k in jobCompanyNames){
            if (linkedInCompanySummary.aliases.indexOf(k) === -1){
                linkedInCompanySummary.aliases.push(k);
            }
        }

        await companySummaryRepository.update(linkedInCompanySummary);
        await _getAllJobs(true);
    }

    const _search = async (searchFilter) => {
        let jobDocs = [];
        let listOfCompanies = [];
        if (searchFilter.companies.trim()) {
            // If we're searching by name, we just want matching companies
            listOfCompanies = searchFilter.companies.split(",").map((n) => n.trim());
        }

        jobDocs = await _getAllJobs();

        jobDocs = _filterByCompany(jobDocs, listOfCompanies);

        if (!searchFilter.includeRecruiters || !searchFilter.includeHidden){
            jobDocs = jobDocs.filter((jd) => {
                const recruiterCheck = searchFilter.includeRecruiters || jd.isRecruiterCompany !== true;
                const hiddenCheck = searchFilter.includeRecruiters || jd.isHidden !== true;

                return recruiterCheck && hiddenCheck;
            })
        }

        return jobDocs;
    }

    const _setCompanyBusinessDevelopmentStatus = async (linkedInCompanyKey, status) => {
        const linkedInCompanySummary = await companySummaryRepository.get(linkedInCompanyKey);
        if (!linkedInCompanySummary){
            throw new Error(`Unable to find linked in companySummary for ${linkedInCompanyKey}`);
        }

        linkedInCompanySummary.businessDevelopmentStatus = status;
        await companySummaryRepository.update(linkedInCompanySummary);
    }

    const _flagCompaniesAsRecruiters = async (jobs) => {
        let companyNames = {};
        jobs.forEach((j) => {
            companyName[j.company.toLowerCase] = true;
        });

        for(let k in companyName){
            // eslint-disable-next-line no-await-in-loop
            await competitorRepository.save({id: k, name: k});
        }

        await _getAllJobs(true);
    }

    class JobController {
        saveBatchJobs = _saveBatchJobs;
        getAllJobs = _getAllJobs;
        deleteJobs = _deleteJobs;
        hideJobs = _hideJobs;
        flagCompaniesAsRecruiters = _flagCompaniesAsRecruiters;
        updateJobStatus = _updateJobStatus;
        associateJobsToLinkedInCompany = _associateJobsToLinkedInCompany;
        search = _search;
        setCompanyBusinessDevelopmentStatus = _setCompanyBusinessDevelopmentStatus;

    }

    window.jobsController = new JobController();
})();