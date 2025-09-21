// API Configuration
const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const weatherDisplay = document.getElementById('weather-display');
const liveClock = document.getElementById('live-clock');

// Weather Display Elements
const cityName = document.getElementById('city-name');
const countryName = document.getElementById('country-name');
const localTime = document.getElementById('local-time');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const uvIndex = document.getElementById('uv-index');
const airQuality = document.getElementById('air-quality');
const sunriseTime = document.getElementById('sunrise-time');
const sunsetTime = document.getElementById('sunset-time');
const forecastList = document.getElementById('forecast-list');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    startLiveClock();
    setupEventListeners();
    // Load default city (New York) on page load
    searchWeather('New York');
});

// Live Clock Function
function startLiveClock() {
    function updateClock() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        liveClock.textContent = now.toLocaleDateString('en-US', options);
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', getCurrentLocation);
    
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Handle Search
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        searchWeather(city);
    } else {
        showError('Please enter a city name');
    }
}

// Get Current Location
function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                searchWeatherByCoords(lat, lon);
            },
            function(error) {
                hideLoading();
                showError('Unable to get your location. Please search for a city manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

// Search Weather by City Name
async function searchWeather(city) {
    try {
        showLoading();
        hideError();
        
        const response = await fetch(`${API_BASE_URL}/weather/city/${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (response.ok) {
            displayWeather(data);
            getForecast(city);
        } else {
            showError(data.error || 'City not found. Please check the spelling and try again.');
        }
    } catch (error) {
        showError('Unable to connect to weather service. Please check your internet connection.');
        console.error('Error fetching weather data:', error);
    } finally {
        hideLoading();
    }
}

// Search Weather by Coordinates
async function searchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/coords/${lat}/${lon}`);
        const data = await response.json();
        
        if (response.ok) {
            displayWeather(data);
            getForecast(`${lat},${lon}`);
        } else {
            showError(data.error || 'Unable to get weather for your location.');
        }
    } catch (error) {
        showError('Unable to connect to weather service. Please check your internet connection.');
        console.error('Error fetching weather data:', error);
    } finally {
        hideLoading();
    }
}

// Get 5-Day Forecast
async function getForecast(location) {
    try {
        const response = await fetch(`${API_BASE_URL}/forecast/${encodeURIComponent(location)}`);
        const data = await response.json();
        
        if (response.ok) {
            displayForecast(data.list);
        }
    } catch (error) {
        console.error('Error fetching forecast data:', error);
    }
}

// Display Weather Data
function displayWeather(data) {
    // Update location info
    cityName.textContent = data.name;
    countryName.textContent = data.sys.country;
    
    // Update local time
    const localTimeObj = new Date((data.dt + data.timezone) * 1000);
    localTime.textContent = `Local time: ${localTimeObj.toLocaleTimeString()}`;
    
    // Update temperature
    temperature.textContent = Math.round(data.main.temp);
    feelsLike.textContent = Math.round(data.main.feels_like);
    
    // Update weather icon and description
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    weatherDescription.textContent = data.weather[0].description;
    
    // Update weather stats
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // Update sun times
    const sunrise = new Date((data.sys.sunrise + data.timezone) * 1000);
    const sunset = new Date((data.sys.sunset + data.timezone) * 1000);
    sunriseTime.textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunsetTime.textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Set default values for UV Index and Air Quality (not available in free API)
    uvIndex.textContent = 'N/A';
    airQuality.textContent = 'N/A';
    
    // Update input field
    cityInput.value = data.name;
    
    // Show weather display
    weatherDisplay.classList.remove('hidden');
}

// Display 5-Day Forecast
function displayForecast(forecastData) {
    forecastList.innerHTML = '';
    
    // Filter to get one forecast per day (around noon)
    const dailyForecasts = forecastData.filter((item, index) => {
        return index % 8 === 0; // Every 8th item (24 hours / 3 hours = 8)
    }).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = day.weather[0].icon;
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${day.weather[0].description}">
            <div class="forecast-description">${day.weather[0].description}</div>
            <div class="forecast-temps">
                <span class="forecast-high">${Math.round(day.main.temp_max)}°</span>
                <span class="forecast-low">${Math.round(day.main.temp_min)}°</span>
            </div>
        `;
        
        forecastList.appendChild(forecastItem);
    });
}

// Utility Functions
function showLoading() {
    loading.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// Background Animation based on Weather
function updateBackground(weatherType) {
    const body = document.body;
    body.className = ''; // Reset classes
    
    switch(weatherType) {
        case 'clear':
            body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            break;
        case 'clouds':
            body.style.background = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
            break;
        case 'rain':
            body.style.background = 'linear-gradient(135deg, #434343 0%, #000000 100%)';
            break;
        case 'snow':
            body.style.background = 'linear-gradient(135deg, #e6dedd 0%, #274046 100%)';
            break;
        case 'thunderstorm':
            body.style.background = 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)';
            break;
        default:
            body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}