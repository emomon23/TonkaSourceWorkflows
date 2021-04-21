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

    const _getCompanyJobs = async (companyIdOrName) => {
        const jobs = await _getAllJobs();

        if (isNaN(companyIdOrName)){
            return jobs.filter((j) => {return j.company === companyIdOrName})
        }
        else {
            const intCompanyId = Number.parseInt(companyIdOrName);
            return jobs.filter((j) => { return j.linkedInCompanyId === intCompanyId})
        }
    }

    const _getLastContactDateFromNotes = (company) => {
        if (Array.isArray(company.tsNotes) && company.tsNotes.length > 0){
            try {
                return company.tsNotes[0].split(' ')[1];
            }
            catch(e){
                return e.message || e;
            }
        }

        return "";
    }

    const _getAllJobs = async (forceRefresh = false) => {
        if (forceRefresh === false && _cachedJobs){
            return _cachedJobs;
        }

        const competitors = await competitorRepository.getByType('recruiter');
        const prospects = await competitorRepository.getByType('prospect');

        _cachedJobs = await jobsRepository.getAll();
        const now = new Date();

        _cachedJobs.forEach((j) => {
            const jobCompanyName = j.company && j.company.toLowerCase ? j.company.toLowerCase() : '';

            if (jobCompanyName.indexOf("granicus") >= 0){
                const breakHere = true;
            }

            if (!j.linkedInCompanyId){
                let linkedInCompanyPotentialMatches = companySummaryRepository.companyNameAndAliasTypeAheadSearch(jobCompanyName);
                linkedInCompanyPotentialMatches = linkedInCompanyPotentialMatches.filter((c) => { return !isNaN(c.companyId) });

                if (linkedInCompanyPotentialMatches.length > 1){
                    linkedInCompanyPotentialMatches = linkedInCompanyPotentialMatches.filter((c) => {
                                                            return c.aliases && c.aliases.indexOf(jobCompanyName) >= 0;
                                                        });
                }

                if (linkedInCompanyPotentialMatches.length === 1){
                    const jobCompany = linkedInCompanyPotentialMatches[0];
                    j.linkedInCompanyId =  jobCompany.companyId;
                    j.lastContacted = _getLastContactDateFromNotes(jobCompany);
                }
            }
            else {
                const foundCompanies =  companySummaryRepository.syncGet(j.linkedInCompanyId);
                if (foundCompanies && foundCompanies.length === 1){
                    j.lastContacted = _getLastContactDateFromNotes(foundCompanies[0]);
                }
            }

            for (let i = 0; i < competitors.length; i++){
                if (jobCompanyName === competitors[i].name){
                    j.isRecruiterCompany = true;
                    break;
                }
            }

            prospects.forEach((p) => {
                linkedInCompanyId = (j.linkedInCompanyId || 0);
                if (linkedInCompanyId === p.id && p.type === 'prospect'){
                    j.isProspect = true;
                    j.group = p.group;
                }
            });

            if (j.postedDate){
                j.age = Number.parseInt(tsCommon.dayDifference(now, j.postedDate));
            }

            if (j.lastVerified){
                j.lastVerifiedAge = Number.parseInt(tsCommon.dayDifference(now, j.lastVerified));
            }
        });

        return _cachedJobs;
    }

    const _deleteJobs = async (jobsArray) => {
        for (let i = 0; i < jobsArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await jobsRepository.delete(jobsArray[i].key);
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
            // eslint-disable-next-line no-await-in-loop
            const job = await jobsRepository.get(jobsArray[i].key);
            job.linkedInCompanyId = linkedInCompanySummary.companyId;
            // eslint-disable-next-line no-await-in-loop
            await jobsRepository.update(job);

            jobCompanyNames[job.company.toLowerCase()] = true;
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

    const _search = async (searchFilter, forceRefresh = false) => {
        let jobDocs = [];
        let listOfCompanies = [];
        if (searchFilter.companies.trim()) {
            // If we're searching by name, we just want matching companies
            listOfCompanies = searchFilter.companies.split(",").map((n) => n.trim());
        }

        jobDocs = await _getAllJobs(forceRefresh);

        jobDocs = _filterByCompany(jobDocs, listOfCompanies);

        if (!searchFilter.includeRecruiters || !searchFilter.includeHidden){
            jobDocs = jobDocs.filter((jd) => {
                const recruiterCheck = searchFilter.includeRecruiters || jd.isRecruiterCompany !== true;
                const hiddenCheck = searchFilter.includeRecruiters || jd.isHidden !== true;

                return recruiterCheck && hiddenCheck;
            })
        }

        if (searchFilter.group){
            jobDocs = jobDocs.filter((jd) => {
                return jd.group === searchFilter.group;
            })
        }
        else if (searchFilter.type){
            jobDocs = jobDocs.filter((jd) => {
                return jd.isProspect;
            })
        }

        return jobDocs;
    }

    const _toggleProspectStatus = async (linkedInCompanyIdString, group) => {
        const linkedInCompanyId = Number.parseInt(linkedInCompanyIdString);
        const prospect = await competitorRepository.get(linkedInCompanyId);

        if (prospect){
            if (group && group.length) {
                prospect.group = group.toUpperCase();
                await competitorRepository.update(prospect);
            }
            else {
                await competitorRepository.delete(prospect.id)
            }
        }
        else {
            if (group && group.length){
                await competitorRepository.insert({id: linkedInCompanyId, group: group.toUpperCase(), type: 'prospect'})
            }
        }

        await _getAllJobs(true);
    }

    const _flagCompaniesAsRecruiters = async (jobs) => {
        let companyNames = {};
        jobs.forEach((j) => {
            companyNames[j.company.toLowerCase()] = true;
        });

        for(let k in companyNames){
            // eslint-disable-next-line no-await-in-loop
            await competitorRepository.save({id: k, name: k, type: 'recruiter'});
        }

        await _getAllJobs(true);
    }

    class JobController {
        saveBatchJobs = _saveBatchJobs;
        getAllJobs = _getAllJobs;
        getCompanyJobs = _getCompanyJobs;
        deleteJobs = _deleteJobs;
        hideJobs = _hideJobs;
        flagCompaniesAsRecruiters = _flagCompaniesAsRecruiters;
        updateJobStatus = _updateJobStatus;
        associateJobsToLinkedInCompany = _associateJobsToLinkedInCompany;
        search = _search;
        toggleProspectStatus = _toggleProspectStatus;

    }

    window.jobsController = new JobController();
})();