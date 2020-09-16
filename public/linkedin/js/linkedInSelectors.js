(function() {

    const _recruiterProfilePage = {
        skillsList: '#profile-skills div ul[class*="skills"]'
    }

    class LinkedInSelectors {
        recruiterProfilePage = _recruiterProfilePage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


