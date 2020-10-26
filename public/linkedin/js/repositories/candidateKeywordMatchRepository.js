(() => {
    let _candidatesMatched = {};

    const _getKey = (candidate) => {
        const memberId = candidate.memberId ? candidate.memberId : candidate;
        return `keywordMatch_${memberId}`;
    }

    const _saveCandidateKeywordMatch = (candidate) => {
        if (!(candidate && candidate.lastSearchFilterMatch)){
            console.log(`Unable to save candidate keywords`);
            return;
        }

        const storageKey = _getKey(candidate);
        tsUICommon.saveItemLocally(storageKey, candidate.lastSearchFilterMatch);
        _candidatesMatched[candidate.memberId] = candidate.lastSearchFilterMatch;
    }

    const _getCandidateKeywordMatch = (candidate) => {
        const storageKey = _getKey(candidate);
        const result = _candidatesMatched[candidate.memberId] || tsUICommon.getItemLocally(storageKey);
        
        if (result){
            candidate.lastSearchFilterMatch = result;
        }

        return result;
    }

    class CandidateKeywordMatchRepository {
        saveCandidateKeywordMatch = _saveCandidateKeywordMatch;
        getCandidateKeywordMatch = _getCandidateKeywordMatch;
    }

    window.candidateKeywordMatchRepository = new CandidateKeywordMatchRepository();
})();