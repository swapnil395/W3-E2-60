from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# OpenWeatherMap API Configuration
# Get your free API key from: https://openweathermap.org/api
API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
BASE_URL = 'https://api.openweathermap.org/data/2.5'

if API_KEY == 'YOUR_API_KEY_HERE':
    logger.warning("Please set your OpenWeatherMap API key in the environment variable 'OPENWEATHER_API_KEY' or replace 'YOUR_API_KEY_HERE' in the code")

@app.route('/')
def home():
    return jsonify({
        'message': 'Weather API Server is running!',
        'endpoints': {
            'current_weather_by_city': '/weather/city/<city_name>',
            'current_weather_by_coords': '/weather/coords/<lat>/<lon>',
            'forecast': '/forecast/<location>',
            'health': '/health'
        }
    })

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/weather/city/<city_name>')
def get_weather_by_city(city_name):
    """Get current weather by city name"""
    try:
        # Make request to OpenWeatherMap API
        url = f"{BASE_URL}/weather"
        params = {
            'q': city_name,
            'appid': API_KEY,
            'units': 'metric'  # Use Celsius
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Successfully fetched weather for {city_name}")
            return jsonify(data)
        elif response.status_code == 404:
            logger.warning(f"City not found: {city_name}")
            return jsonify({'error': f'City "{city_name}" not found. Please check the spelling and try again.'}), 404
        elif response.status_code == 401:
            logger.error("Invalid API key")
            return jsonify({'error': 'API key is invalid. Please check your OpenWeatherMap API key.'}), 401
        else:
            logger.error(f"API request failed with status {response.status_code}")
            return jsonify({'error': 'Unable to fetch weather data. Please try again later.'}), 500
            
    except requests.exceptions.Timeout:
        logger.error("Request timeout")
        return jsonify({'error': 'Request timeout. Please try again.'}), 408
    except requests.exceptions.ConnectionError:
        logger.error("Connection error")
        return jsonify({'error': 'Unable to connect to weather service. Please check your internet connection.'}), 503
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500

@app.route('/weather/coords/<float:lat>/<float:lon>')
def get_weather_by_coords(lat, lon):
    """Get current weather by coordinates"""
    try:
        # Make request to OpenWeatherMap API
        url = f"{BASE_URL}/weather"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': API_KEY,
            'units': 'metric'  # Use Celsius
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Successfully fetched weather for coordinates ({lat}, {lon})")
            return jsonify(data)
        elif response.status_code == 400:
            logger.warning(f"Invalid coordinates: ({lat}, {lon})")
            return jsonify({'error': 'Invalid coordinates provided.'}), 400
        elif response.status_code == 401:
            logger.error("Invalid API key")
            return jsonify({'error': 'API key is invalid. Please check your OpenWeatherMap API key.'}), 401
        else:
            logger.error(f"API request failed with status {response.status_code}")
            return jsonify({'error': 'Unable to fetch weather data. Please try again later.'}), 500
            
    except requests.exceptions.Timeout:
        logger.error("Request timeout")
        return jsonify({'error': 'Request timeout. Please try again.'}), 408
    except requests.exceptions.ConnectionError:
        logger.error("Connection error")
        return jsonify({'error': 'Unable to connect to weather service. Please check your internet connection.'}), 503
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500

@app.route('/forecast/<location>')
def get_forecast(location):
    """Get 5-day weather forecast"""
    try:
        # Check if location is coordinates (lat,lon) or city name
        if ',' in location:
            # Coordinates format: "lat,lon"
            try:
                lat, lon = map(float, location.split(','))
                params = {
                    'lat': lat,
                    'lon': lon,
                    'appid': API_KEY,
                    'units': 'metric'
                }
            except ValueError:
                return jsonify({'error': 'Invalid coordinate format. Use "lat,lon" format.'}), 400
        else:
            # City name
            params = {
                'q': location,
                'appid': API_KEY,
                'units': 'metric'
            }
        
        # Make request to OpenWeatherMap API for 5-day forecast
        url = f"{BASE_URL}/forecast"
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Successfully fetched forecast for {location}")
            return jsonify(data)
        elif response.status_code == 404:
            logger.warning(f"Location not found: {location}")
            return jsonify({'error': f'Location "{location}" not found for forecast.'}), 404
        elif response.status_code == 401:
            logger.error("Invalid API key")
            return jsonify({'error': 'API key is invalid. Please check your OpenWeatherMap API key.'}), 401
        else:
            logger.error(f"Forecast API request failed with status {response.status_code}")
            return jsonify({'error': 'Unable to fetch forecast data. Please try again later.'}), 500
            
    except requests.exceptions.Timeout:
        logger.error("Forecast request timeout")
        return jsonify({'error': 'Request timeout. Please try again.'}), 408
    except requests.exceptions.ConnectionError:
        logger.error("Forecast connection error")
        return jsonify({'error': 'Unable to connect to weather service. Please check your internet connection.'}), 503
    except Exception as e:
        logger.error(f"Unexpected forecast error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred while fetching forecast. Please try again later.'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if API key is set
    if API_KEY == 'YOUR_API_KEY_HERE':
        print("\n" + "="*60)
        print("⚠️  IMPORTANT: API KEY SETUP REQUIRED")
        print("="*60)
        print("1. Get a free API key from: https://openweathermap.org/api")
        print("2. Set it as environment variable:")
        print("   export OPENWEATHER_API_KEY='your_actual_api_key'")
        print("3. Or replace 'YOUR_API_KEY_HERE' in app.py with your key")
        print("="*60 + "\n")
    
    print("🌤️  Weather API Server Starting...")
    print("📡 Server will run on: http://localhost:5000")
    print("🌍 Make sure to set up your OpenWeatherMap API key!")
    print("✅ CORS enabled for frontend access")
    
    app.run(debug=True, host='0.0.0.0', port=5000)