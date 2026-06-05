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

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [geo, setGeo] = useState<GeoLocation | null>(null);
  const [state, setState] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);

  const fetchByIP = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const result = await weatherClient.getWeatherByIP();
      setWeather(result.weather);
      setGeo(result.geo);
      setState('success');
    } catch (err) {
      setError({ message: (err as Error).message });
      setState('error');
    }
  }, []);

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

  const refetch = useCallback(
    (lat?: number, lon?: number, geoOverride?: Partial<GeoLocation>) => {
      if (lat !== undefined && lon !== undefined) {
        fetchByCoords(lat, lon, geoOverride);
      } else {
        fetchByIP();
      }
    },
    [fetchByIP, fetchByCoords]
  );

  useEffect(() => {
    fetchByIP();
  }, [fetchByIP]);

  return { weather, geo, state, error, refetch };
}
