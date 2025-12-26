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

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            error => {
                reject(error);
            }
        );
    });
}

async function loadPrimaryWeather() {
    primaryWeatherCard.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const savedPrimary = localStorage.getItem('primaryLocation');
        
        if (savedPrimary) {
            primaryLocation = JSON.parse(savedPrimary);
            
            if (primaryLocation.type === 'coords') {
                const data = await fetchWeatherByCoords(primaryLocation.lat, primaryLocation.lon);
                displayWeather(data, primaryWeatherCard, true);
            } else {
                const data = await fetchWeather(primaryLocation.city);
                displayWeather(data, primaryWeatherCard, false);
            }
        } else {
            try {
                const coords = await getUserLocation();
                primaryLocation = { type: 'coords', ...coords };
                localStorage.setItem('primaryLocation', JSON.stringify(primaryLocation));
                
                const data = await fetchWeatherByCoords(coords.lat, coords.lon);
                displayWeather(data, primaryWeatherCard, true);
            } catch (geoError) {
                cityModal.classList.add('show');
            }
        }
    } catch (error) {
        primaryWeatherCard.innerHTML = '<div class="error">Ошибка загрузки погоды</div>';
    }
}

const popularCities = [
    'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
    'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
    'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград',
    'London', 'Paris', 'New York', 'Tokyo', 'Berlin',
    'Madrid', 'Rome', 'Amsterdam', 'Barcelona', 'Dubai'
];

function showSuggestions(input, suggestionsContainer) {
    const value = input.value.toLowerCase();
    
    if (value.length < 2) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value)
    );
    
    if (filtered.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    suggestionsContainer.innerHTML = filtered
        .map(city => `<div class="suggestion-item">${city}</div>`)
        .join('');
    
    suggestionsContainer.classList.add('show');
    
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            input.value = item.textContent;
            suggestionsContainer.classList.remove('show');
        });
    });
}

function validateCity(city) {
    if (!city || city.trim().length < 2) {
        return 'Введите название города';
    }
    
    if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(city)) {
        return 'Некорректное название города';
    }
    
    return null;
}

async function addCity(cityName) {
    const error = validateCity(cityName);
    if (error) {
        cityError.textContent = error;
        return;
    }
    
    if (savedCities.includes(cityName)) {
        cityError.textContent = 'Город уже добавлен';
        return;
    }
    
    if (savedCities.length >= 5) {
        cityError.textContent = 'Максимум 5 городов';
        return;
    }
    
    try {
        cityError.textContent = '';
        
        const cityCard = document.createElement('div');
        cityCard.className = 'weather-card';
        cityCard.dataset.city = cityName;
        cityCard.innerHTML = '<div class="loading">Загрузка...</div>';
        additionalCities.appendChild(cityCard);
        
        const data = await fetchWeather(cityName);
        
        displayWeather(data, cityCard, false);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-city-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeCity(cityName, cityCard));
        cityCard.appendChild(removeBtn);
        
        savedCities.push(cityName);
        localStorage.setItem('savedCities', JSON.stringify(savedCities));
        
        cityInput.value = '';
        suggestions.classList.remove('show');
        
    } catch (error) {
        cityError.textContent = 'Город не найден';
        const cityCard = additionalCities.querySelector(`[data-city="${cityName}"]`);
        if (cityCard) cityCard.remove();
    }
}

function removeCity(cityName, cardElement) {
    cardElement.remove();
    savedCities = savedCities.filter(city => city !== cityName);
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
}

async function refreshAllWeather() {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Обновление...';
    
    try {
        await loadPrimaryWeather();
        
        const cityCards = additionalCities.querySelectorAll('.weather-card');
        for (const card of cityCards) {
            const cityName = card.dataset.city;
            if (cityName) {
                card.innerHTML = '<div class="loading">Загрузка...</div>';
                
                try {
                    const data = await fetchWeather(cityName);
                    displayWeather(data, card, false);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-city-btn';
                    removeBtn.textContent = '×';
                    removeBtn.addEventListener('click', () => removeCity(cityName, card));
                    card.appendChild(removeBtn);
                } catch (error) {
                    card.innerHTML = '<div class="error">Ошибка загрузки</div>';
                }
            }
        }
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Обновить';
    }
}
