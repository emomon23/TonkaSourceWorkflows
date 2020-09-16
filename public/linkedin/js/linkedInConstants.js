(function() {
    class LinkedInConstants {
        pages = {
            RECRUITER_SEARCH_RESULTS: "Recruiter Search Results",
            RECRUITER_PROFILE: "Recruiter Profile",
            PUBLIC_PROFILE: "Public Profile"
        };

        urls = {
            RECRUITER_SEARCH_RESULTS: "/recruiter/smartsearch",
            RECRUITER_PROFILE: "/recruiter/profile/",
            PUBLIC_PROFILE: "linkedin.com/in/"
        };
    }
    window.linkedInConstants = new LinkedInConstants();
})();