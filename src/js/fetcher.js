import { renderLocationData, renderHourlyWeather, renderDailyForecast, showNoLocationFound, renderToast } from "./render.js";
import { getLocationFromLocalStorage, getForecastFromCache, writeRequestToCache, getLocationIdFromFirstLocation, getConfiguration } from "./storage.js";

export async function fetchAndRenderLocation(locationId) {
    if (!locationId) {
        locationId = getLocationIdFromFirstLocation();
    }
    
    const location = getLocationFromLocalStorage(locationId);
    
    if (location) {
        document.getElementById("current-hour-container").classList.remove('d-none');
        document.getElementById("status-container").classList.add('d-none');
        document.getElementById("daily-forecast-container").classList.remove('d-none');

        renderLocationData(location);
        const currentHourWeather = await getWeatherForCurrentHour(location, locationId);
        renderHourlyWeather(currentHourWeather.current, currentHourWeather.current_units);
        const dailyForecast = await getDailyForecast(location, locationId);
        renderDailyForecast(dailyForecast.hourly, dailyForecast.hourly_units);
    } else {
        showNoLocationFound()
    }
}

async function getWeatherForCurrentHour(location, locationId) {
    const cachedForecast = getForecastFromCache(locationId, 'currentForecast');

    if (cachedForecast) {
        return cachedForecast;
    } else {
        const configuration = getConfiguration();
        const forecast = await getWeatherForCurrentHourFromAPI(location.latitude, location.longitude, configuration['wind_speed_unit'], configuration['temperature_unit'], configuration['precipitation_unit']);
        writeRequestToCache(forecast, locationId, 'currentForecast');
        return forecast;
    }
}

async function getWeatherForCurrentHourFromAPI(latitude, longitude, windSpeedUnit = 'kms', temperatureUnit = 'celsius', precipitationUnit = 'mm') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,precipitation,weather_code,is_day,wind_speed_10m&timezone=auto&wind_speed_unit=${windSpeedUnit}&temperature_unit=${temperatureUnit}&precipitation_unit=${precipitationUnit}`;

    try {
        const request = await fetch(url);
        return await request.json();
    } catch (error) {
        renderToast("Could not retrieve current forecast. Check your connection and try again later.");
    }
}

async function getDailyForecast(location, locationId) {
    const cachedForecast = getForecastFromCache(locationId, 'dailyForecast');

    if (cachedForecast) {
        return cachedForecast;
    } else {
        const configuration = getConfiguration();
        let forecast = await getDailyForecastFromAPI(location.latitude, location.longitude, configuration['forecast_days'], configuration['wind_speed_unit'], configuration['temperature_unit'], configuration['precipitation_unit']);
        forecast = hidePastHoursInForecast(forecast);
        writeRequestToCache(forecast, locationId, 'dailyForecast', 3600000);
        return forecast;
    }
}

// The API supports a past_hour parameter, but if used at the moment (02/11/2025), it always returns a 16 day forecast,
// even if the forecast_days with another value is specified.
function hidePastHoursInForecast(forecast) {
    const currentHour = new Date(Date.now()).getHours();
    for (const key in forecast.hourly) {
        forecast.hourly[key].splice(0, currentHour);
    }
    return forecast;
}

async function getDailyForecastFromAPI(latitude, longitude, forecastDays = 7, windSpeedUnit = 'kms', temperatureUnit = 'celsius', precipitationUnit = 'mm') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,precipitation,weather_code,is_day,wind_speed_10m&timezone=auto&forecast_days=${forecastDays}&wind_speed_unit=${windSpeedUnit}&temperature_unit=${temperatureUnit}&precipitation_unit=${precipitationUnit}`;

    try {
        const request = await fetch(url);
        return await request.json();
    } catch (error) {
        renderToast("Could not retrieve daily forecast. Check your connection and try again later.")
    }
}

export async function getSuggestionsFromLocationName(locationName) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${locationName}&count=10&language=en&format=json`;
    try {
        const request = await fetch(url);
        return await request.json();
    } catch (error) {
        renderToast("Could not retrieve location suggestions. Check your connection and try again later.")
    }
}