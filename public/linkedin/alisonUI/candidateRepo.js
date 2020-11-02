(() => {
    const _objectStore = 'candidate';
    const _candidateIdKey = 'memberId';

    const _getCandidate = async (memberId) => {
        const lookFor = !isNaN(memberId) ? Number.parseInt(memberId) : null;

        if (lookFor){
            return await baseIndexDb.getObjectById(_objectStore, lookFor);
        }

        throw new Error(`${memberId} is not a valid memberId to search on`)
    }

    const _saveCandidate = async (candidate) => {
        if (!(candidate && candidate.memberId)){
            throw new Error('Invalid candidate in _saveCandidate.  undefined object or missing memberId');
        }

        let existingCandidate = await baseIndexDb.getObjectById(_objectStore, candidate.memberId);
        if (existingCandidate){
            await baseIndexDb.updateObject(_objectStore, candidate, _candidateIdKey);
        }
        else {
            await baseIndexDb.insertObject(_objectStore, candidate, _candidateIdKey);
        }
    }

    const _resetJobSeekers = async (thisDashboardSync) => {
        const candidates = await _getCandidates();
        for (let i=0; i<candidates.legnth; i++){
            if (candidates[i].dashboardSync !== thisDashboardSync)
                candidates[i].isJobSeeker = false;
                candidates[i].jobSeekerEndDate = thisDashboardSync;
                // eslint-disable-next-line no-await-in-loop
                await _saveCandidate(candidates[i]);
        }
    }

    const _getCandidates = async () => {
        await baseIndexDb.getAll(_objectStore);
    }

    class CandidateRepo {
        saveCandidate = _saveCandidate;
        getCandidates = _getCandidates;
        getCandidate = _getCandidate;
        resetJobSeekers = _resetJobSeekers;
    }

    window.candidateRepo = new CandidateRepo()
})();