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
            if (existingCandidate.hide){
                candidate.hide = true;
            }

            await baseIndexDb.updateObject(_objectStore, candidate, _candidateIdKey);
        }
        else {
            await baseIndexDb.insertObject(_objectStore, candidate, _candidateIdKey);
        }
    }

    const _sortCandidates = (candidatesArray) => {
        candidatesArray.sort((a, b) => {
            if (a.dateLastUpdated > b.dateLastUpdated){
                return -1;
            }
            else if (a.dateLastUpdated === b.dateLastUpdated){
                return 0;
            }

            return 1;
        });
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
        return await baseIndexDb.getAll(_objectStore);
    }

    const _getCurrentJobSeekers = async () => {
        let result = await _getCandidates() || [];
        result = result.filter ? result.filter(c => c.isJobSeeker === true && !c.hide) : [];

        _sortCandidates(result);

        return result;
    }

    const _getRecentlyHired = async () => {
        const nowHelper = tsCommon.now();

        let result = await _getCandidates() || []
        result = result.filter ? result.filter((c) => {
                if (c.hide === true || ((!c.jobSeekerEndDate) || c.isJobSeeker)) {
                    return false;
                }

                const days = nowHelper.dayDiff(c.jobSeekerEndDate);
                return c.isJobSeeker === false && days < 30;
            }) : [];

        _sortCandidates(result);

        return result;
    }

    const _hideCandidate = async (memberId, value) => {
        let existingCandidate =  await _getCandidate(memberId);
        existingCandidate.hide = value;
        await baseIndexDb.updateObject(_objectStore, existingCandidate, 'memberId');
    }

    class CandidateRepo {
        saveCandidate = _saveCandidate;
        getCandidates = _getCandidates;
        getCandidate = _getCandidate;
        getCurrentJobSeekers = _getCurrentJobSeekers;
        getRecentlyHired = _getRecentlyHired;
        resetJobSeekers = _resetJobSeekers;
        hideCandidate = _hideCandidate;
    }

    window.candidateRepo = new CandidateRepo()
})();