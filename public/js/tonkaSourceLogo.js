(() => {
    const logoButtons = {}

    const _determineSizeFromSizeIndicator = (sizeIndicator) => {
        if (!isNaN((sizeIndicator))){
            return sizeIndicator; // it's already a number
        }

        let result = 24;

        switch (sizeIndicator.trim().toLowerCase()){
            case "small" :
                result = 48;
                break;
            case "medium":
            case "med":
                result = 70;
                break;
            case "large":
            case "lg":
            case "lrg":
            case "big":
                result = 95;
                break;
            case "huge":
                result = 125;
                break;
            default:
                result = 24;
                break;
        }

        return `${result}px`;
    }

    const _createImageElement = (classValue) => {
        // eg. attrsIndexTypeObject:  {id: '123', 'style': 'width: 15px, height: 19px'}

        const url = 'https://media-exp1.licdn.com/dms/image/C4E0BAQG13PuOrrmXTA/company-logo_100_100/0?e=1614211200&v=beta&t=mALyacgd2jO4--FlqqeP5ftGmI0FUsCRz6AJwuCq4rw';
        const element = document.createElement('img');
        const classAttribute = (classValue ? classValue + ' ' : '') + 'tonkaSourceLogo';

        $(element).attr('src', url).attr('class', classAttribute);
        return element;
    }

    _insertLogo = (container, sizeIndicator, id, classValue, toggle, initialOpacityBetweenZeroAndOne, shouldAppendTheLogo) => {
        const img = _createImageElement(classValue);

        if (toggle) {
            $(img).bind('click', (e) => {
                const eImg = e.target;
                let currentOpacity = $(eImg).css("opacity") || 1;
                currentOpacity = !isNaN(currentOpacity) ? Number.parseFloat(currentOpacity) : 1;

                const toOpacity = currentOpacity === 1 ? 0.5 : 1.0;
                const state = toOpacity === 1 ? "1" : "0";
                $(eImg).fadeTo(0, toOpacity).attr('state', state);

                const ownerId = $(eImg).attr('owner_id');
                if (ownerId){
                    logoButtons[ownerId] = toOpacity;
                }

                e.preventDefault();
                return false;
            })
        }

        if (shouldAppendTheLogo){
            $(container).append(img);
        }
        else {
            $(container).prepend(img);
        }


        const opacity = id && logoButtons[id] ? logoButtons[id] : initialOpacityBetweenZeroAndOne;

        const size = _determineSizeFromSizeIndicator(sizeIndicator);
        const style = `width:${size}; height:${size}; margin: 3px`;
        const state = opacity === 1 ? "1" : "0";

        $(img).attr('style', style).attr('state', state);

        if (id && id.length > 0){
            $(img).attr('owner_id', id);
            logoButtons[id] = opacity;
        }

       if (opacity < 1){
            $(img).fadeTo(0, opacity);

        }

        $(img).attr('state', opacity < 1 ? "0" : "1");
        return img;
    }

    _prependLogo = (container, sizeIndicator, id = null, classValue = null, toggle = true, initialOpacityBetweenZeroAndOne = 1) => {
        return _insertLogo(container, sizeIndicator, classValue, toggle, initialOpacityBetweenZeroAndOne, false);
    }

    _appendLogo = (container, sizeIndicator, id = null, classValue = null, toggle = true, initialOpacityBetweenZeroAndOne = 1) => {
        return _insertLogo(container, sizeIndicator, id, classValue, toggle, initialOpacityBetweenZeroAndOne, true);
    }

    class TonkaSourceLogo {
        prependLogo = _prependLogo;
        appendLogo =  _appendLogo;
       // createImageElement = _createImageElement
    }

    window.tonkaSourceLogo = new TonkaSourceLogo();

})();