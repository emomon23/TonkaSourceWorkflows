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
        button.id = `${buttonId}_button`;
        $(button).text(buttonText);
        button.setAttribute('style', `margin-left: 10px; height: ${height}px; width:${width}px`)

        $(`#${containerId}`).append(button);
        $(`#${buttonId}_button`).click(clickFunction);

        return $(button);
    }

    const _findDomElements = (selector) => {
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
   
        if (result !== null || $(startElement).parent().length === 0){
          return result;
        }
   
        return _findPreviousElement($(startElement).parent()[0], selector);
     }

     const _findFirstDomElement = (arrayOfSelectors) => {
         let result = null;

         for (let i=0; i<arrayOfSelectors.length; i++){
            result = _findDomElements(arrayOfSelectors[i]);
            if (result !== null){
                break;
            }
         }

         return result;
     }

    const _cleanseTextOfHtml = (text) => {
        const tempHtml = `<div>${text}</div>`;
        return $(tempHtml).text();
    }

    const _rebind = (selector, eventName, functionReference_NOT_AnAnonomousFunction) => {
        try {
            $(selector).unbind(eventName, functionReference_NOT_AnAnonomousFunction)
        }
        catch (unbindError){
            console.log("unbind error")
        }

        try {
            $(selector).bind(eventName, functionReference_NOT_AnAnonomousFunction);
        }
        catch (bindError){
            console.log("bind error");
        }
    }

    const _getWordCount = (baseElement, word) => {
        let count = 0;
        let index = 0;
    
        index = $(baseElement).text().indexOf(word);
        while(index >= 0){
          count+=1;
          index+= word.length;
          index = $(baseElement).text().indexOf(word, index);
        }
      
        return count;
    }

    const _scrollToBottom = () => {
        const scrollingElement = (document.scrollingElement || document.body);
        scrollingElement.scrollTop = scrollingElement.scrollHeight;
    }

    const _scrollTilTrue = async (callBack) => {
        const stepInterval = 50;
        const scrollingElement = (document.scrollingElement || document.body);
        const step = scrollingElement.scrollHeight / stepInterval;

        for(let i=0; i<stepInterval; i++){
            if (callBack() === true){
                break;
            }
            scrollingElement.scrollTop+= step;
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(300);
        }
    }

    const _saveItemLocally = (key, item) => {
        if (item){
            const json = typeof item === "string" ? item : JSON.stringify(item);
            window.localStorage.setItem(key, json);
        }

        return item;
    }

    const _getItemLocally = (key) => {
        const json = window.localStorage.getItem(key);
        let result = null;

        if (json && json.length > 0){
            try {
                result = JSON.parse(json);
            } catch (e) {
                if (e.message.indexOf("Unexpected token") >= 0){
                    return json;
                }

                throw e;
            }
        }

        return result;
    }
    class TsUICommon {
        constructor(){}

        createListItem = _createListItem;
        removeListItem = _removeListItem;
        addButton = _addButton;
        findDomElements = _findDomElements;
        findFirstDomElement = _findFirstDomElement;
        findPreviousElement = _findPreviousElement;
        cleanseTextOfHtml = _cleanseTextOfHtml;
        rebind = _rebind;
        getWordCount = _getWordCount;
        scrollToBottom = _scrollToBottom;
        scrollTilTrue = _scrollTilTrue;
        saveItemLocally = _saveItemLocally;
        getItemLocally = _getItemLocally;
    }

    window.tsUICommon = new TsUICommon();
})();


