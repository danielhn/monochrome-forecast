window.addEventListener("load", async () => {
    const location = getLocationFromLocalStorage()
    
    if (location) {
        renderWeatherCards()
        renderLocationStored(location)
        const currentHourWeather = await getWeatherForCurrentHour(location.latitude, location.longitude)
        renderHourlyWeather(currentHourWeather.current)
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
    document.getElementById('current-hour-weather-code').innerText = weather.weather_code
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

function renderWeatherCards() {
    for (let index = 1; index <= 7; index++) {
        const card = `<div class="card">
                    <div class="card-body">
                        <h2 class="card-title fs-3 text-center">Day ${index}</h2>
                        <ul class="list-group list-group-flush">
                                <li class="list-group-item">
                                    <i class="bi bi-thermometer"></i> 25º C - Feels like 24º C
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-sun"></i> UV Index: 6
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-moisture"></i> 25 % humidity
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-wind"></i> 12 Km/h
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-umbrella"></i> Chance of rain: 43%
                                </li>
                        </ul>
                    </div>
                </div>`;
        document.getElementById("card-group").innerHTML += card;
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
            listOfSuggestions += `<button type='button' data-bs-dismiss="modal" data-latitude='${suggestion.latitude}' data-longitude='${suggestion.longitude}'  class='list-group-item list-group-item-action'>${suggestion.name} - ${suggestion.admin1}, ${suggestion.country}</button>`;
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