(()=> {
    const _linkedInRecruiterFilterKey = "TSLinkedInRecruiterFilter";
    const _candidateFilters = tsConstants.localStorageKeys.CANDIDATE_FILTERS;

    const _saveItem = (key, item) => {
        return tsUICommon.saveItemLocally(key, item);
    }

    const _getItem = (key) => {
        return tsUICommon.getItemLocally(key);
    }

    const _saveLinkedInRecruiterSearchFilters = (filterObject) => {
        return _saveItem(_linkedInRecruiterFilterKey, filterObject);
    }

    const  _saveSkillsGPASearchFilters = (filterObject) => {
        return _saveItem(_candidateFilters, filterObject);
    }

    const _getLinkedInRecruiterSearchFilters = () => {
        return _getItem(_linkedInRecruiterFilterKey);
    }

    const _getCandidateFilters = () => {
        return _getItem(_candidateFilters)
    }

    class TSRecruiterSearchFilterRepository {
        saveLinkedInRecruiterSearchFilters = _saveLinkedInRecruiterSearchFilters;
        getLinkedInRecruiterSearchFilters = _getLinkedInRecruiterSearchFilters;
        saveSkillsGPASearchFilters = _saveSkillsGPASearchFilters;
        getCandidateFilters = _getCandidateFilters;
        clearSkillsGPASearchFilters = () => { window.localStorage.removeItem(_skillGPASearchFilterKey);}
    }

    window.tsRecruiterSearchFilterRepository = new TSRecruiterSearchFilterRepository();
})();