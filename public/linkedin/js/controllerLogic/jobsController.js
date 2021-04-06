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

        allJobs.forEach((j) => {
            const company = j.company && j.company.toLowerCase ? j.company.toLowerCase() : '';
            for (let i = 0; i < competitors.length; i++){
                if (company.indexOf(competitors[i]) >= 0){
                    j.isRecruiterCompany = true;
                    break;
                }
            }
        });

        return allJobs;
    }

    class JobController {
        saveBatchJobs = _saveBatchJobs;
        getAllJobs = _getAllJobs;
    }

    window.jobsController = new JobController();
})();