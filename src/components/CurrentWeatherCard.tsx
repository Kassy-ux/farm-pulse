import React from 'react';
import { Droplets, Wind, Eye, Thermometer, MapPin } from 'lucide-react';
import type { WeatherResponse, GeoLocation } from '../types';
import { conditionEmoji } from '../utils/advisories';

interface CurrentWeatherCardProps {
  weather: WeatherResponse;
  geo: GeoLocation;
}

const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather, geo }) => {
  const { current } = weather;
  const emoji = conditionEmoji(current.condition.code);
  const locationLabel = [geo.city, geo.region || geo.country].filter(Boolean).join(', ');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="current-card">
      <div className="current-card__top">
        <div className="current-card__location">
          <MapPin size={16} />
          <span>{locationLabel}</span>
        </div>
        <div className="current-card__datetime">
          <span className="current-card__time">{timeStr}</span>
          <span className="current-card__date">{dateStr}</span>
        </div>
      </div>

      <div className="current-card__main">
        <span className="current-card__emoji">{emoji}</span>
        <div className="current-card__temp-block">
          <span className="current-card__temp">{Math.round(current.temp_c)}°</span>
          <span className="current-card__feels">
            Feels like {Math.round(current.feelslike_c)}°C
          </span>
          <span className="current-card__condition">{current.condition.text}</span>
        </div>
      </div>

      <div className="current-card__stats">
        <div className="stat">
          <Droplets size={18} />
          <span className="stat__value">{current.humidity}%</span>
          <span className="stat__label">Humidity</span>
        </div>
        <div className="stat">
          <Wind size={18} />
          <span className="stat__value">{Math.round(current.wind_kph)} km/h</span>
          <span className="stat__label">{current.wind_dir}</span>
        </div>
        <div className="stat">
          <Eye size={18} />
          <span className="stat__value">{current.vis_km} km</span>
          <span className="stat__label">Visibility</span>
        </div>
        <div className="stat">
          <Thermometer size={18} />
          <span className="stat__value">UV {current.uv}</span>
          <span className="stat__label">Index</span>
        </div>
      </div>

      {weather.ai_summary && (
        <div className="current-card__ai">
          <span className="ai-badge">✦ AI Summary</span>
          <p>{weather.ai_summary}</p>
        </div>
      )}
    </div>
  );
};

export default CurrentWeatherCard;
