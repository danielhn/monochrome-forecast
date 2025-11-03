import weatherCodes from "./weatherCodes.js";

function renderLocationData(location) {
    document.getElementById("location-name").innerText = location.name;
}

function renderLocationsInSidebar(locations) {
    document.getElementById("locations-container").innerHTML = '';
    locations.forEach(locationId => {
            const location = JSON.parse(localStorage.getItem(locationId))
            document.getElementById("locations-container").innerHTML += `
            <li class="nav-item mb-2">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-secondary" data-location-id="${locationId}">${location.name}</button>
                    <button type="button" class="btn btn-danger" data-location-id="${locationId}" aria-label="Delete location"><i class="bi bi-x-circle-fill"></i></button>
                </div>
            </li>`;
    });
}

function renderHourlyWeather(weather, units) {
    const currentHour = new Date(weather.time).toLocaleTimeString();
    document.getElementById('current-hour-data-time').innerHTML = currentHour;
    document.getElementById('current-hour-weather-code').innerHTML = `<i class='${weatherCodes[weather.weather_code].icon}'></i> ` + weatherCodes[weather.weather_code].description;
    document.getElementById('current-hour-temperature').innerText = `${weather.temperature_2m} ${units.temperature_2m} - Feels like ${weather.apparent_temperature} ${units.apparent_temperature}`;
    document.getElementById('current-hour-uv-index').innerText = `UV Index: ${weather.uv_index}`;
    document.getElementById('current-hour-humidity').innerText = `${weather.relative_humidity_2m}${units.relative_humidity_2m} humidity`;
    document.getElementById('current-hour-wind-speed').innerText = `${weather.wind_speed_10m} ${units.wind_speed_10m}`;
    document.getElementById('current-hour-precipitation-probability').innerText = `${weather.precipitation_probability} ${units.precipitation_probability}`;
    document.getElementById('current-hour-precipitation').innerText = `${weather.precipitation} ${units.precipitation}`;
}

async function renderDailyForecast(dailyForecast, units) {
    const dailyForecastContainer = document.getElementById("daily-forecast-container");
    dailyForecastContainer.innerHTML = '';
    let days = 0;
    for (let index = 0; index < dailyForecast.time.length; index++) {
        let date = new Date(dailyForecast.time[index]);
        if (date.getHours() == 0 || index == 0) {
            days++;
            const day = `<h2 id="first-day" class="my-4">${date.toLocaleDateString()}</h2>`;
            dailyForecastContainer.innerHTML += day;
            dailyForecastContainer.innerHTML += `<div class="my-2 d-flex flex-row flex-nowrap overflow-auto" id="card-container-${days}"></div>`;
        }
        renderWeatherCard(dailyForecast, index, days, units);
    }
}

function renderWeatherCard(dailyForecast, hour, days, units) {
    const date = new Date(dailyForecast.time[hour]).toLocaleTimeString();
    const card = `<div class="card me-3 mb-4">
                <div class="card-body">
                    <h2 class="card-title fs-3 text-center">${date}</h2>
                    <ul class="list-group list-group-flush">
                            <li class="list-group-item">
                                <i class='${weatherCodes[dailyForecast.weather_code[hour]].icon}'></i> ${weatherCodes[dailyForecast.weather_code[hour]].description}
                            </li>
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
                                <i class="bi bi-wind"></i> ${dailyForecast.wind_speed_10m[hour]} ${units.wind_speed_10m}
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

export { renderLocationData, renderHourlyWeather, renderDailyForecast, renderLocationsInSidebar}