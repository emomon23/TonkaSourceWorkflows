(() => {
    const _cardSelector = 'li[class*="mn-connection-card"]';
    const _firstNameLastNameListSelector = '[class*="mn-connection-card__name"]';
    const _occupationSelector = '[class*="mn-connection-card__occupation"]';
    const _imageSelector = 'img';

    const _scrapeConnectionsObject = () => {
        let cards = $(_cardSelector);
        if (!(cards && cards.length)){
            return [];
        }

        const result = [];
        cards = cards.toArray();
        cards.forEach((card) => {
            const nameElement = $(card).find(_firstNameLastNameListSelector)[0];
            const headlineElement = $(card).find(_occupationSelector)[0];
            let nameObject = null;

            if (nameElement){
                let name = $(nameElement).text().replace(/\\n/, '').trim();
                name = tsUICommon.cleanseTextOfHtml(name);
                const parts = name.split(' ');
                if (parts.length > 1 ){
                    nameObject = {
                        firstName: parts[0],
                        lastName: parts[parts.length - 1]
                    }
                }
            }

            if (nameObject){
                result.push(nameObject);
                if (headlineElement){
                    let headline = $(headlineElement).text().replace(/\\n/, '').trim();
                    headline = tsUICommon.cleanseTextOfHtml(headline);
                    nameObject.headline = headline;
                }

                const imgElement = $(card).find(_imageSelector)[0];
                if (imgElement){
                    nameObject.imgUrl = $(imgElement).attr('src');
                }
            }
        });

        return result;
    }

    const _recordConnectionRequestAcceptance = async () => {
        const nameObjects = _scrapeConnectionsObject();

        for (let i = 0; i < nameObjects.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await connectionLifeCycleLogic.recordConnectionRequestAccepted(nameObjects[i]);
        }
    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.MY_CONNECTIONS_PUBLIC){
            _recordConnectionRequestAcceptance();
        }
    });
})();