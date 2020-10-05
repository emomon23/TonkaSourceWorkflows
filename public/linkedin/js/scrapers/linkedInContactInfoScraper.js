(() => {
    const _scrapeContactInfo = async (cachedCandidate) => {
        if (!cachedCandidate.isContactInfoScraped) {
            cachedCandidate.isContactInfoScraped = true;
            
            const contactInfoLink = $(linkedInSelectors.publicProfilePage.CONTACT_INFO_LINK);
            const contactInfoWindow = window.open($(contactInfoLink).attr("href"));
            await tsCommon.randomSleep(4000,7000);

            const contactInfoContainer = $(contactInfoWindow.document).find(linkedInSelectors.contactInfoPage.CONTACT_INFO_CONTAINER);
            
            if (contactInfoContainer) {
                cachedCandidate.phone = _scrapePhoneNumber(contactInfoContainer);
                cachedCandidate.email = _scrapeEmailAddress(contactInfoContainer);
            } else {
                tsCommon.log("Contact Info Scraper: Could not find contact info container", "WARN");
            }
            window.setTimeout(() => {
                contactInfoWindow.close();
            }, tsCommon.randomSleep(3000, 10000));
            
        }
        
        return cachedCandidate;
    }

    const _scrapeEmailAddress = (container) => {
        const emailSection = $(container).find(linkedInSelectors.contactInfoPage.EMAIL_SECTION);
        return $(emailSection).find('a').text().trim();
    }

    const _scrapePhoneNumber = (container) => {
        const phoneSection = $(container).find(linkedInSelectors.contactInfoPage.PHONE_SECTION);
        return $(phoneSection).find('span').first().text().trim();
    }

    class LinkedInContactInfoScraper {
        scrapeContactInfo = _scrapeContactInfo;
    }

    window.linkedInContactInfoScraper = new LinkedInContactInfoScraper();
})();