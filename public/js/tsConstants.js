(function () {
    class TSConstants {
        HOSTING_URL = "http://localhost:5001";
        FUNCTIONS_URL = "http://localhost:5000/alison-krause/us-central1";

        localStorageKeys = {
            CANDIDATE_FILTERS: 'tsCandidateFilters'
        };
    }

    window.tsConstants = new TSConstants();
})();