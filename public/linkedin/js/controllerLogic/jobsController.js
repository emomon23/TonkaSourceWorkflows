(() => {

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

    const _getAllJobs = async () => {
        const competitors = await competitorRepository.getAllCompetitors();
        const allJobs = await jobsRepository.getAll();
        const now = new Date();

        allJobs.forEach((j) => {
            const company = j.company && j.company.toLowerCase ? j.company.toLowerCase() : '';
            for (let i = 0; i < competitors.length; i++){
                if (company.indexOf(competitors[i]) >= 0){
                    j.isRecruiterCompany = true;
                    break;
                }
            }

            if (j.postedDate){
                j.age = Number.parseInt(tsCommon.dayDifference(now, j.postedDate))
            }

        });

        return allJobs;
    }

    const _deleteJobs = async (jobs) => {

    }

    const _hideJobs = async (jobs) => {

    }

    const _updateJobStatus = async (jobKey, status) => {

    }

    const _associateJobToLinkedInCompany = async (jobKey, linkedInCompanyKey) => {

    }

    const _setCompanyBusinessDevelopmentStatus = async (linkedInCompanyKey, status) => {

    }

    class JobController {
        saveBatchJobs = _saveBatchJobs;
        getAllJobs = _getAllJobs;
        deleteJobs = _deleteJobs;
        hideJobs = _hideJobs;
        updateJobStatus = _updateJobStatus;
        associateJobToLinkedInCompany = _associateJobToLinkedInCompany;
        setCompanyBusinessDevelopmentStatus = _setCompanyBusinessDevelopmentStatus;
    }

    window.jobsController = new JobController();
})();