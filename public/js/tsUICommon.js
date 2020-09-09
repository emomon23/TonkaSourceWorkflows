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
   
    class TsUICommon {
        constructor(){}

        createListItem = _createListItem;
        removeListItem = _removeListItem;
        addButton = _addButton;
    }

    window.tsUICommon = new TsUICommon();
})();


