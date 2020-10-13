(() => {
    _runJobHistoryScraperJob = async () => {
        await linkedInCommon.callAlisonHookWindow('runJobHistoryScraperJob');
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
    }

    window.tsCommand = new TSCommand();
})();