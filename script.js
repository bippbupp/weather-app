const API_KEY = 'b3386fee8a214576b23213606252612';
const API_BASE_URL = 'https://api.weatherapi.com/v1';

const primaryWeatherCard = document.getElementById('primaryWeatherCard');
const additionalCities = document.getElementById('additionalCities');
const refreshBtn = document.getElementById('refreshBtn');
const cityInput = document.getElementById('cityInput');
const addCityBtn = document.getElementById('addCityBtn');
const suggestions = document.getElementById('suggestions');
const cityError = document.getElementById('cityError');

const cityModal = document.getElementById('cityModal');
const modalCityInput = document.getElementById('modalCityInput');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');
const modalSuggestions = document.getElementById('modalSuggestions');
const modalCityError = document.getElementById('modalCityError');

let savedCities = [];
let primaryLocation = null;

async function fetchWeather(city, days = 3) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=${days}&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}

async function fetchWeatherByCoords(lat, lon, days = 3) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=${days}&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}
