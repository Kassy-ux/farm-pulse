import React from 'react';
import type { ForecastDay } from '../types';
import { conditionEmoji, formatForecastDate } from '../utils/advisories';

interface ForecastStripProps {
  forecastDays: ForecastDay[];
}

const ForecastStrip: React.FC<ForecastStripProps> = ({ forecastDays }) => {
  if (!forecastDays.length) {
    return null;
  }

  return (
    <div className="section">
      <h2 className="section__title">7-Day Forecast</h2>
      <div className="forecast-strip">
        {forecastDays.map((fd, idx) => {
          const { day, date } = formatForecastDate(fd.date);
          const emoji = conditionEmoji(fd.day.condition.code);
          const isToday = idx === 0;

          return (
            <div key={fd.date} className={`forecast-card ${isToday ? 'forecast-card--today' : ''}`}>
              <span className="forecast-card__day">{isToday ? 'Today' : day}</span>
              <span className="forecast-card__date">{date}</span>
              <span className="forecast-card__icon">{emoji}</span>
              <span className="forecast-card__condition">{fd.day.condition.text}</span>
              <div className="forecast-card__temps">
                <span className="forecast-card__high">{Math.round(fd.day.maxtemp_c)}°</span>
                <span className="forecast-card__low">{Math.round(fd.day.mintemp_c)}°</span>
              </div>
              {fd.day.daily_chance_of_rain > 20 && (
                <div className="forecast-card__rain">
                  💧 {fd.day.daily_chance_of_rain}%
                </div>
              )}
              <div className="forecast-card__bar">
                <div
                  className="forecast-card__rain-fill"
                  style={{ width: `${fd.day.daily_chance_of_rain}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastStrip;
