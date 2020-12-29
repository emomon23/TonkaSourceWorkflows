(function () {
    const _copyToClipboard = async (value) => {
        const copyInput = document.createElement("input");
        $(copyInput).val(value)

        const parent = $(document).find('div')[0];
        $(parent).append(copyInput);

        await tsCommon.sleep(100);
        const v = $(copyInput).val();
        console.log({aa: 'executingCopy', v});

        $(copyInput).select((e) => {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
        });

        copyInput.select();
        await tsCommon.sleep(100);
        document.execCommand("copy");

        await tsCommon.sleep(100);
        $(copyInput).remove();
    }

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
        for(let i = 0; i < $(startElement).siblings().length; i++){
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

     const _findFirstDomElement = (selectors) => {
        const arrayOfSelectors = Array.isArray(selectors) ? selectors : [selectors];
        let result = null;

        for (let i = 0; i < arrayOfSelectors.length; i++){
            result = _findDomElements(arrayOfSelectors[i]);
            if (result !== null){
                break;
            }
        }

        return result;
     }

    const _cleanseTextOfHtml = (text) => {
        const tempHtml = `<div>${text}</div>`;
        let result = $(tempHtml).text();
        result = result.split("&amp;").join("&").split('&#x27;').join("'");

        return result;
    }

    const _createDataGrid = (configs, data) => {
        const grid = $(document.createElement('div')).attr('class', 'table');

        // Loop through configs and create headers
        const headerRow = $(document.createElement('div')).attr('class', 'table-header');
        configs.forEach((c) => {
            const header = $(document.createElement('div')).attr('class', 'table-header-cell').text(c.name);
            $(headerRow).append(header);
        });

        const tableBody = $(document.createElement('div')).attr('class', 'table-body');
        // Loop through Data and apply attributes to columns
        data.forEach((d) => {
            const dataRow = $(document.createElement('div')).attr('class', 'table-row');
            configs.forEach((c) => {
                const dataCell = $(document.createElement('div')).attr('class', 'table-cell')

                let propData = d[c.property];

                // If our data is an array, sort and explode it to a string
                if (Array.isArray(propData)) {
                    propData = propData.sort().join(', ');
                } else if (typeof propData === 'string' || propData instanceof String) {
                    // If our data begins with http, let's create a link and label it with the header title
                    if (propData.match(new RegExp('^http'))) {
                        propData = $(document.createElement('a')).attr('target', '_blank').attr('href', propData).text(c.name);
                    }
                }

                $(dataCell).html(propData);
                $(dataRow).append(dataCell);
            })
            $(tableBody).append(dataRow);
        });

        return $(grid).append(headerRow).append(tableBody);
    }

    const _createTooltip = (el, tooltipText) => {
        const tooltip = $(document.createElement("span"))
            .attr("class", "tooltiptext")
            .html(tooltipText);
        $(el).append(tooltip);
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
          count += 1;
          index += word.length;
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

        for(let i = 0; i < stepInterval; i++){
            if (callBack() === true){
                break;
            }
            scrollingElement.scrollTop += step;
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(300);
        }
    }

    const _saveItemLocally = (key, item) => {
        if (item !== null && item !== undefined){
            const json = (typeof item === "string" || typeof item === "boolean") ? item : JSON.stringify(item);
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

    const _executeDelete = async (element, times) => {
        $(element).focus()
        for (let i = 0; i < times; i++){
            document.execCommand('delete');
            tsCommon.sleep(20);
        }
    }

    const _notify = (msg) => {
        // lets use growl for this or some other toast?
        console.log(msg);
    }

    const _jQueryWait = async (selectors, maxWaitMS = 3000) => {
        const sleep = 100;
        const loops = maxWaitMS / sleep;

        let found = _findFirstDomElement(selectors);
        for (let i = 0; i < loops; i++){
            if (found && found.length > 0){
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.sleep(sleep);
                break;
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(sleep);
            found = _findFirstDomElement(selectors)
        }

        return found;
    }
    class TsUICommon {
        constructor (){}

        copyToClipboard = _copyToClipboard;
        createDataGrid = _createDataGrid;
        createListItem = _createListItem;
        createTooltip = _createTooltip;
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
        notify = _notify;
        getItemLocally = _getItemLocally;
        executeDelete = _executeDelete;
        jQueryWait = _jQueryWait;
    }

    window.tsUICommon = new TsUICommon();
})();


