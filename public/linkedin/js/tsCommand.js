(() => {
    const _runJobHistoryScraperJob = async(howMany) => {
        tsJobHistoryScrapeManager.begin(howMany);
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
    }

    window.tsCommand = new TSCommand();
})();