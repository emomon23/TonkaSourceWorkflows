(function() {

    const _recruiterProfilePage = {
        profileId: 'input[name*="profile-id"]',
        skillsList: '#profile-skills div ul[class*="skills"]'
    }

    class LinkedInSelectors {
        recruiterProfilePage = _recruiterProfilePage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


