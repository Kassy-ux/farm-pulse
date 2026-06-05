import React from 'react';
import type { WeatherResponse } from '../types';
import { generateCropAdvisories, type CropAdvisory } from '../utils/advisories';

interface CropAdvisoryPanelProps {
  weather: WeatherResponse;
}

const severityClass: Record<CropAdvisory['severity'], string> = {
  good: 'advisory--good',
  caution: 'advisory--caution',
  warning: 'advisory--warning',
};

const CropAdvisoryPanel: React.FC<CropAdvisoryPanelProps> = ({ weather }) => {
  const advisories = generateCropAdvisories(weather);

  return (
    <div className="section">
      <h2 className="section__title">Crop Advisories</h2>
      <p className="section__subtitle">
        Derived from current conditions for {weather.location.name}
      </p>
      <div className="advisory-grid">
        {advisories.map((advisory, i) => (
          <div key={i} className={`advisory ${severityClass[advisory.severity]}`}>
            <div className="advisory__header">
              <span className="advisory__icon">{advisory.icon}</span>
              <span className="advisory__title">{advisory.title}</span>
              <span className="advisory__badge">{advisory.severity}</span>
            </div>
            <p className="advisory__message">{advisory.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropAdvisoryPanel;
