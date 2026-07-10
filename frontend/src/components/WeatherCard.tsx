import React from 'react';
import { Cloud, Droplets, Wind, Sunrise, Sunset } from 'lucide-react';

interface WeatherProps {
  data: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
    location: string;
  };
}

export const WeatherCard: React.FC<WeatherProps> = ({ data }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h3 className="weather-location">{data.location}</h3>
        <div className="weather-temp-group">
          <img 
            src={`https://openweathermap.org/img/wn/${data.icon}.png`} 
            alt={data.description}
            className="weather-icon-img"
          />
          <span className="weather-temp">{Math.round(data.temp)}°C</span>
        </div>
      </div>
      
      <p className="weather-desc">{data.description}</p>
      
      <div className="weather-grid">
        <div className="weather-grid-item">
          <Wind className="weather-grid-icon" />
          <span>{data.wind_speed} m/s</span>
        </div>
        <div className="weather-grid-item">
          <Droplets className="weather-grid-icon" />
          <span>{data.humidity}%</span>
        </div>
        <div className="weather-grid-item">
          <Sunrise className="weather-grid-icon" />
          <span>{formatTime(data.sunrise)}</span>
        </div>
        <div className="weather-grid-item">
          <Sunset className="weather-grid-icon" />
          <span>{formatTime(data.sunset)}</span>
        </div>
      </div>
    </div>
  );
};
