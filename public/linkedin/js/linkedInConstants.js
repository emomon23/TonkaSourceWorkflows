(function () {
    class LinkedInConstants {
        localStorageKeys = {
            ACTIVE_OPPORTUNITY: 'tsActiveOpportunityKey',
            ROLE: 'tsRoleKey',
            SAVE_ON_RECRUITER_PROFILE: 'tsSaveOnRecruiterProfile',
            TAGS: 'tsTagsKey'
        };

        roles = {
            BUSINESS_ANALYST: "Business Analyst",
            CORP_RECRUITER: "Corp Recruiter",
            DEVELOPER: "Developer",
            DEVOPS: "DevOps",
            DEV_MANAGER: "Dev Manager",
            EXECUTIVE: "Executive",
            HR: "HR",
            IT_ADMIN: "IT Admin",
            PROJECT_MANAGER: "Project Manager",
            QA_AUTOMATION: "QA Automation",
            QA_MANUAL: "QA Manual",
            RECRUITER: "Recruiter",
            SCRUM_COACH: "Scrum Coach",
        };

        pages = {
            CLIP_BOARD: "clipboard?",
            RECRUITER_COMPANY: "/recruiter/company",
            RECRUITER_SEARCH_RESULTS: "/recruiter/smartsearch",
            RECRUITER_PROFILE: "/recruiter/profile/",
            PUBLIC_PROFILE: "linkedin.com/in/",
            RECRUITER_INMAIL: '/recruiter/mailbox/conversation/',
            PROJECT_PIPELINE: ".com/recruiter/projects/",
            MY_CONNECTIONS_PUBLIC: ".com/mynetwork/invite-connect/connections/",
            LOGIN: "login",
            FEED: 'feed'
        };

        RECRUITER_PAGES = [
            this.pages.RECRUITER_COMPANY,
            this.pages.RECRUITER_SEARCH_RESULTS,
            this.pages.RECRUITER_PROFILE
        ]
    }
    window.linkedInConstants = new LinkedInConstants();
})();