import React, { useState } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import type { GeoLocation } from '../types';

interface LocationSearchProps {
  onSearch: (lat: number, lon: number, location?: Partial<GeoLocation>) => void;
  onAutoDetect: () => void;
  isLoading: boolean;
  currentLocation: string;
}

interface GeocodeResult {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
}

// Simple geocoding using a public nominatim API (no key required)
async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'FarmPulse/1.0' },
  });
  const data = await res.json();
  if (!data.length) return null;

  const result = data[0];
  const address = result.address ?? {};
  const displayName = result.display_name?.split(',')[0] ?? query;

  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    city:
      address.city ??
      address.town ??
      address.village ??
      address.hamlet ??
      address.county ??
      displayName,
    region: address.state ?? address.region ?? address.county ?? '',
    country: address.country_code?.toUpperCase() ?? address.country ?? '',
  };
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onSearch,
  onAutoDetect,
  isLoading,
  currentLocation,
}) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setErr('');
    try {
      const coords = await geocodeLocation(query.trim());
      if (!coords) {
        setErr(`Location "${query}" not found`);
      } else {
        onSearch(coords.lat, coords.lon, {
          city: coords.city,
          region: coords.region,
          country: coords.country,
        });
        setQuery('');
      }
    } catch {
      setErr('Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="location-bar">
      <div className="location-bar__current">
        <MapPin size={14} />
        <span>{currentLocation}</span>
        {isLoading && <Loader size={12} className="spin" />}
      </div>
      <form className="location-bar__form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search location… (e.g. Nairobi, Bomet)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching || !query.trim()}>
          {searching ? <Loader size={16} className="spin" /> : <Search size={16} />}
        </button>
        <button type="button" className="auto-detect-btn" onClick={onAutoDetect} title="Auto-detect location">
          <MapPin size={16} />
        </button>
      </form>
      {err && <span className="location-bar__error">{err}</span>}
    </div>
  );
};

export default LocationSearch;
