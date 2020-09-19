(function() {

    const _recruiterProfilePage = {
        profileId: 'input[name*="profile-id"]',
        publicProfileLink: 'a:contains("Public Profile")',
        skillsList: '#profile-skills div ul[class*="skills"]'
    }

    class LinkedInSelectors {
        recruiterProfilePage = _recruiterProfilePage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


