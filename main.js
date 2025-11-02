import { getLocationFromLocalStorage, addLocationToLocalStorage, getForecastFromCache, writeRequestToCache, getLocationIdFromFirstLocation, getAllLocationsFromLocalStorage, getActiveLocation, setLocationAsActive, deleteLocationWithCache } from "./storage.js";
import { renderLocationData, renderHourlyWeather, renderDailyForecast, renderLocationsInSidebar } from "./render.js";

window.addEventListener("load", () => {
    const locations = getAllLocationsFromLocalStorage();
    if (locations) {
        renderLocationsInSidebar(locations)
        const activeLocation = getActiveLocation()
        fetchAndRenderLocation(activeLocation)
    }
});

async function fetchAndRenderLocation(locationId) {
    if (!locationId) {
        locationId = getLocationIdFromFirstLocation();
    }
    const location = getLocationFromLocalStorage(locationId);

    if (location) {
        document.getElementById("current-hour-container").classList.remove('d-none')
        document.getElementById("no-location-found-title").classList.add('d-none')

        renderLocationData(location);
        const currentHourWeather = await getWeatherForCurrentHour(location, locationId);
        renderHourlyWeather(currentHourWeather.current);
        const dailyForecast = await getDailyForecast(location, locationId);
        renderDailyForecast(dailyForecast.hourly);
    }
}

async function getWeatherForCurrentHour(location, locationId) {
    const cachedForecast = getForecastFromCache(locationId, 'currentForecast')
    
    if (cachedForecast) {
        return cachedForecast;
    } else {
        const forecast = await getWeatherForCurrentHourFromAPI(location.latitude, location.longitude);
        writeRequestToCache(forecast, locationId, 'currentForecast')
        return forecast;
    }
}

async function getWeatherForCurrentHourFromAPI(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&timezone=auto`;

    const request = await fetch(url);
    return await request.json();
}

async function getDailyForecast(location, locationId) {
    const cachedForecast = getForecastFromCache(locationId, 'dailyForecast');

    if (cachedForecast) {
        return cachedForecast;
    } else {
        const forecast = await getDailyForecastFromAPI(location.latitude, location.longitude);
        writeRequestToCache(forecast, locationId, 'dailyForecast', 3600000);
        return forecast;
    }
}

async function getDailyForecastFromAPI(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m&past_hours=0&timezone=auto`;

    const request = await fetch(url);
    return await request.json();
}

async function getSuggestionsFromLocationName(locationName) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${locationName}&count=10&language=en&format=json`;
    const request = await fetch(url);
    return await request.json();
}

const newLocationInput = document.getElementById("newLocation");
newLocationInput.addEventListener('keyup', async (key) => {
    const locationName = newLocationInput.value;
    console.log(locationName.length);

    // Avoid making requests to the geocoding API with zero or one character
    if (locationName.length >= 2) {
        const suggestions = await getSuggestionsFromLocationName(locationName);

        let listOfSuggestions = '';
        suggestions.results.forEach((suggestion) => {
            let fullLocationName;
            // Some suggestions don't have an admin1
            if (suggestion.admin1) {
                fullLocationName = `${suggestion.name} - ${suggestion.admin1}, ${suggestion.country}`;
            } else {
                fullLocationName = `${suggestion.name}, ${suggestion.country}`;
            }

            listOfSuggestions += `<button type='button' data-bs-dismiss="modal" data-latitude='${suggestion.latitude}' data-longitude='${suggestion.longitude}'  class='list-group-item list-group-item-action'>${fullLocationName}</button>`;
        });

        document.getElementById("search-suggestions").innerHTML = listOfSuggestions;
    } else {
        document.getElementById("search-suggestions").innerHTML = '';
    }

});

const searchSuggestionsContainer = document.getElementById("search-suggestions");
searchSuggestionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('list-group-item')) {
        const latitude = e.target.dataset.latitude;
        const longitude = e.target.dataset.longitude
        const name = e.target.innerText;
        const locationId = addLocationToLocalStorage(latitude, longitude, name)
        const locations = getAllLocationsFromLocalStorage();

        newLocationInput.value = '';
        searchSuggestionsContainer.innerHTML = '';

        renderLocationsInSidebar(locations)
        fetchAndRenderLocation(locationId)
    }
});

const locationsContainer = document.getElementById("locations-container");
locationsContainer.addEventListener('click', (e) => {
    console.log(e.target.parentElement.dataset.locationId);
    
    if (e.target.classList.contains('btn-secondary')) {
        const locationId = e.target.dataset.locationId;
        setLocationAsActive(locationId)
        fetchAndRenderLocation(locationId)
    } else if (e.target.classList.contains('btn-danger') || e.target.classList.contains('bi-x-circle-fill')) {
        let locationId;
        if (e.target.classList.contains('bi-x-circle-fill')) {
            locationId = e.target.parentElement.dataset.locationId;   
        } else {
            locationId = e.target.dataset.locationId;
        }

        deleteLocationWithCache(locationId)
        const locations = getAllLocationsFromLocalStorage();

        renderLocationsInSidebar(locations)
        fetchAndRenderLocation()
    }
});
