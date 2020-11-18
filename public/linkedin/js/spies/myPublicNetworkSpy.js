(() => {
    const _firstNameLastNameListSelector = '[class*="mn-connection-card__name"]';
    const _recordConnectionRequestAcceptance = async () => {
        const namesElements = $(_firstNameLastNameListSelector);
        if (namesElements && namesElements.length){
            const namesArray = $(namesElements).toArray().map((c) => {
                const name = $(c).text().replace(/\\n/, '').trim();
                const parts = name.split(' ');
                if (parts.length < 2){
                    return null;
                }

                return {
                    firstName: parts[0],
                    lastName: parts[parts.length - 1]
                }
            });

            connectionLifeCycleLogic.recordConnectionRequestsAccepted(namesArray);
        }

    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.MY_CONNECTIONS_PUBLIC){
            _recordConnectionRequestAcceptance();
        }
    });
})();