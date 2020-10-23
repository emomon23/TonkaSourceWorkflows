(()=> {
    const _linkedInRecruiterFilterKey = "TSLinkedInRecruiterFilter";
    const _skillGPASearchFilterKey = "TSSkillGPAFilter";

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
        return _saveItem(_skillGPASearchFilterKey, filterObject);
    }

    const _getLinkedInRecruiterSearchFilters = () => {
        return _getItem(_linkedInRecruiterFilterKey);
    }

    const _getSkillsGPASearchFilters = () => {
        return _getItem(_skillGPASearchFilterKey)
    }

    class TSRecruiterSearchFilterRepository {
        saveLinkedInRecruiterSearchFilters = _saveLinkedInRecruiterSearchFilters;
        getLinkedInRecruiterSearchFilters = _getLinkedInRecruiterSearchFilters;
        saveSkillsGPASearchFilters = _saveSkillsGPASearchFilters;
        getSkillsGPASearchFilters = _getSkillsGPASearchFilters;
        clearSkillsGPASearchFilters = () => { window.localStorage.removeItem(_skillGPASearchFilterKey);}
    }

    window.tsRecruiterSearchFilterRepository = new TSRecruiterSearchFilterRepository();
})();