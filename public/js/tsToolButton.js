(() => {
    const logoButtons = {}
    const hotAlison1 = 'https://media-exp1.licdn.com/dms/image/C5603AQGgXPHtgs48iQ/profile-displayphoto-shrink_200_200/0/1601927723954?e=1611792000&v=beta&t=l-_ZlBJTjDeHQueLnXzs6Okpy3Cj38GNbjvQoCt1dT4';
    const hotAlison2 = "https://media-exp1.licdn.com/dms/image/C5603AQEpqUf8haKy1Q/profile-displayphoto-shrink_200_200/0/1518888986180?e=1611792000&v=beta&t=okYYT6PiJt_A2LJSFKodUd0ntEe260e5van0v5ybHKM";
    const tonkaSourceLogo = "https://media-exp1.licdn.com/dms/image/C4E0BAQG13PuOrrmXTA/company-logo_100_100/0?e=1614211200&v=beta&t=mALyacgd2jO4--FlqqeP5ftGmI0FUsCRz6AJwuCq4rw";
    const mike = 'https://media-exp1.licdn.com/dms/image/C4E0BAQG13PuOrrmXTA/company-logo_100_100/0?e=1614211200&v=beta&t=mALyacgd2jO4--FlqqeP5ftGmI0FUsCRz6AJwuCq4rw';
    const joe = 'https://media-exp1.licdn.com/dms/image/C4E03AQHwWIm5Krpblw/profile-displayphoto-shrink_800_800/0/1532035891296?e=1611792000&v=beta&t=iQ_Wt1zfW3-OR6rkjd2wF5uqkWUFlEYCuLLkFtcEDa4';

    const _getButtonImageToUse = (imageName) => {
        let result = tonkaSourceLogo;

        switch (imageName){
            case "mike" :
                result = mike;
                break;
            case "joe" :
                result = joe;
                break;
            case "hotAlison1" :
                result = hotAlison1;
                break;
            case "hotAlison2" :
                result = hotAlison2;
                break;
        }

        return result;
    }

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

    const _createImageElement = (buttonImageName, classValue) => {
        // eg. attrsIndexTypeObject:  {id: '123', 'style': 'width: 15px, height: 19px'}

        const url = _getButtonImageToUse(buttonImageName);
        const element = document.createElement('img');
        const classAttribute = (classValue ? classValue + ' ' : '') + 'tonkaSource-image-button';

        $(element).attr('src', url).attr('class', classAttribute);
        return element;
    }

    const _insertButton = (container, sizeIndicator, buttonImage, id, classValue, toggle, initialOpacityBetweenZeroAndOne, shouldAppendTheLogo) => {
        const img = _createImageElement(buttonImage, classValue);
        $(img).attr('toggle', toggle ? '1' : '0');

        const imgContainer = document.createElement('span');
        $(imgContainer).append(img);

        $(imgContainer).bind('click', (e) => {
            const eImg = $(e.target).find('img');
            const toggle = $(eImg).attr('toggle') === '1' ? true : false;

            if (toggle){
                let currentOpacity = $(eImg).css("opacity") || 1;
                currentOpacity = !isNaN(currentOpacity) ? Number.parseFloat(currentOpacity) : 1;

                const toOpacity = currentOpacity === 1 ? 0.5 : 1.0;
                const state = toOpacity === 1 ? "1" : "0";
                $(eImg).fadeTo(0, toOpacity).attr('state', state);

                const ownerId = $(eImg).attr('owner_id');
                if (ownerId){
                    logoButtons[ownerId] = toOpacity // store the previous opacity;
                }
            }

            e.preventDefault();
            return false;
        })


        if (shouldAppendTheLogo){
            $(container).append(imgContainer);
        }
        else {
            $(container).prepend(imgContainer);
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
        return imgContainer;
    }

    const _prependButton = (container, sizeIndicator, buttonImage, id = null, classValue = null, toggle = true, initialOpacityBetweenZeroAndOne = 1) => {
        return _insertButton(container, sizeIndicator, buttonImage, id ,classValue, toggle, initialOpacityBetweenZeroAndOne, false);
    }

    const _appendButton = (container, sizeIndicator, buttonImage, id = null, classValue = null, toggle = true, initialOpacityBetweenZeroAndOne = 1) => {
        return _insertButton(container, sizeIndicator, buttonImage, id, classValue, toggle, initialOpacityBetweenZeroAndOne, true);
    }

    const _containsButton = (container, key) => {
        if (!(container && key)){
            return false;
        }

         const containsClass = $(container).find(`[class*="${key}"]`).length > 0;
         const containsOwner = $(container).find(`[owner_id*="${key}"]`).length > 0;

         let containsId = null;

         try {
             containsId = $(container).find(`#${key}`).length > 0;
         }catch {
             containsId = false;
         }

         return (containsClass || containsId || containsOwner);
    }
    class TsToolButton {
        prependButton = _prependButton;
        appendButton =  _appendButton;
        containsButton = _containsButton;
       // createImageElement = _createImageElement
    }

    window.tsToolButton = new TsToolButton();

})();