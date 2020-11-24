(() => {
    const sendInMailButtonSelectors = [
        'button[data-action*="inmail"]:contains("Send InMail")',
        'input[value*="Send InMail"][type*="button"]',
        'button[class*="cta-send-msg"]:contains("Send InMail")'
    ];

    const _getHeadline = (fullName) => {
        const divElement = $(`div[class*="entity-block profile"]:contains("${fullName}")`)[0];
        if (divElement){
            const headlineElement = $(divElement).find('p[class*="headline"]')[0];

            if (headlineElement){
                return $(headlineElement).text();
            }
        }

        return null;
    }

    const _getMemberId = async (fullName) => {
        let memberId = await linkedInRecruiterProfileScraper.getMemberId();

        if (!memberId){
            let li = $(`li:contains("${fullName}")`);
            if (li.length > 0){
                foundListItem = li.toArray().filter(i => $(i).attr('id') && $(i).attr('id').indexOf('search-result-') === 0);
                memberId = foundListItem && foundListItem.length > 0 ? $(foundListItem[0]).attr('id').replace('search-result-', '') : null;
            }
        }

        return memberId && !isNaN(memberId) ? memberId : null;
    }
    const _scrapeDialogContact = async (dialog) => {
        const span = $(dialog).find('span[class*="recipient-name"]')[0];
        if (!span){
            return null;
        }

        const fullName = $(span).text().replace("Delete recipient", '').split('\n')[0].trim();
        const memberId = await _getMemberId(fullName);
        const headline = _getHeadline(fullName);
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

        const result = {
            lastName,
            firstName
        };

        if (memberId){
            result.memberId = memberId
        }

        if (headline){
            result.headline = headline;
        }

        return result;
    }

    const _scrapeRecruiterInMailDialog = async (dialog) => {
        const candidate = await _scrapeDialogContact(dialog);
        const subject = $(dialog).find('input[name*="subject"]')[0];
        const textArea = $(dialog).find('textarea[class*="compose"]')[0];
        const sendButton = $(dialog).find('button[class*="inmail-send-btn"]')[0];
        const buttonContainer = $(dialog).find('#inmail-header')[0];

        return {
            candidate,
            subject,
            textArea,
            sendButton,
            header: buttonContainer
        };
    }

    const _sendInMail_OnClick = async (e) => {
        await tsCommon.sleep(1000);

        let found = $('div[class*="popup-dialog-wrapper"]')[0];  // aria-labelledby = inmail-header
        if (found){
            correspondenceCommon.setupSpy(found, _scrapeRecruiterInMailDialog)
        }
    }

    const _delayReady = async () => {
        await tsCommon.sleep(1000);

        sendInMailButtonSelectors.forEach((selector) => {
            $(selector).click(_sendInMail_OnClick);
        })
    }

    $(document).ready(() => {
        _delayReady();
    })

})();