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
let debounceTimer = null;

async function fetchWeather(city, days = 3, skipCache = false) {
  try {
    const cacheParam = skipCache ? `&_t=${Date.now()}` : '';
    const response = await fetch(
      `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=${days}&aqi=no&lang=ru${cacheParam}`
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

async function fetchWeatherByCoords(lat, lon, days = 3, skipCache = false) {
  try {
    const cacheParam = skipCache ? `&_t=${Date.now()}` : '';
    const response = await fetch(
      `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=${days}&aqi=no&lang=ru${cacheParam}`
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

async function searchCities(query) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search.json?key=${API_KEY}&q=${query}&lang=ru`
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
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

async function loadPrimaryWeather(skipCache = false) {
  primaryWeatherCard.innerHTML = '<div class="loading">Загрузка...</div>';

  try {
    const savedPrimary = localStorage.getItem('primaryLocation');

    if (savedPrimary) {
      primaryLocation = JSON.parse(savedPrimary);

      if (primaryLocation.type === 'coords') {
        const data = await fetchWeatherByCoords(primaryLocation.lat, primaryLocation.lon, 3, skipCache);
        displayWeather(data, primaryWeatherCard, true);
      } else {
        const data = await fetchWeather(primaryLocation.city, 3, skipCache);
        displayWeather(data, primaryWeatherCard, false);
      }
    } else {
      try {
        const coords = await getUserLocation();
        primaryLocation = { type: 'coords', ...coords };
        localStorage.setItem('primaryLocation', JSON.stringify(primaryLocation));

        const data = await fetchWeatherByCoords(coords.lat, coords.lon, 3, skipCache);
        displayWeather(data, primaryWeatherCard, true);
      } catch (geoError) {
        cityModal.classList.add('show');
      }
    }
  } catch (error) {
    primaryWeatherCard.innerHTML = '<div class="error">Ошибка загрузки погоды</div>';
  }
}

async function showSuggestions(input, suggestionsContainer) {
  const value = input.value.trim();

  if (value.length < 2) {
    suggestionsContainer.classList.remove('show');
    return;
  }

  suggestionsContainer.innerHTML = '<div class="suggestions-loading">Поиск...</div>';
  suggestionsContainer.classList.add('show');

  const cities = await searchCities(value);

  if (cities.length === 0) {
    suggestionsContainer.innerHTML = '<div class="suggestions-loading">Ничего не найдено</div>';
    return;
  }

  suggestionsContainer.innerHTML = cities
    .map(city => {
      const name = city.name;
      const region = city.region ? `, ${city.region}` : '';
      const country = city.country ? `, ${city.country}` : '';
      return `<div class="suggestion-item" data-city="${name}">${name}${region}${country}</div>`;
    })
    .join('');

  suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      input.value = item.dataset.city;
      suggestionsContainer.classList.remove('show');
    });
  });
}

const debouncedShowSuggestions = debounce(showSuggestions, 500);

function validateCity(city) {
  if (!city || city.trim().length < 2) {
    return 'Введите название города';
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
    await loadPrimaryWeather(true);

    const cityCards = additionalCities.querySelectorAll('.weather-card');

    cityCards.forEach(card => {
      card.innerHTML = '<div class="loading">Загрузка...</div>';
    });

    const fetchPromises = Array.from(cityCards).map(async (card) => {
      const cityName = card.dataset.city;
      if (!cityName) return;

      try {
        const data = await fetchWeather(cityName, 3, true);
        displayWeather(data, card, false);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-city-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeCity(cityName, card));
        card.appendChild(removeBtn);
      } catch (error) {
        card.innerHTML = '<div class="error">Ошибка загрузки</div>';
      }
    });

    await Promise.all(fetchPromises);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Обновить';
  }
}

modalSubmitBtn.addEventListener('click', async () => {
  const cityName = modalCityInput.value.trim();

  const error = validateCity(cityName);
  if (error) {
    modalCityError.textContent = error;
    return;
  }

  modalSubmitBtn.disabled = true;
  modalCityError.textContent = '';
  primaryWeatherCard.innerHTML = '<div class="loading">Загрузка...</div>';

  try {
    const data = await fetchWeather(cityName);

    primaryLocation = { type: 'city', city: cityName };
    localStorage.setItem('primaryLocation', JSON.stringify(primaryLocation));

    displayWeather(data, primaryWeatherCard, false);

    cityModal.classList.remove('show');
    modalCityInput.value = '';
  } catch (error) {
    modalCityError.textContent = 'Город не найден';
    primaryWeatherCard.innerHTML = '';
  } finally {
    modalSubmitBtn.disabled = false;
  }
});

cityInput.addEventListener('input', function () {
  debouncedShowSuggestions(cityInput, suggestions);
});

modalCityInput.addEventListener('input', function () {
  debouncedShowSuggestions(modalCityInput, modalSuggestions);
});

addCityBtn.addEventListener('click', () => {
  const cityName = cityInput.value.trim();
  addCity(cityName);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const cityName = cityInput.value.trim();
    addCity(cityName);
  }
});

modalCityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    modalSubmitBtn.click();
  }
});

refreshBtn.addEventListener('click', refreshAllWeather);

document.addEventListener('click', (e) => {
  if (!e.target.closest('.city-input-wrapper')) {
    suggestions.classList.remove('show');
  }
  if (!e.target.closest('.modal-content')) {
    modalSuggestions.classList.remove('show');
  }
});

function loadSavedCities() {
  const saved = localStorage.getItem('savedCities');
  if (saved) {
    savedCities = JSON.parse(saved);

    const fetchPromises = savedCities.map(async (cityName) => {
      const cityCard = document.createElement('div');
      cityCard.className = 'weather-card';
      cityCard.dataset.city = cityName;
      cityCard.innerHTML = '<div class="loading">Загрузка...</div>';
      additionalCities.appendChild(cityCard);

      try {
        const data = await fetchWeather(cityName);
        displayWeather(data, cityCard, false);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-city-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeCity(cityName, cityCard));
        cityCard.appendChild(removeBtn);
      } catch (error) {
        cityCard.innerHTML = '<div class="error">Ошибка загрузки</div>';
      }
    });

    Promise.all(fetchPromises);
  }
}

async function init() {
  await loadPrimaryWeather();
  loadSavedCities();
}

document.addEventListener('DOMContentLoaded', init);
