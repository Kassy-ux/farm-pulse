import type {
  WeatherResponse,
  TreeAnalysisResponse,
  UsageResponse,
  GeoLocation,
} from '../types';

const BASE_URL = import.meta.env.VITE_WEATHERAI_BASE_URL ?? '/api/weatherai';

interface WeatherAIRawLocation {
  lat?: number;
  lon?: number;
  name?: string;
  region?: string;
  country?: string;
  timezone?: string;
  requested_lat?: number;
  requested_lon?: number;
}

interface WeatherAIRawCurrent {
  time?: string;
  temperature?: number;
  wind_speed?: number;
  wind_direction?: number | string;
  condition_code?: number | string;
  icon?: string;
  icon_path?: string;
}

interface WeatherAIRawHourly {
  time?: string;
  temperature?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  condition_code?: number | string;
  icon?: string;
  humidity?: number;
  feels_like?: number;
  uv_index?: number;
  icon_path?: string;
}

interface WeatherAIRawDaily {
  date?: string;
  temp_min?: number;
  temp_max?: number;
  precipitation_sum?: number;
  condition_code?: number | string;
  icon?: string;
  precipitation_probability?: number;
  wind_max?: number;
  icon_path?: string;
}

interface WeatherAIRawResponse {
  location?: WeatherAIRawLocation;
  current?: WeatherAIRawCurrent;
  hourly?: WeatherAIRawHourly[];
  daily?: WeatherAIRawDaily[];
  ai_summary?: string;
  summary?: string;
}

interface LocationFallback {
  lat?: number;
  lon?: number;
  name?: string;
  region?: string;
  country?: string;
}

function apiUrl(path: string): URL {
  const baseUrl = BASE_URL.startsWith('http')
    ? BASE_URL
    : `${window.location.origin}${BASE_URL}`;

  return new URL(`${baseUrl}${path}`);
}

const WMO_CONDITION_TEXT: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function toNumber(value: unknown, fallback = 0): number {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampPercentage(value: unknown): number {
  return Math.min(100, Math.max(0, Math.round(toNumber(value))));
}

function celsiusToFahrenheit(tempC: number): number {
  return (tempC * 9) / 5 + 32;
}

function average(values: number[], fallback = 0): number {
  const usable = values.filter(Number.isFinite);
  if (!usable.length) return fallback;
  return usable.reduce((total, value) => total + value, 0) / usable.length;
}

function max(values: number[], fallback = 0): number {
  const usable = values.filter(Number.isFinite);
  return usable.length ? Math.max(...usable) : fallback;
}

function conditionFrom(code: unknown, icon?: string) {
  const numericCode = Math.trunc(toNumber(code));

  return {
    code: numericCode,
    text: WMO_CONDITION_TEXT[numericCode] ?? 'Current conditions',
    icon: icon ?? '',
  };
}

function formatWindDirection(value: number | string | undefined): string {
  if (typeof value === 'string' && Number.isNaN(Number(value))) {
    return value;
  }

  const degrees = toNumber(value, Number.NaN);
  if (!Number.isFinite(degrees)) return 'N/A';

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % directions.length;
  return directions[index];
}

function findClosestHourly(
  hours: WeatherAIRawHourly[],
  targetTime?: string
): WeatherAIRawHourly | undefined {
  if (!hours.length) return undefined;

  const targetMs = targetTime ? Date.parse(targetTime) : Number.NaN;
  if (!Number.isFinite(targetMs)) return hours[0];

  return hours.reduce((closest, hour) => {
    const closestDiff = Math.abs(Date.parse(closest.time ?? '') - targetMs);
    const currentDiff = Math.abs(Date.parse(hour.time ?? '') - targetMs);
    return currentDiff < closestDiff ? hour : closest;
  }, hours[0]);
}

function normalizeHourly(hour: WeatherAIRawHourly) {
  return {
    time: hour.time ?? '',
    temp_c: toNumber(hour.temperature),
    condition: conditionFrom(hour.condition_code, hour.icon),
    chance_of_rain: clampPercentage(hour.precipitation_probability),
    humidity: Math.round(toNumber(hour.humidity)),
    wind_kph: toNumber(hour.wind_speed),
  };
}

function normalizeLocation(
  rawLocation: WeatherAIRawLocation | undefined,
  fallback: LocationFallback
) {
  const lat = toNumber(rawLocation?.lat, toNumber(rawLocation?.requested_lat, fallback.lat));
  const lon = toNumber(rawLocation?.lon, toNumber(rawLocation?.requested_lon, fallback.lon));
  const coordinateName =
    Number.isFinite(lat) && Number.isFinite(lon)
      ? `${lat.toFixed(2)}, ${lon.toFixed(2)}`
      : 'Current Location';

  return {
    name: rawLocation?.name ?? fallback.name ?? coordinateName,
    region: rawLocation?.region ?? fallback.region ?? rawLocation?.timezone ?? '',
    country: rawLocation?.country ?? fallback.country ?? '',
    lat,
    lon,
    localtime: new Date().toISOString(),
  };
}

function normalizeDaily(day: WeatherAIRawDaily, hours: WeatherAIRawHourly[]) {
  const date = day.date ?? '';
  const hoursForDay = hours.filter((hour) => hour.time?.startsWith(date));
  const minTemp = toNumber(day.temp_min);
  const maxTemp = toNumber(day.temp_max, minTemp);
  const avgTemp = average(
    hoursForDay.map((hour) => toNumber(hour.temperature, Number.NaN)),
    (minTemp + maxTemp) / 2
  );

  return {
    date,
    day: {
      maxtemp_c: maxTemp,
      mintemp_c: minTemp,
      avgtemp_c: avgTemp,
      totalprecip_mm: toNumber(day.precipitation_sum),
      avghumidity: Math.round(
        average(hoursForDay.map((hour) => toNumber(hour.humidity, Number.NaN)))
      ),
      maxwind_kph: toNumber(day.wind_max),
      uv: max(hoursForDay.map((hour) => toNumber(hour.uv_index, Number.NaN))),
      condition: conditionFrom(day.condition_code, day.icon),
      daily_chance_of_rain: clampPercentage(day.precipitation_probability),
    },
    hour: hoursForDay.map(normalizeHourly),
  };
}

function isInternalWeatherResponse(value: unknown): value is WeatherResponse {
  const candidate = value as Partial<WeatherResponse>;
  return Boolean(
    candidate?.location &&
      candidate.current &&
      Array.isArray(candidate.forecast?.forecastday)
  );
}

function normalizeWeatherResponse(
  rawWeather: WeatherAIRawResponse | WeatherResponse,
  fallback: LocationFallback = {}
): WeatherResponse {
  if (isInternalWeatherResponse(rawWeather)) {
    return rawWeather;
  }

  const raw = rawWeather as WeatherAIRawResponse;
  const hours = raw.hourly ?? [];
  const days = raw.daily ?? [];
  const currentHour = findClosestHourly(hours, raw.current?.time);
  const tempC = toNumber(raw.current?.temperature, toNumber(currentHour?.temperature));
  const currentCondition = conditionFrom(raw.current?.condition_code, raw.current?.icon);

  return {
    location: normalizeLocation(raw.location, fallback),
    current: {
      temp_c: tempC,
      temp_f: celsiusToFahrenheit(tempC),
      feelslike_c: toNumber(currentHour?.feels_like, tempC),
      humidity: Math.round(toNumber(currentHour?.humidity)),
      wind_kph: toNumber(raw.current?.wind_speed, toNumber(currentHour?.wind_speed)),
      wind_dir: formatWindDirection(raw.current?.wind_direction),
      uv: toNumber(currentHour?.uv_index),
      vis_km: 10,
      precip_mm: 0,
      condition: currentCondition,
      last_updated: raw.current?.time ?? new Date().toISOString(),
    },
    forecast: {
      forecastday: days.map((day) => normalizeDaily(day, hours)),
    },
    ai_summary: raw.ai_summary ?? raw.summary,
  };
}

class WeatherAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private ensureApiKey(): void {
    if (!this.apiKey.trim()) {
      throw new Error(
        'WeatherAI API key is missing. Add VITE_WEATHERAI_API_KEY in Netlify environment variables and redeploy.'
      );
    }
  }

  private get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    this.ensureApiKey();

    const url = apiUrl(path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), { headers: this.headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? `API error ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  /** Current weather + 7-day forecast by coordinates */
  async getWeather(lat: number, lon: number, days = 7): Promise<WeatherResponse> {
    const weather = await this.request<WeatherAIRawResponse>('/v1/weather', {
      lat: lat.toString(),
      lon: lon.toString(),
      days: days.toString(),
      ai: 'true',
      units: 'metric',
      lang: 'en',
    });

    return normalizeWeatherResponse(weather, {
      lat,
      lon,
      name: 'Selected Location',
    });
  }

  /** Auto-detect location from caller IP and return weather + geo headers */
  async getWeatherByIP(): Promise<{ weather: WeatherResponse; geo: GeoLocation }> {
    this.ensureApiKey();

    const url = apiUrl('/v1/weather-geo');
    url.searchParams.set('ip', 'auto');
    url.searchParams.set('days', '7');
    url.searchParams.set('units', 'metric');
    url.searchParams.set('ai', 'true');

    const res = await fetch(url.toString(), { headers: this.headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? `API error ${res.status}`);
    }

    const rawWeather = (await res.json()) as WeatherAIRawResponse;
    const weather = normalizeWeatherResponse(rawWeather, {
      lat: rawWeather.location?.lat,
      lon: rawWeather.location?.lon,
      name: res.headers.get('X-City') ?? undefined,
      region: res.headers.get('X-Region') ?? undefined,
      country: res.headers.get('X-Country') ?? undefined,
    });

    const geo: GeoLocation = {
      lat: weather.location.lat,
      lon: weather.location.lon,
      city: weather.location.name,
      region: weather.location.region,
      country: weather.location.country,
    };

    return { weather, geo };
  }

  /** Upload a farm image and analyze tree count + canopy health */
  async analyzeTrees(
    imageFile: File,
    options?: {
      farmerId?: string;
      county?: string;
      landAcres?: number;
      location?: string;
      notes?: string;
    }
  ): Promise<TreeAnalysisResponse> {
    this.ensureApiKey();

    const form = new FormData();
    form.append('image', imageFile);
    if (options?.farmerId) form.append('farmerId', options.farmerId);
    if (options?.county) form.append('county', options.county);
    if (options?.landAcres) form.append('landAcres', options.landAcres.toString());
    if (options?.location) form.append('location', options.location);
    if (options?.notes) form.append('notes', options.notes);

    const res = await fetch(apiUrl('/v1/trees/analyze').toString(), {
      method: 'POST',
      headers: this.headers,
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? `API error ${res.status}`);
    }

    return res.json() as Promise<TreeAnalysisResponse>;
  }

  /** Get remaining tree analysis quota */
  async getTreeQuota(): Promise<{ used: number; limit: number; remaining: number }> {
    return this.request('/v1/trees/quota');
  }

  /** Get API usage stats for current billing period */
  async getUsage(): Promise<UsageResponse> {
    return this.request<UsageResponse>('/v1/usage');
  }
}

// Singleton — swap in your actual key via env var
export const weatherClient = new WeatherAIClient(
  import.meta.env.VITE_WEATHERAI_API_KEY ?? ''
);

export default WeatherAIClient;
