import weatherCodes from "./weatherCodes.js";
import { getSuggestionsFromLocationName } from "./fetcher.js";
import { debounceWaitTime } from "./constants.js";
import Toast from "bootstrap/js/dist/toast";

const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback(...args);
        }, wait);
    };
};

const renderLocationSuggestions = debounce(async () => {
    const locationName = document.getElementById("newLocation").value;

    // Avoid making requests to the geocoding API with zero or one characters
    if (locationName.length >= 2) {
        const suggestions = await getSuggestionsFromLocationName(locationName);

        if (suggestions.results) {
            let listOfSuggestions = '';
            suggestions.results.forEach((suggestion) => {
                let fullLocationName;
                // Some suggestions don't have an admin1
                if (suggestion.admin1) {
                    fullLocationName = `${suggestion.name} - ${suggestion.admin1}, ${suggestion.country}`;
                } else {
                    fullLocationName = `${suggestion.name}, ${suggestion.country}`;
                }

                listOfSuggestions += `<button type='button' data-bs-dismiss="modal" data-id="${suggestion.id}" data-latitude='${suggestion.latitude}' data-longitude='${suggestion.longitude}' class='list-group-item list-group-item-action list-group-item-light'>${fullLocationName}</button>`;
            });
            document.getElementById("search-suggestions").innerHTML = listOfSuggestions;
        } else {
            document.getElementById("search-suggestions").innerHTML = `<p class="list-group-item">No location found with that name</p>`;
        }
    } else {
        document.getElementById("search-suggestions").innerHTML = '';
    }
}, debounceWaitTime);

function toggleTheme(theme) {
    document.getElementsByTagName("html")[0].dataset.bsTheme = theme;
}

function showNoLocationFound() {
    document.getElementById("current-hour-container").classList.add('d-none');
    document.getElementById("status-container").classList.remove('d-none');
    document.getElementById("daily-forecast-container").classList.add('d-none');

    document.getElementById("status-text").innerHTML = `<p class="mb-5">Add a new location by clicking on the <i class="bi bi-geo-alt"><span class="visually-hidden">new location</span></i> icon in the navbar to display the forecast.</p>
    <p>Added locations are displayed by clicking on the <i class="bi bi-globe"><span class="visually-hidden">list of locations</span></i> icon.</p>`;
}

function renderLocationData(location) {
    document.getElementById("location-name").innerText = location.name;
}

function renderLocationsInSidebar(locations) {
    document.getElementById("locations-container").innerHTML = '';
    locations.forEach(locationId => {
        const location = JSON.parse(localStorage.getItem(locationId));
        document.getElementById("locations-container").innerHTML += `
            <li class="nav-item mb-2">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-secondary" data-location-id="${locationId}">${location.name}</button>
                    <button type="button" class="btn btn-dark" data-location-id="${locationId}" aria-label="Delete location"><i class="bi bi-x-lg fs-5"></i></button>
                </div>
            </li>`;
    });
}

function renderHourlyWeather(weather, units) {
    let icon = weatherCodes[weather.weather_code].icon;
    if (!weather.is_day && weatherCodes[weather.weather_code].icon_night) {
        icon = weatherCodes[weather.weather_code].icon_night;
    }
    document.getElementById('current-hour-weather-code').innerHTML = `<i class='${icon}'></i> ` + weatherCodes[weather.weather_code].description;
    document.getElementById('current-hour-temperature').innerText = `${weather.temperature_2m} ${units.temperature_2m} - Feels like ${weather.apparent_temperature} ${units.apparent_temperature}`;
    document.getElementById('current-hour-uv-index').innerText = `UV Index: ${weather.uv_index}`;
    document.getElementById('current-hour-humidity').innerText = `${weather.relative_humidity_2m}${units.relative_humidity_2m} humidity`;
    document.getElementById('current-hour-wind-speed').innerText = `Wind speed: ${weather.wind_speed_10m} ${units.wind_speed_10m}`;
    document.getElementById('current-hour-precipitation-probability').innerText = `Chance of rain: ${weather.precipitation_probability} ${units.precipitation_probability}`;
    document.getElementById('current-hour-precipitation').innerText = `Precipitation: ${weather.precipitation} ${units.precipitation}`;
}

async function renderDailyForecast(dailyForecast, units) {
    const dailyForecastContainer = document.getElementById("daily-forecast-container");
    dailyForecastContainer.innerHTML = '';
    let days = 0;
    for (let index = 0; index < dailyForecast.time.length; index++) {
        let date = new Date(dailyForecast.time[index]);
        if (date.getHours() == 0 || index == 0) {
            days++;
            const options = {
                weekday: "long",
                month: "long",
                day: "numeric"
            };
            const day = `<h2 id="title-day-${days}" class="pb-2 my-4 border-bottom border-black border-2">${date.toLocaleDateString(undefined, options)}</h2>`;
            dailyForecastContainer.innerHTML += day;
            dailyForecastContainer.innerHTML += `<div class="my-2 d-flex flex-row flex-nowrap overflow-auto" id="card-container-${days}"></div>`;
        }
        renderWeatherCard(dailyForecast, index, days, units);
    }
}

function renderWeatherCard(dailyForecast, hour, days, units) {
    const time = new Date(dailyForecast.time[hour]).toLocaleTimeString(undefined, { timeStyle: "short" });
    let icon = weatherCodes[dailyForecast.weather_code[hour]].icon;
    if (!dailyForecast.is_day[hour] && weatherCodes[dailyForecast.weather_code[hour]].icon_night) {
        icon = weatherCodes[dailyForecast.weather_code[hour]].icon_night;
    }
    const card = `<div class="card me-3 mb-4">
                    <div class="card-header pt-3">
                        <h2 class="card-title fs-3 text-center">${time}</h2>
                        <p class="text-center fs-3 mb-0"><i class='${icon}'></i> ${weatherCodes[dailyForecast.weather_code[hour]].description}</p>
                    </div>
                <div class="card-body p-0">
                    <ul class="list-group list-group-flush rounded-2">
                            <li class="list-group-item">
                                <i class="bi bi-thermometer"></i> ${dailyForecast.temperature_2m[hour]} ${units.temperature_2m} - Feels like ${dailyForecast.apparent_temperature[hour]} ${units.apparent_temperature}
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-sun"></i> UV Index: ${dailyForecast.uv_index[hour]}
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-moisture"></i> ${dailyForecast.relative_humidity_2m[hour]}${units.relative_humidity_2m} humidity
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-wind"></i> Wind speed: ${dailyForecast.wind_speed_10m[hour]} ${units.wind_speed_10m}
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-umbrella"></i> Chance of rain: ${dailyForecast.precipitation_probability[hour]}${units.precipitation_probability}
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-droplet"></i> Precipitation: ${dailyForecast.precipitation[hour]} ${units.precipitation}
                            </li>
                    </ul>
                </div>
            </div>`;
    document.getElementById(`card-container-${days}`).innerHTML += card;
}

function renderConfigurationStoredToModal(configuration) {
    document.getElementById("configurationForecastDays").value = configuration['forecast_days'];
    document.getElementById("configurationForecastDays").defaultValue = configuration['forecast_days'];

    document.getElementById("forecastDaysOutput").value = configuration['forecast_days'];
    document.getElementById("forecastDaysOutput").defaultValue = configuration['forecast_days'];

    const temperatureUnits = document.querySelectorAll('[name=temperature_unit]');

    for (let index = 0; index < temperatureUnits.length; index++) {
        if (temperatureUnits[index].value == configuration['temperature_unit']) {
            temperatureUnits[index].checked = true;
        }
    }

    const windSpeedUnits = document.querySelectorAll('[name=wind_speed_unit]');
    for (let index = 0; index < windSpeedUnits.length; index++) {
        if (windSpeedUnits[index].value == configuration['wind_speed_unit']) {
            windSpeedUnits[index].checked = true;
        }
    }

    const precipitationUnits = document.querySelectorAll('[name=precipitation_unit]');
    for (let index = 0; index < precipitationUnits.length; index++) {
        if (precipitationUnits[index].value == configuration['precipitation_unit']) {
            precipitationUnits[index].checked = true;
        }
    }

    const themes = document.querySelectorAll('[name=theme]');
    for (let index = 0; index < themes.length; index++) {
        if (themes[index].value == configuration['theme']) {
            themes[index].checked = true;
        }
    }
}

function renderToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById("toastMessage").innerText = message;
    const toastBootstrap = Toast.getOrCreateInstance(toast);
    toastBootstrap.show();
}

export { renderLocationData, renderHourlyWeather, renderDailyForecast, renderLocationsInSidebar, renderConfigurationStoredToModal, renderLocationSuggestions, toggleTheme, showNoLocationFound, renderToast };