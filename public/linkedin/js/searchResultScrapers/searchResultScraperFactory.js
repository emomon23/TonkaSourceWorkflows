(function() {
    const _getSearchResultScraper = () => {
        const url = ''; //get the url
        //If (url.indexOf('') >= 0)
        //   return __ts_projectSearchResultScraper
        //}

        return __ts_searchResultScraper;
    }

    class SearchResultScraperFactory {
        constructor(){}

        getSearchResultScraper = _getSearchResultScraper;
    }

    window.searchResultScraperFactory = new SearchResultScraperFactory();
})();