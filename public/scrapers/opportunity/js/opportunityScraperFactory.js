(function() {
    const _getLocation = (city, state) => {
        if (state) {
            if (city) {
                return city + ", " + state;
            }
            return state
        }
        return city;
    }
    const _getScraper = () => {
        const url = ''; //get the url
        //If (url.indexOf('') >= 0)
        //   return __ts_starPublicScraper
        //}
        return __ts_starPartnerScraper;
    }

    const _getType = (type) => {
        const c = type.toLowerCase();
        if (c.indexOf('to hire') >= 0 || c.indexOf('c2h') >= 0 || c.indexOf('c 2 h') >= 0){
            return _type.C2H; 
        } else if (c.indexOf("contract") >= 0){
            return _type.CONTRACT;
        } else if ('fte full time full-time'.indexOf(c) >= 0){
            return _type.FTE;
        }
    }

    const _newOpportunity = (opp) => {
        
        var base = {
            company: {
                name: "",
                contact: ""
            },
            contact: "",
            dateCreated: "",
            description: "",
            jobNumber: "",
            location: "",
            partnerCompany: {
                name: "",
                contact: ""
            },
            source: "",
            status: _status.NEW,
            title: "",
            tsHighRate: "",
            tsLowRate: "",
            type: ""
        }

        return {
            ...base,
            ...opp
        }

    }

    const _partnerCompany = {
        WISEIT: {
            company: "Wise IT",
            contact: "Dan Wisniewski"
        },
        STAR: {
            company: "STAR Collaborative a LanceSoft Company",
            contact: "Cassandra Noyes"
        },
        STONEARCH: {
            company: "Stone Arch Services",
            contact: "Steve Grunlan"
        }
    }

    const _status = {
        NEW: "New",
        ACTIVE: "Active",
        IGNORE: "Ignore",
        ONHOLD: "On-Hold",
        CLOSED: "Closed"
    }

    const _type = {
        C2H: "C2H",
        CONTRACT: "Contract",
        FTE: "FTE"
    }

    class OpportunityScraperFactory {
        constructor(){}

        getLocation = _getLocation;
        getScraper = _getScraper;
        getType = _getType;
        newOpportunity = _newOpportunity;
        PartnerCompany = _partnerCompany;
        Status = _status;
        Type = _type;
    }

    window.opportunityScraperFactory = new OpportunityScraperFactory();
})();