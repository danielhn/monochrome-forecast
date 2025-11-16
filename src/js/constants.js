export const storageKeys = {
    "locations": "locations",
    "activeLocation": "active-location",
    "cacheData": "cache-data",
    "configuration": "configuration"
}

export const defaultConfiguration = { "forecast_days": "7", "temperature_unit": "celsius", "wind_speed_unit": "kmh", "precipitation_unit": "mm", "theme": "light" };

export const ignoredOptions = ["theme"];

export const debounceWaitTime = 200;