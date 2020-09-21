(function() {
    class LinkedInConstants {
        pages = {
            RECRUITER_SEARCH_RESULTS: "Recruiter Search Results",
            RECRUITER_PROFILE: "Recruiter Profile",
            PUBLIC_PROFILE: "Public Profile"
        };

        // This is our ability to scrape and save anyone we step into after searching
        SAVE_AFTER_RECRUITER_PROFILE_SCRAPE = false;

        urls = {
            RECRUITER_SEARCH_RESULTS: "/recruiter/smartsearch",
            RECRUITER_PROFILE: "/recruiter/profile/",
            PUBLIC_PROFILE: "linkedin.com/in/"
        };
    }
    window.linkedInConstants = new LinkedInConstants();
})();