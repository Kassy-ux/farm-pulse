import React from 'react';
import { Sprout, Loader, AlertTriangle } from 'lucide-react';
import { useWeather } from './hooks/useWeather';
import CurrentWeatherCard from './components/CurrentWeatherCard';
import ForecastStrip from './components/ForecastStrip';
import CropAdvisoryPanel from './components/CropAdvisoryPanel';
import TreeAnalyzer from './components/TreeAnalyzer';
import LocationSearch from './components/LocationSearch';

const App: React.FC = () => {
  const { weather, geo, state, error, refetch } = useWeather();
  const forecastDays = weather?.forecast?.forecastday ?? [];

  const currentLocationStr =
    geo ? [geo.city, geo.region || geo.country].filter(Boolean).join(', ') : 'Detecting location…';

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <Sprout size={28} />
          <span className="header__logo">FarmPulse</span>
        </div>
        <LocationSearch
          onSearch={(lat, lon, location) => refetch(lat, lon, location)}
          onAutoDetect={() => refetch()}
          isLoading={state === 'loading'}
          currentLocation={currentLocationStr}
        />
      </header>

      <main className="main">
        {/* Loading State */}
        {state === 'loading' && (
          <div className="fullscreen-state">
            <Loader size={40} className="spin" />
            <p>Loading weather for your location…</p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="fullscreen-state fullscreen-state--error">
            <AlertTriangle size={40} />
            <p>{error?.message ?? 'Failed to load weather data.'}</p>
            <button className="btn btn--primary" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        )}

        {/* No API Key Warning */}
        {!import.meta.env.VITE_WEATHERAI_API_KEY && state !== 'loading' && (
          <div className="api-key-banner">
            <AlertTriangle size={16} />
            <span>
              <strong>API key not set.</strong> Add <code>VITE_WEATHERAI_API_KEY=wai_your_key</code> to
              your <code>.env</code> file and restart the dev server.
            </span>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && weather && geo && (
          <>
            <CurrentWeatherCard weather={weather} geo={geo} />
            <ForecastStrip forecastDays={forecastDays} />
            <CropAdvisoryPanel weather={weather} />
            <TreeAnalyzer />
          </>
        )}
      </main>

      <footer className="footer">
        <span>Powered by <a href="https://weather-ai.co" target="_blank" rel="noopener noreferrer">WeatherAI API</a></span>
        <span>Built with ♥ by Stancy</span>
      </footer>
    </div>
  );
};

export default App;
