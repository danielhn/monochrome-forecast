window.addEventListener("load", async () => {
    const location = getLocationFromLocalStorage()
    
    if (location) {
        renderLocationStored(location)
        const currentHourWeather = await getWeatherForCurrentHour(location.latitude, location.longitude)
        renderHourlyWeather(currentHourWeather.current)
        const dailyForecast = await getDailyForecast(location.latitude, location.longitude);
        renderDailyForecast(dailyForecast.hourly)
    }
    
});

function getLocationFromLocalStorage() {
    if (localStorage.getItem('location')) {
        return JSON.parse(localStorage.getItem('location'))
    } else {
        console.log('No location found stored');
    } 
}

function renderLocationStored(location) {
    document.getElementById("location-name").innerText = location.name
}

function renderHourlyWeather(weather) {
    document.getElementById('current-hour-weather-code').innerHTML = `<i class='${weatherCodes[weather.weather_code].icon}'></i> ` + weatherCodes[weather.weather_code].description
    document.getElementById('current-hour-temperature').innerText = `${weather.temperature_2m}º C - Feels like ${weather.apparent_temperature}º C`;
    document.getElementById('current-hour-uv-index').innerText = `UV Index: ${weather.uv_index}`;
    document.getElementById('current-hour-humidity').innerText = `${weather.relative_humidity_2m}% humidity`;
    document.getElementById('current-hour-wind-speed').innerText = `${weather.wind_speed_10m} Km/h`;
    document.getElementById('current-hour-precipitation-probability').innerText = `${weather.precipitation_probability} %`;
}

async function getWeatherForCurrentHour(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m`;

    const request = await fetch(url);
    return await request.json();
}

async function getDailyForecast(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,uv_index,apparent_temperature,precipitation_probability,wind_speed_10m`;

    const request = await fetch(url);
    return await request.json();
}

async function renderDailyForecast(dailyForecast) {
    let days = 1;
    for (let index = 0; index < dailyForecast.time.length; index++) {
        let date = new Date(dailyForecast.time[index])
        if (date.getHours() == 0) {
            const day = `<h2 id="first-day" class="my-4">${date.toLocaleDateString()}</h2>`;
            document.getElementById("daily-forecast-container").innerHTML += day
            document.getElementById("daily-forecast-container").innerHTML += `<div class="my-2 d-flex flex-row flex-nowrap overflow-auto" id="card-container-${days}"></div>`
            renderWeatherCards(dailyForecast, index, days)
            days++
        }
    }
}

function renderWeatherCards(dailyForecast, hour, days) {
    const hoursRenderedPerDay = 24;
    for (let index = 0; index < hoursRenderedPerDay; index++) {
        const date = new Date(dailyForecast.time[hour]).toLocaleTimeString()
        const card = `<div class="card">
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
                        </ul>
                    </div>
                </div>`;
        document.getElementById(`card-container-${days}`).innerHTML += card;
        hour++;
    }
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

        document.getElementById("search-suggestions").innerHTML = '';

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
        // console.log(e.target.innerHTML);
        // console.log(e.target.dataset.longitude);
        // console.log(e.target.dataset.latitude);
        const latitude = e.target.dataset.latitude;
        const longitude = e.target.dataset.longitude
        const name = e.target.innerText;
        document.getElementById("location-name").innerText = name;
        storeLocationInLocalStorage(latitude, longitude, name)
    }
});

function storeLocationInLocalStorage(latitude, longitude, name) {
    localStorage.setItem('location', JSON.stringify({'name': name, 'latitude': latitude, 'longitude': longitude}))
}
