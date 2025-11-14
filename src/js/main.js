import { addLocationToLocalStorage, getAllLocationsFromLocalStorage, getActiveLocation, setLocationAsActive, deleteLocationWithCache, storeConfiguration, getConfiguration, deleteCacheOfAllLocations, locationExists } from "./storage.js";
import { renderLocationsInSidebar, renderConfigurationStoredToModal, renderLocationSuggestions } from "./render.js";
import { fetchAndRenderLocation } from "./fetcher.js";
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
newLocationInput.addEventListener('keyup', renderLocationSuggestions);

const searchSuggestionsContainer = document.getElementById("search-suggestions");
searchSuggestionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('list-group-item')) {
        // This id is given by the geolocation API and is used to prevent duplicated locations.
        const id = e.target.dataset.id;
        if (!locationExists(id)) {
            const latitude = e.target.dataset.latitude;
            const longitude = e.target.dataset.longitude;
            const name = e.target.innerText;
            const locationId = addLocationToLocalStorage(latitude, longitude, name, id);
            const locations = getAllLocationsFromLocalStorage();

            newLocationInput.value = '';
            searchSuggestionsContainer.innerHTML = '';

            renderLocationsInSidebar(locations);
            fetchAndRenderLocation(locationId)    
        } else {
            console.log("Location " + id + " exists");
            
        }
    }
});

const newLocationModal = document.getElementById("addLocation")
newLocationModal.addEventListener('hide.bs.modal', () => {
    newLocationInput.value = '';
})

// Locations offcanvas

const locationsContainer = document.getElementById("locations-container");
locationsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-secondary')) {
        const locationId = e.target.dataset.locationId;
        setLocationAsActive(locationId)
        fetchAndRenderLocation(locationId)
        const locationsOffcanvas = Offcanvas.getInstance(document.getElementById("offcanvasNavbarLocations"))
        locationsOffcanvas.hide()
    } else if (e.target.classList.contains('btn-danger') || e.target.classList.contains('bi-x-lg')) {
        let locationId;
        if (e.target.classList.contains('bi-x-lg')) {
            locationId = e.target.parentElement.dataset.locationId;   
        } else {
            locationId = e.target.dataset.locationId;
        }

        deleteLocationWithCache(locationId)
        const locations = getAllLocationsFromLocalStorage();

        renderLocationsInSidebar(locations)
        const activeLocation = getActiveLocation()
        fetchAndRenderLocation(activeLocation)
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

    const storedConfiguration = storeConfiguration(newConfiguration);
    if (storedConfiguration) {
        deleteCacheOfAllLocations();
        fetchAndRenderLocation();
    }

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