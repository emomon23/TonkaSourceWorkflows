(() => {
    const _objectStoreName = 'candidate';
    const _keyPropertyName = 'memberId';

    const _saveCandidate = async (candidate) => {
         const {
            alisonConnections,
            firstName,
            lastName,
            city,
            state,
            headline,
            isJobSeeker,
            isActivelyLooking,
            memberId,
            grades,
            technicalYearString
        } = candidate;

        const slimmedCandidate =  {
            alisonConnections,
            firstName,
            lastName,
            city,
            state,
            headline,
            isJobSeeker,
            isActivelyLooking,
            memberId,
            grades: grades || [],
            technicalYearString: technicalYearString || ''
        };

        slimmedCandidate.positions = candidate.positions ? candidate.positions.map((p) => {
            return {
                startDateMonth: p.startDateMonth,
                startDateYear: p.startDateYear,
                endDateMonth: p.endDateMonth ? p.endDateMonth : null,
                endDateYear: p.endDateYear ? p.endDateYear : null,
                companyId: p.companyId,
                companyName: p.companyName,
                displayText: p.displayText,
                title: p.title
            }
        }) : [];

        return await baseIndexDb.saveObject(_objectStoreName, slimmedCandidate, _keyPropertyName);
    }

    const _saveCandidates = async (candidatesArray) => {
        for(let i=0; i<candidatesArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _saveCandidate(candidatesArray[i]);
        }
    }

    const _getCandidate = async (memberId) => {
        return await baseIndexDb.getObject(_objectStoreName, memberId);
    }

    const _getCandidateList = async() => {
        return await baseIndexDb.getAll(_objectStoreName);
    }

    class CandidateRepository {
        saveCandidate = _saveCandidate;
        saveCandidates = _saveCandidates;
        getCandidateList = _getCandidateList;
        getCandidate = _getCandidate;
    }

    window.candidateRepository = new CandidateRepository();
})();