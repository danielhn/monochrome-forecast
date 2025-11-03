import { getLocationFromLocalStorage, addLocationToLocalStorage, getForecastFromCache, writeRequestToCache, getLocationIdFromFirstLocation, getAllLocationsFromLocalStorage, getActiveLocation, setLocationAsActive, deleteLocationWithCache, storeConfiguration, getConfiguration, deleteCacheOfAllLocations } from "./storage.js";
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
        renderHourlyWeather(currentHourWeather.current, currentHourWeather.current_units);
        const dailyForecast = await getDailyForecast(location, locationId);
        renderDailyForecast(dailyForecast.hourly, dailyForecast.hourly_units);
    }
}

async function getWeatherForCurrentHour(location, locationId) {
    const cachedForecast = getForecastFromCache(locationId, 'currentForecast')
    
    if (cachedForecast) {
        return cachedForecast;
    } else {
        const configuration = getConfiguration()
        const forecast = await getWeatherForCurrentHourFromAPI(location.latitude, location.longitude, configuration['wind_speed_unit'], configuration['temperature_unit'], configuration['precipitation_unit']);
        writeRequestToCache(forecast, locationId, 'currentForecast')
        return forecast;
    }
}

async function getWeatherForCurrentHourFromAPI(latitude, longitude, windSpeedUnit = 'kms', temperatureUnit = 'celsius', precipitationUnit = 'mm') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&timezone=auto&wind_speed_unit=${windSpeedUnit}&temperature_unit=${temperatureUnit}&precipitation_unit=${precipitationUnit}`;

    const request = await fetch(url);
    return await request.json();
}

async function getDailyForecast(location, locationId) {
    const cachedForecast = getForecastFromCache(locationId, 'dailyForecast');

    if (cachedForecast) {
        return cachedForecast;
    } else {
        const configuration = getConfiguration()
        let forecast = await getDailyForecastFromAPI(location.latitude, location.longitude, configuration['forecast_days'], configuration['wind_speed_unit'], configuration['temperature_unit'], configuration['precipitation_unit']);
        forecast = hidePastHoursInForecast(forecast)
        writeRequestToCache(forecast, locationId, 'dailyForecast', 3600000);
        return forecast;
    }
}

// The API supports a past_hour parameter, but if used at the moment (02/11/2025), it always returns a 16 day forecast,
// even if the forecast_days with another value is specified.
function hidePastHoursInForecast(forecast) {
    const currentHour = new Date(Date.now()).getHours()
    for (const key in forecast.hourly) {
        forecast.hourly[key].splice(0, currentHour)
    }
    return forecast;
}

async function getDailyForecastFromAPI(latitude, longitude, forecastDays = 7, windSpeedUnit = 'kms', temperatureUnit = 'celsius', precipitationUnit = 'mm') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&timezone=auto&forecast_days=${forecastDays}&wind_speed_unit=${windSpeedUnit}&temperature_unit=${temperatureUnit}&precipitation_unit=${precipitationUnit}`;

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

const rangeInput = document.getElementById('configurationForecastDays');
const rangeOutput = document.getElementById('forecastDaysOutput');

rangeOutput.textContent = rangeInput.value;

rangeInput.addEventListener('input', function () {
    rangeOutput.textContent = this.value;
});

const configurationForm = document.getElementById("configuration-form");
configurationForm.addEventListener("submit", (event) => {
    event.preventDefault()

    let newConfiguration = {}
    const forecastDays = document.getElementById("configurationForecastDays").value

    newConfiguration['forecast_days'] = forecastDays
    
    for (let index = 0; index < configurationForm.elements.length; index++) {
        const field = configurationForm.elements[index]
        if (field.checked) {
            newConfiguration[field.name] = field.value

        }
    }

    storeConfiguration(newConfiguration)
    deleteCacheOfAllLocations()
    fetchAndRenderLocation()

    const configurationModal = bootstrap.Modal.getInstance(document.getElementById('configurationModal'))
    configurationModal.hide()
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
