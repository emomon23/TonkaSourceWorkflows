(() => {
    let _configRepo = null;
    let _tsConfigSettings = [];

    const _v1Configuration = async () => {
        const initialization_check_key = "v1-tonka-source-configuration-has-been-initialized";

        const initialized = await _configRepo.get(initialization_check_key);
        if (!initialized){
            await _addConfiguration('tsCompanyLogic.saveCompanyData', true);
            await _addConfiguration('tsCompanyLogic.whiteListedCompanies', '*');
            await _addConfiguration('tsCompanyLogic.blackListedCompanies', []);

            await _addConfiguration(initialization_check_key, true);
        }
    }

    const _initialize = async () => {
        await _v1Configuration();
        _tsConfigSettings = await _configRepo.getAll();
    }

    const _addConfiguration = async (key, value) => {
        const config = {
            name: key,
            value
        };

        await _configRepo.insert(config);
    }

    const TONKA_SOURCE_DATABASE = "TSConfiguration";
    const VERSION = 1;
    const SCHEMAS = [
        {
            storeName: 'configuration',
            idProperty: 'name',
            indexes: []
        }
    ]

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMAS);
    _configRepo = _storeFactory.createStore('configuration');
    _initialize();

    const _search = (name) => {
        const lowerName = name.toLowerCase();
        const found = _tsConfigSettings.filter((c) => { return c.name.toLowerCase().indexOf(lowerName) >= 0});
        return found;
    }

    const _get = (name) => {
        const lowerName = name.toLowerCase();
        const found = _tsConfigSettings.find((c) => { return c.name.toLowerCase() === lowerName});
        return found ? found.value : null;
    }

    const _set = (name, value) => {
        const lowerName = name.toLowerCase();

        let config = _tsConfigSettings.find((c) => { return c.name.toLowerCase() === lowerName});
        if (config){
            config.value = value;
            _configRepo.update(config);
        }
        else {
            config = {
                name,
                value
            };
            _configRepo.insert(config);
            _tsConfigSettings.push(config);
        }
    }

    class TSConfig {
        get = _get;
        set = _set;
        search = _search
    }

    window.tsConfig = new TSConfig();
})();