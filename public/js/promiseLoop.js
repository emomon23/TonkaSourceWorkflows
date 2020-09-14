(() => {
    const _cleanUpArray = (arrayOfItems) => {
        //.filter should work. wtf!!!
        let cleanResult = [];
        arrayOfItems.forEach((item) => {
            if (item !== undefined && item !== null){
                if (Array.isArray(item) && item.length > 0) {
                    const cleanedInnerArray = _cleanUpArray(item);
                    cleanedInnerArray.forEach((innerItem) => {
                        cleanResult.push(innerItem);
                    })
                }
                else {
                    cleanResult.push(item);
                }
            }
        });
    
        return cleanResult;
    }
    
    window.promiseLoop = (enumerable, functionThatTakesArrayItemAndReturnsAPromise) => {
        return new Promise((resolve, reject) => {
            if (!enumerable){
                reject(new Error(`promiseLoop: 'enumerable' is undefined or null`));
                return null;
            }
           
            let array = enumerable;
            if(!isNaN(enumerable)){
                array = [];
                for(let i=0; i<enumerable; i++){
                    array.push(i);
                }
            }
    
            if (!Array.isArray(array)){
                reject(new Error(`promiseLoop: 'array' is not an array`));
                return null;
            }
           
            const promises = [];
            array.forEach((arrayItem) => {
                promises.push(functionThatTakesArrayItemAndReturnsAPromise(arrayItem));
            });
            
            return Promise.all(promises)
                .then((arrayOfWhateverGotResolvedInFuctionThatTakesArrayItem) => {
                    let results = [];
                    
                    if (arrayOfWhateverGotResolvedInFuctionThatTakesArrayItem) {
                        results = arrayOfWhateverGotResolvedInFuctionThatTakesArrayItem;
                        if (results.filter) {
                            results = results.filter(i => i? true: false);
                        }
                    } 
    
                    const cleanedUpArray = _cleanUpArray(arrayOfWhateverGotResolvedInFuctionThatTakesArrayItem);
                    resolve(cleanedUpArray);
                    return this;
                })
                .catch((e) => {
                    reject(e);
                })
        });      
    }
})();