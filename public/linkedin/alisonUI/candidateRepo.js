(() => {
    const _objectStore = 'candidate';
    const _candidateIdKey = 'memberId';

    const _filterResultsOnFirstConnections = (results, shouldFilter) => {
        if (!(shouldFilter && results && results.length)){
            return results;
        }

        const filteredResults = results.filter((c) => {
            let isFirst = false;
            for(let k in c.alisonConnections){
               if (c.alisonConnections[k] === "1"){
                   isFirst = true;
                   break;
               }
            }

            return isFirst;
        });

        return filteredResults;
    }

    const _getCandidate = async (memberId) => {
        const lookFor = !isNaN(memberId) ? Number.parseInt(memberId) : null;

        if (lookFor){
            return await baseIndexDb.getObjectById(_objectStore, lookFor);
        }

        throw new Error(`${memberId} is not a valid memberId to search on`)
    }

    const _reconcileIfCandidateIsJobSeeking = (existingCandidate, incomingCandidate) => {
        //Check if incomingCandidate isJobSeeker status conflicts with Mike or Joe 'notReallySeeking' status
        if (existingCandidate.notReallySeeking && incomingCandidate.isJobSeeker){
            const notSeekingSetDate = existingCandidate.notReallySeekingSetDate;
            const incomingStartedSeekingOn = incomingCandidate.jobSeekerStartDate ? incomingCandidate.jobSeekerStartDate : 0;

            if (incomingStartedSeekingOn <= notSeekingSetDate){
                incomingCandidate.notReallySeeking = true;
                incomingCandidate.notReallySeekingSetDate = existingCandidate.notReallySeekingSetDate;
            }
        }
    }

    const _saveCandidate = async (candidate) => {
        if (!(candidate && candidate.memberId)){
            throw new Error('Invalid candidate in _saveCandidate.  undefined object or missing memberId');
        }

        let existingCandidate = await baseIndexDb.getObjectById(_objectStore, candidate.memberId);
        if (existingCandidate){
            _reconcileIfCandidateIsJobSeeking(existingCandidate, candidate);

            await baseIndexDb.updateObject(_objectStore, candidate, _candidateIdKey);
        }
        else {
            await baseIndexDb.insertObject(_objectStore, candidate, _candidateIdKey);
        }

        return candidate;
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

    const _getCurrentJobSeekers = async (onlyFirst) => {
        let result = await _getCandidates() || [];
        result = result.filter ? result.filter(c => c.isJobSeeker === true && !c.notReallySeeking) : [];
        result = _filterResultsOnFirstConnections(result, onlyFirst);
        _sortCandidates(result);

        return result;
    }

    const _getRecentlyHired = async (onlyFirst) => {
        const nowHelper = tsCommon.now();

        let result = await _getCandidates() || []
        result = result.filter ? result.filter((c) => {
                if (c.notReallySeeking === true || ((!c.jobSeekerEndDate) || c.isJobSeeker)) {
                    return false;
                }

                const days = nowHelper.dayDiff(c.jobSeekerEndDate);
                return c.isJobSeeker === false && days < 30;
            }) : [];

        result = _filterResultsOnFirstConnections(result, onlyFirst);
        _sortCandidates(result);

        return result;
    }

    const _setNotReallySeeking = async (memberId, value) => {
        let existingCandidate =  await _getCandidate(memberId);
        existingCandidate.notReallySeeking = value ? value : null;
        existingCandidate.notReallySeekingSetDate = value ? (new Date()).getTime() : null;
        await baseIndexDb.updateObject(_objectStore, existingCandidate, 'memberId');
    }

    class CandidateRepo {
        saveCandidate = _saveCandidate;
        getCandidates = _getCandidates;
        getCandidate = _getCandidate;
        getCurrentJobSeekers = _getCurrentJobSeekers;
        getRecentlyHired = _getRecentlyHired;
        resetJobSeekers = _resetJobSeekers;
        setNotReallySeeking = _setNotReallySeeking;
    }

    window.candidateRepo = new CandidateRepo()
})();