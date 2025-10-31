function renderLocationData(location) {
    document.getElementById("location-name").innerText = location.name;
}

function renderHourlyWeather(weather) {
    const currentHour = new Date(weather.time).toLocaleTimeString();
    document.getElementById('current-hour-data-time').innerHTML = currentHour;
    document.getElementById('current-hour-weather-code').innerHTML = `<i class='${weatherCodes[weather.weather_code].icon}'></i> ` + weatherCodes[weather.weather_code].description;
    document.getElementById('current-hour-temperature').innerText = `${weather.temperature_2m}º C - Feels like ${weather.apparent_temperature}º C`;
    document.getElementById('current-hour-uv-index').innerText = `UV Index: ${weather.uv_index}`;
    document.getElementById('current-hour-humidity').innerText = `${weather.relative_humidity_2m}% humidity`;
    document.getElementById('current-hour-wind-speed').innerText = `${weather.wind_speed_10m} Km/h`;
    document.getElementById('current-hour-precipitation-probability').innerText = `${weather.precipitation_probability} %`;
    document.getElementById('current-hour-precipitation').innerText = `${weather.precipitation} mm`;
}

async function renderDailyForecast(dailyForecast) {
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
        renderWeatherCard(dailyForecast, index, days);
    }
}

function renderWeatherCard(dailyForecast, hour, days) {
    const date = new Date(dailyForecast.time[hour]).toLocaleTimeString();
    const card = `<div class="card me-3 mb-4">
                <div class="card-body">
                    <h2 class="card-title fs-3 text-center">${date}</h2>
                    <ul class="list-group list-group-flush">
                            <li class="list-group-item">
                                <i class="bi bi-thermometer"></i> ${dailyForecast.temperature_2m[hour]}º C - Feels like ${dailyForecast.apparent_temperature[hour]}º C
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-sun"></i> UV Index: ${dailyForecast.uv_index[hour]}
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-moisture"></i> ${dailyForecast.relative_humidity_2m[hour]}% humidity
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-wind"></i> ${dailyForecast.wind_speed_10m[hour]} Km/h
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-umbrella"></i> Chance of rain: ${dailyForecast.precipitation_probability[hour]}%
                            </li>
                            <li class="list-group-item">
                                <i class="bi bi-droplet"></i> Precipitation: ${dailyForecast.precipitation[hour]} mm
                            </li>
                    </ul>
                </div>
            </div>`;
    document.getElementById(`card-container-${days}`).innerHTML += card;
}

export {renderLocationData, renderHourlyWeather, renderDailyForecast}