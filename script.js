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

function displayWeather(data, container, isPrimary = false) {
    const location = data.location;
    const current = data.current;
    const forecast = data.forecast.forecastday;
    
    const locationName = isPrimary ? 'Текущее местоположение' : location.name;
    
    let forecastHTML = '';
    forecast.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
        
        forecastHTML += `
            <div class="forecast-day">
                <div class="day-name">${dayName}</div>
                <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
                <div class="temp">${Math.round(day.day.avgtemp_c)}°C</div>
                <div class="condition">${day.day.condition.text}</div>
            </div>
        `;
    });
    
    const weatherHTML = `
        <div class="location">${locationName}</div>
        <div class="current-weather">
            <img src="https:${current.condition.icon}" alt="${current.condition.text}" class="weather-icon">
            <div class="temp-large">${Math.round(current.temp_c)}°C</div>
            <div class="condition-text">${current.condition.text}</div>
        </div>
        <div class="details">
            <div class="detail-item">
                <span class="detail-label">Влажность:</span>
                <span class="detail-value">${current.humidity}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ветер:</span>
                <span class="detail-value">${current.wind_kph} км/ч</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ощущается как:</span>
                <span class="detail-value">${Math.round(current.feelslike_c)}°C</span>
            </div>
        </div>
        <div class="forecast-container">
            ${forecastHTML}
        </div>
    `;
    
    container.innerHTML = weatherHTML;
}
