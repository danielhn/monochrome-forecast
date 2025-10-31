function getLocationFromLocalStorage() {
    if (localStorage.getItem('location')) {
        return JSON.parse(localStorage.getItem('location'));
    } else {
        console.log('No location found stored');
    }
}

function storeLocationInLocalStorage(latitude, longitude, name) {
    localStorage.setItem('location', JSON.stringify({ 'name': name, 'latitude': latitude, 'longitude': longitude }));
}

function getForecastFromCache(locationID, cacheType) {
    const cacheData = localStorage.getItem('cache-data');
    let cacheId;
    if (cacheData) {
        const cacheDataJSON = JSON.parse(cacheData);

        for (let index = 0; index < cacheDataJSON.length; index++) {
            let cacheLocationId = Object.keys(cacheDataJSON[index]);

            if (cacheLocationId == locationID) {
                for (let i = 0; i < cacheDataJSON[index][cacheLocationId].length; i++) {
                    const element = cacheDataJSON[index][cacheLocationId][i];

                    if (element.type == cacheType) {
                        if (Date.now() < element.expires) {
                            cacheId = element.id;
                            return JSON.parse(localStorage.getItem(cacheId));
                        } else {
                            cacheDataJSON[index][cacheLocationId].splice(i, 1);
                            localStorage.setItem('cache-data', JSON.stringify(cacheDataJSON));
                            localStorage.removeItem(element.id)
                            return false;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function writeRequestToCache(request, locationId, cacheType, timeToExpire = 900000) {
    const cacheData = localStorage.getItem('cache-data');
    const cacheId = crypto.randomUUID();

    // 1 hour: 3600000 ms
    // 15 min: 900000 ms
    const expireTime = Date.now() + timeToExpire;
    const newCache = { 'id': cacheId, 'type': cacheType, 'expires': expireTime };

    localStorage.setItem(cacheId, JSON.stringify(request));

    if (cacheData) {
        const cacheDataJSON = JSON.parse(cacheData);

        cacheDataJSON.forEach((element, index) => {
            let cacheLocationId = Object.keys(element);
            if (cacheLocationId == locationId) {
                cacheDataJSON[index][cacheLocationId].push(newCache);

                localStorage.setItem('cache-data', JSON.stringify(cacheDataJSON));
            }
        });
    } else {
        // The square brackets that wrap locationId are needed to use the value of the variable, not the name
        const newCacheData = [{
            [locationId]: [
                newCache
            ]
        }];
        localStorage.setItem('cache-data', JSON.stringify(newCacheData));
    }
}


export {getLocationFromLocalStorage, storeLocationInLocalStorage, getForecastFromCache, writeRequestToCache};