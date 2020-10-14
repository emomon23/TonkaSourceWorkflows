(() => {
    _runJobHistoryScraperJob = async (howMany = 5) => {
        await linkedInCommon.callAlisonHookWindow('runJobHistoryScraperJob', {howMany});
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
    }

    window.tsCommand = new TSCommand();
})();