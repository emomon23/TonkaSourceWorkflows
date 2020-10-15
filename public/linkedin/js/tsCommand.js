(() => {
    _runJobHistoryScraperJob = async (howMany = 5, tagsFilter = null) => {
        await linkedInCommon.callAlisonHookWindow('runJobHistoryScraperJob', {howMany, tagsFilter});
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
    }

    window.tsCommand = new TSCommand();
})();