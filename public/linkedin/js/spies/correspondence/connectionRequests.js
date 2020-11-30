(() => {
    const addANoteSelector = `button[aria-label*="Add a note"]`;
    const sendNowSelector = `button[aria-label*="Send now"]`;
    const sendSelector = `button[aria-label*="Add a note"]`;

    const _handleConnectionRequest =  async () => {
        try {
            const textArea = $(`#custom-message`)[0];
            const note = textArea ? $(textArea).val() : '';
            const profile = linkedInPublicProfileScraper.currentProfileLite;

            let noteTemplate = tsTemplateProcessor.convertToTemplate(note, profile);

            // in case we fat fingered a name
            noteTemplate = noteTemplate === note ? tsTemplateProcessor.convertToTemplate(note) : noteTemplate;

            if (await connectionLifeCycleLogic.saveConnectionRequest(noteTemplate, profile)){
                console.log("Connection Request saved to history")
            }

        }catch (e) {
            console.log(e);
        }

    }
    const _listenForSendClick = (e) => {
        const element = e.target;

        if ($(element).text().trim() === "Send"){
            const parent = $(element).parent();
            if (parent && $(parent).attr('aria-label').indexOf('Send now') >= 0) {
                _handleConnectionRequest();
            }
        }
    }

    const _delayReady = async () => {
        tsCommon.sleep(500);

        $('button[aria-label*="Connect with"]').click(() => {
            $(document).click(_listenForSendClick);
        })
    }

    $(document).ready(() => {
        _delayReady();
    })
})();