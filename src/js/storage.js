import { storageKeys, ignoredOptions } from "./constants.js";

function getLocationIdFromFirstLocation() {
    const locations = localStorage.getItem(storageKeys.locations)
    if (locations) {
        return JSON.parse(localStorage.getItem(storageKeys.locations))[0];
    } else {
        return false;
    }
}

function getActiveLocation() {
    return sessionStorage.getItem(storageKeys.activeLocation)
}

function setLocationAsActive(locationId) {
    sessionStorage.setItem(storageKeys.activeLocation, locationId)
}

function deleteActiveLocation(locationId) {
    if (locationId) {
        // If locationId is passed, check if the location is active. If it is, delete it.
        if (sessionStorage.getItem(storageKeys.activeLocation) == locationId) {
            sessionStorage.removeItem(storageKeys.activeLocation);
        }    
    } else {
        sessionStorage.removeItem(storageKeys.activeLocation);
    }
}

function getLocationFromLocalStorage(locationId) {
    const locations = localStorage.getItem(storageKeys.locations)
    if (locations) {
        return JSON.parse(localStorage.getItem(locationId));
    } else {
        return false;
    }
}

function getAllLocationsFromLocalStorage() {
    const locations = localStorage.getItem(storageKeys.locations);
    if (locations) {
        return JSON.parse(locations);
    }
}

function locationExists(id) {
    const locations = getAllLocationsFromLocalStorage()
    for (let index = 0; index < locations.length; index++) {
        const location = getLocationFromLocalStorage(locations[index])
        if (location.id == id) {
            return true;
        }
    }
    return false;
}

function addLocationToLocalStorage(latitude, longitude, name, id) {
    const locations = localStorage.getItem(storageKeys.locations)
    const locationId = crypto.randomUUID();

    if (locations) {
        const locationsArray = JSON.parse(locations)
        locationsArray.push(locationId)
        localStorage.setItem(storageKeys.locations, JSON.stringify(locationsArray));
    } else {
        localStorage.setItem(storageKeys.locations, JSON.stringify([locationId]));
    }

    localStorage.setItem(locationId, JSON.stringify({ 'name': name, 'latitude': latitude, 'longitude': longitude, 'id': id }));
    return locationId;
}

function getForecastFromCache(locationID, cacheType) {
    const cacheData = localStorage.getItem(storageKeys.cacheData);
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
                            localStorage.setItem(storageKeys.cacheData, JSON.stringify(cacheDataJSON));
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
    const cacheData = localStorage.getItem(storageKeys.cacheData);
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

        localStorage.setItem(storageKeys.cacheData, JSON.stringify(cacheDataJSON));
    } else {
        // The square brackets that wrap locationId are needed to use the value of the variable, not the name
        const newCacheData = [{
            [locationId]: [
                newCache
            ]
        }];
        localStorage.setItem(storageKeys.cacheData, JSON.stringify(newCacheData));
    }
}

function deleteCacheOfLocation(locationId) {
    const cacheData = JSON.parse(localStorage.getItem(storageKeys.cacheData));
    for (let index = 0; index < cacheData.length; index++) {
        let cacheLocationId = Object.keys(cacheData[index]);
        if (cacheLocationId == locationId) {

            for (let i = 0; i < cacheData[index][cacheLocationId].length; i++) {
                const cacheId = cacheData[index][cacheLocationId][i].id;
                localStorage.removeItem(cacheId);
            }

            cacheData.splice(index, 1);
            localStorage.setItem(storageKeys.cacheData, JSON.stringify(cacheData));
        }
    }
}

function deleteCacheOfAllLocations() {
    if (localStorage.getItem(storageKeys.cacheData)) {
        const cacheData = JSON.parse(localStorage.getItem(storageKeys.cacheData));
        for (let index = 0; index < cacheData.length; index++) {
            let cacheLocationId = Object.keys(cacheData[index]);

            for (let i = 0; i < cacheData[index][cacheLocationId].length; i++) {
                const cacheId = cacheData[index][cacheLocationId][i].id;
                localStorage.removeItem(cacheId);
            }

            cacheData.splice(index, 1);
            localStorage.setItem(storageKeys.cacheData, JSON.stringify(cacheData));
        }
    }
}

function deleteLocationData(locationId) {
    localStorage.removeItem(locationId);
}

function deleteLocationIdFromLocationsList(locationId) {
    const locations = JSON.parse(localStorage.getItem(storageKeys.locations));

    for (let index = 0; index < locations.length; index++) {
        if (locations[index] == locationId) {
            locations.splice(index, 1);
            localStorage.setItem(storageKeys.locations, JSON.stringify(locations));
            break;
        }
    }
}

function deleteLocationWithCache(locationId) {
    deleteCacheOfLocation(locationId)
    deleteLocationData(locationId)
    deleteLocationIdFromLocationsList(locationId)
    deleteActiveLocation(locationId)
}

function getConfiguration() {
    return JSON.parse(localStorage.getItem(storageKeys.configuration))
}

function storeConfiguration(newConfiguration) {
    const storedConfiguration = getConfiguration();
    if (storedConfiguration) {
        let optionsChanged = 0;
        // This allows to determine if changes in the options affect the data stored in cache, so in that case it can be refreshed.
        let refreshData = false;

        for (const option in storedConfiguration) {
            if (storedConfiguration[option] != newConfiguration[option]) {
                optionsChanged++;
                if (!ignoredOptions.includes(option)) {
                    refreshData = true;
                }
            }
        }
                
        if (optionsChanged > 0) {
            localStorage.setItem(storageKeys.configuration, JSON.stringify(newConfiguration));
        }

        return refreshData;
    } else {
        localStorage.setItem(storageKeys.configuration, JSON.stringify(newConfiguration));
        return false;
    }
}

export { getLocationFromLocalStorage, getLocationIdFromFirstLocation, addLocationToLocalStorage, getForecastFromCache, writeRequestToCache, getAllLocationsFromLocalStorage, getActiveLocation, setLocationAsActive, deleteLocationWithCache, storeConfiguration, getConfiguration, deleteCacheOfAllLocations, locationExists };