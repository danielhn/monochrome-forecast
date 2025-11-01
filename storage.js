function getLocationIdFromFirstLocation() {
    const locations = localStorage.getItem('locations')
    if (locations) {
        return JSON.parse(localStorage.getItem('locations'))[0];
    } else {
        return false;
    }
}

function getLocationFromLocalStorage(locationId) {
    const locations = localStorage.getItem('locations')
    if (locations) {
        return JSON.parse(localStorage.getItem(locationId));
    } else {
        console.log('No location found stored');
        return false;
    }
}

function getAllLocationsFromLocalStorage() {
    const locations = localStorage.getItem('locations');
    if (localStorage.getItem('locations')) {
        return JSON.parse(locations);
    }
}

function addLocationToLocalStorage(latitude, longitude, name) {
    const locations = localStorage.getItem('locations')
    const locationId = crypto.randomUUID();

    if (locations) {
        const locationsArray = JSON.parse(locations)
        locationsArray.push(locationId)
        localStorage.setItem('locations', JSON.stringify(locationsArray));
    } else {
        localStorage.setItem('locations', JSON.stringify([locationId]));
    }

    localStorage.setItem(locationId, JSON.stringify({ 'name': name, 'latitude': latitude, 'longitude': longitude }));
    return locationId;
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
        let locationFound = false;

        for (let index = 0; index < cacheDataJSON.length; index++) {
            let cacheLocationId = Object.keys(cacheDataJSON[index]);
            if (cacheLocationId == locationId) {
                locationFound = true;
                cacheDataJSON[index][cacheLocationId].push(newCache);
                break;
            }            
        }

        if (!locationFound) {
            cacheDataJSON.push({[locationId]: [newCache]})
        }

        localStorage.setItem('cache-data', JSON.stringify(cacheDataJSON));
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

export { getLocationFromLocalStorage, getLocationIdFromFirstLocation, addLocationToLocalStorage, getForecastFromCache, writeRequestToCache, getAllLocationsFromLocalStorage };