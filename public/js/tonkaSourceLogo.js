(() => {

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

    const _createImageElement = (attrsIndexTypeObject = null) => {
        // eg. attrsIndexTypeObject:  {id: '123', 'style': 'width: 15px, height: 19px'}

        const url = 'https://media-exp1.licdn.com/dms/image/C4E0BAQG13PuOrrmXTA/company-logo_100_100/0?e=1614211200&v=beta&t=mALyacgd2jO4--FlqqeP5ftGmI0FUsCRz6AJwuCq4rw';
        const element = document.createElement('img');
        $(element).attr('src', url);

        if (attrsIndexTypeObject){
            for (let k in attrsIndexTypeObject){
                $(element).attr(k, attrsIndexTypeObject[k])
            }
        }

        return element;
    }

    _insertLogo = (container, sizeIndicator, toggle, initialOpacityBetweenZeroAndOne, shouldAppendTheLogo) => {
        let size = _determineSizeFromSizeIndicator(sizeIndicator);
        const attributes = {style: `width: ${size}, height: ${size}`};
        const img = _createImageElement(attributes);

        if (initialOpacityBetweenZeroAndOne < 1){
            $(img).fadeTo(initialOpacityBetweenZeroAndOne);
        }

        if (toggle) {
            $(img).bind('click', (e) => {
                const eImg = e.target;
                let currentOpacity = $(eImg).css("opacity") || 1;
                currentOpacity = !isNaN(currentOpacity) ? Number.parseFloat(currentOpacity) : 1;

                const toOpacity = currentOpacity === 1 ? 0.5 : 1.0;
                $(eImg).fadeTo(toOpacity);
            })
        }

        if (shouldAppendTheLogo){
            $(container).append(img);
        }
        else {
            $(container).prepend(img);
        }

        return img;
    }

    _prependLogo = (container, sizeIndicator, toggle = true, initialOpacityBetweenZeroAndOne = 1) => {
        return _insertLogo(container, sizeIndicator, toggle, initialOpacityBetweenZeroAndOne, false);
    }

    _appendLogo = (container, size) => {
        return _insertLogo(container, sizeIndicator, toggle, initialOpacityBetweenZeroAndOne, true);
    }

    class TonkaSourceLogo {
        prependLogo = _prependLogo;
        appendLogo = _appendLogo;
        createImageElement = _createImageElement
    }

    window.tonkaSourceLogo = new TonkaSourceLogo();
})()