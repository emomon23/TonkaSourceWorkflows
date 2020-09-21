(function() {

    const _recruiterProfilePage = {
        profileId: 'input[name*="profile-id"]',
        publicProfileLink: 'a:contains("Public Profile")',
        skillsList: '#profile-skills div ul[class*="skills"]'
    }

    const _searchResultsPage = {
        BADGES: 'div[class*="badges"]'
    }

    class LinkedInSelectors {
        recruiterProfilePage = _recruiterProfilePage;
        searchResultsPage = _searchResultsPage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


