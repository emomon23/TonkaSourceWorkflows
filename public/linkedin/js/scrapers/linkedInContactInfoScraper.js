(() => {
    const _scrapeContactInfo = async (candidate) => {
        try {
            candidate.isContactInfoScraped = true;
            
            const contactInfoLink = $(linkedInSelectors.publicProfilePage.CONTACT_INFO_LINK);
            if (contactInfoLink.length === 0){
                return;
            }

            contactInfoLink[0].click();
            
            await tsCommon.waitTilTrue(() => {
                $(linkedInSelectors.contactInfoPage.CONTACT_INFO_CONTAINER) ? true : false;
            },5000);

            const contactInfoContainer = $(linkedInSelectors.contactInfoPage.CONTACT_INFO_CONTAINER);
            
            if (contactInfoContainer) {
                candidate.phone = _scrapePhoneNumber(contactInfoContainer[0]);
                candidate.email = _scrapeEmailAddress(contactInfoContainer[0]);
            } else {
                tsCommon.log("Contact Info Scraper: Could not find contact info container", "WARN");
            }
        
            $(linkedInSelectors.contactInfoPage.CLOSE).click();
        } catch (e) {
            tsCommon.log(e.message, 'WARN');
        }
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