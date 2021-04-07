(() => {
    const _renderHeader = (configs, headerClickCallback) => {
        const headersConfig = configs.headers;

        const grid = $(document.createElement('div')).attr('class', 'table');

        // Loop through headersConfig and create headers
        const headerRow = $(document.createElement('div')).attr('class', 'table-header');

        headersConfig.forEach((c) => {
            const header = $(document.createElement('div')).attr('class', 'table-header-cell').text(c.name);
            if (c.headerStyle) {
                header.attr('style', c.headerStyle);
            }

            $(header).click((e) => {
                if (headerClickCallback){
                    headerClickCallback(e);
                }
            });

            $(headerRow).append(header);
        });

        return  $(grid).append(headerRow);
    }

    const _renderDataGrid = async (grid, config, data) => {
        const headersConfig = config.headers;
        const keyProperty = config.keyProperty;
        const existingBody = $(grid).find('div[class*="table-body"]')[0];
        if (existingBody){
            $(existingBody).remove();
        }

        const tableBody = $(document.createElement('div')).attr('class', 'table-body');
        // Loop through Data and apply attributes to columns
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            const dataRow = $(document.createElement('div')).attr('class', 'table-row');
            if (keyProperty){
                $(dataRow).attr('key', dataRow[keyProperty]);
            }

            for (let j = 0; j < headersConfig.length; j++) {
                const c = headersConfig[j];
                const dataCell = $(document.createElement('div')).attr('class', 'table-cell')

                let propData = d[c.property];

                // If our data is an array, sort and explode it to a string
                if (Array.isArray(propData)) {
                    propData = propData.sort().join(', ');
                } else if (typeof propData === 'string' || propData instanceof String) {
                    // If our data begins with http, let's create a link and label it with the header title
                    if (propData.match(new RegExp('^http'))) {
                        propData = $(document.createElement('a')).attr('target', '_blank').attr('href', propData).text(c.linkName || c.name);
                    }
                }

                // Do we have a Load Handler to call?
                if (c.onLoadAsync) {
                    // eslint-disable-next-line no-await-in-loop
                    propData = await c.onLoadAsync(d);
                }
                if (c.onLoad) {
                    propData = c.onLoad(d);
                }

                $(dataCell).html(propData);
                $(dataRow).append(dataCell);
            }
            $(tableBody).append(dataRow);
        }

        return $(grid).append(tableBody);
    }

    const _findHeader = (headers, textClicked) => {
        let result = null;

        for (let i = 0; i < headers.length; i++){
            const h = headers[i];
            if (h.name === textClicked){
                result = h;
                break;
            }
        }

        return result;
    }

    class TSDataGrid {
        constructor (configs, data) {
            this.configs = configs;
            this.data = data;
            this.gridElement = _renderHeader(configs, this.sortColumn);
            _renderDataGrid(this.gridElement, configs, data);
        }

        sortColumn = async (e) => {
            const header = _findHeader(this.configs.headers, e.target.textContent);
            const desc = header.sort ? header.sort === 'desc' ? false : true : false;

            tsArray.sortByObjectProperty(this.data, header.property, desc);
            _renderDataGrid(this.gridElement, this.configs, this.data);

            this.configs.headers.forEach((h) => {
                h.sort = null;
            });

            header.sort = desc ? 'desc' : 'asc';
        }
    }

    window.tsGridFactory = {
        createGrid: (configs, data) => {
            return new TSDataGrid(configs, data);
        }
    }
})();