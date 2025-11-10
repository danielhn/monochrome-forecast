import { addLocationToLocalStorage, getAllLocationsFromLocalStorage, getActiveLocation, setLocationAsActive, deleteLocationWithCache, storeConfiguration, getConfiguration, deleteCacheOfAllLocations } from "./storage.js";
import { renderLocationsInSidebar, renderConfigurationStoredToModal } from "./render.js";
import { fetchAndRenderLocation, getSuggestionsFromLocationName } from "./fetcher.js";
import { defaultConfiguration } from "./constants.js";

import 'bootstrap/js/dist/button';
import Modal from 'bootstrap/js/dist/modal';
import Offcanvas from 'bootstrap/js/dist/offcanvas';

window.addEventListener("load", () => {
    const locations = getAllLocationsFromLocalStorage();
    if (!getConfiguration()) {
        // Set default configuration if none is found
        storeConfiguration(defaultConfiguration)
    }
    if (locations) {
        renderLocationsInSidebar(locations)
        const activeLocation = getActiveLocation()
        fetchAndRenderLocation(activeLocation)
    }
});

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

// Locations offcanvas

const locationsContainer = document.getElementById("locations-container");
locationsContainer.addEventListener('click', (e) => {
    console.log(e.target.parentElement.dataset.locationId);
    
    if (e.target.classList.contains('btn-secondary')) {
        const locationId = e.target.dataset.locationId;
        setLocationAsActive(locationId)
        fetchAndRenderLocation(locationId)
        const locationsOffcanvas = Offcanvas.getInstance(document.getElementById("offcanvasNavbarLocations"))
        locationsOffcanvas.hide()
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

// Configuration

const rangeInput = document.getElementById('configurationForecastDays');
const rangeOutput = document.getElementById('forecastDaysOutput');

rangeOutput.textContent = rangeInput.value;

rangeInput.addEventListener('input', function () {
    rangeOutput.textContent = this.value;
});

const configurationForm = document.getElementById("configuration-form");
configurationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let newConfiguration = {};
    const forecastDays = document.getElementById("configurationForecastDays").value;

    newConfiguration['forecast_days'] = forecastDays;

    for (let index = 0; index < configurationForm.elements.length; index++) {
        const field = configurationForm.elements[index];
        if (field.checked) {
            newConfiguration[field.name] = field.value;

        }
    }

    storeConfiguration(newConfiguration);
    deleteCacheOfAllLocations();
    fetchAndRenderLocation();

    const configurationModal = Modal.getInstance(document.getElementById('configurationModal'));
    configurationModal.hide();
});

const configurationModal = document.getElementById('configurationModal');
configurationModal.addEventListener('show.bs.modal', () => {
    const configuration = getConfiguration();
    if (configuration) {
        renderConfigurationStoredToModal(configuration);
    }
});