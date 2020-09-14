(function() {
    const _createListItem = (containerId, id, text) => {
        const li = document.createElement("li");
        li.id = `${id}_listItem`;
        li.innerHTML = text;
        $(`#${containerId}`).append(li);
        
        return $(li);
    }
    
    const _removeListItem = (id) => {
        let li = $(`#${id}_listItem`);
        if (li){
            $(li).remove();
        }
        else {
            li = $(`#${id}`);
            if (li){
                $(li).remove()
            }
        }
    }

    const _addButton = (containerId, buttonId, buttonText, height, width, clickFunction) => {
        const button = document.createElement("button");
        button.id = `${buttonId}_button`;;
        $(button).text(buttonText);
        button.setAttribute('style', `margin-left: 10px; height: ${height}px; width:${width}px`)

        $(`#${containerId}`).append(button);
        $(`#${buttonId}_button`).click(clickFunction);

        return $(button);
    }

    const _findDomElement = (selector) => {
        if ($(selector).length === 0){
            return null;
        }

        return $(selector);
    }
 
    const _findPreviousElement = (startElement, selector) => {
        let result = null;
        for(let i=0; i < $(startElement).siblings().length; i++){
            const sibling = $(startElement).siblings()[i];
            const found = $(sibling).find(selector);
            if (found.length > 0){
                result = found;
                break;
            }
        }
   
        if (result != null || $(startElement).parent().length == 0){
          return result;
        }
   
        return _findPreviousElement($(startElement).parent()[0], selector);
     }

     const _findFirstDomElement = (arrayOfSelectors) => {
         let result = null;

         for (let i=0; i<arrayOfSelectors.length; i++){
            result = _findDomElement(arrayOfSelectors[i]);
            if (result !== null){
                break;
            }
         }

         return result;
     }

    const _cleanseTextOfHtml = (text) => {
        const tempHtml = `<div>${text}</div>`;
        return $(textHtml).text();
    }

    class TsUICommon {
        constructor(){}

        createListItem = _createListItem;
        removeListItem = _removeListItem;
        addButton = _addButton;
        findDomElement = _findDomElement;
        findFirstDomElement = _findFirstDomElement;
        findPreviousElement = _findPreviousElement;
        cleanseTextOfHtml = _cleanseTextOfHtml;
    }

    window.tsUICommon = new TsUICommon();
})();


