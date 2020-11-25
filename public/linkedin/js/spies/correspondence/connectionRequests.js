(() => {
    const addANoteSelector = `button[aria-label*="Add a note"]`;
    const sendNowSelector = `button[aria-label*="Send now"]`;
    const sendSelector = `button[aria-label*="Add a note"]`;

    const _handleConnectionRequest =  () => {
        const textArea = $(`#custom-message`)[0];
        const note = textArea ? $(textArea).val() : '';
        const profile = linkedInPublicProfileScraper.currentProfileLite;


    }
    const _listenForSendClick = (e) => {
        const element = e.target;

        if ($(element).text().trim() === "Send"){
            _handleConnectionRequest();
        }
    }

    const _delayReady = async () => {
        tsCommon.sleep(500);

        $('button[aria-label*="Connect with"][class*="connect"]').click(() => {
            $(document).click(_listenForSendClick);
        })
    }

    $(document).ready(() => {
        _delayReady();
    })
})();