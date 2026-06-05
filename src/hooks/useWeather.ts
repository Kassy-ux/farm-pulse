import { useState, useEffect, useCallback } from 'react';
import { weatherClient } from '../utils/api';
import type { WeatherResponse, GeoLocation, LoadingState, AppError } from '../types';

interface UseWeatherReturn {
  weather: WeatherResponse | null;
  geo: GeoLocation | null;
  state: LoadingState;
  error: AppError | null;
  refetch: (lat?: number, lon?: number, geoOverride?: Partial<GeoLocation>) => void;
}

function locationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location permission was denied. Allow location access in your browser or search your city manually.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your current location is unavailable. Search your city manually or try again.';
  }

  if (error.code === error.TIMEOUT) {
    return 'Location detection timed out. Try again or search your city manually.';
  }

  return 'Could not detect your current location. Search your city manually.';
}

function getBrowserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support location detection. Search your city manually.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => reject(new Error(locationErrorMessage(error))),
      {
        enableHighAccuracy: true,
        maximumAge: 10 * 60 * 1000,
        timeout: 15000,
      }
    );
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<Partial<GeoLocation>> {
  const fallback = {
    city: 'Current Location',
    region: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
  };

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('zoom', '10');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en' },
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const address = data.address ?? {};
    const displayName = data.display_name?.split(',')[0];

    return {
      city:
        address.city ??
        address.town ??
        address.village ??
        address.municipality ??
        address.county ??
        displayName ??
        fallback.city,
      region: address.state ?? address.region ?? address.county ?? fallback.region,
      country: address.country_code?.toUpperCase() ?? address.country ?? '',
    };
  } catch {
    return fallback;
  }
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [geo, setGeo] = useState<GeoLocation | null>(null);
  const [state, setState] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);

  const fetchByCoords = useCallback(async (
    lat: number,
    lon: number,
    geoOverride?: Partial<GeoLocation>
  ) => {
    setState('loading');
    setError(null);
    try {
      const result = await weatherClient.getWeather(lat, lon, 7);
      const nextGeo = {
        lat,
        lon,
        city: geoOverride?.city ?? result.location.name,
        region: geoOverride?.region ?? result.location.region,
        country: geoOverride?.country ?? result.location.country,
      };

      setWeather({
        ...result,
        location: {
          ...result.location,
          name: nextGeo.city,
          region: nextGeo.region,
          country: nextGeo.country,
        },
      });
      setGeo(nextGeo);
      setState('success');
    } catch (err) {
      setError({ message: (err as Error).message });
      setState('error');
    }
  }, []);

  const fetchCurrentLocation = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const coords = await getBrowserLocation();
      const detectedGeo = await reverseGeocode(coords.lat, coords.lon);
      await fetchByCoords(coords.lat, coords.lon, detectedGeo);
    } catch (err) {
      setError({ message: (err as Error).message });
      setState('error');
    }
  }, [fetchByCoords]);

  const refetch = useCallback(
    (lat?: number, lon?: number, geoOverride?: Partial<GeoLocation>) => {
      if (lat !== undefined && lon !== undefined) {
        fetchByCoords(lat, lon, geoOverride);
      } else {
        fetchCurrentLocation();
      }
    },
    [fetchByCoords, fetchCurrentLocation]
  );

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  return { weather, geo, state, error, refetch };
}
