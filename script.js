const API_KEY = '';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
