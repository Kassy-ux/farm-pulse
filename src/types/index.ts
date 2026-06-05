// WeatherAI API Types

export interface WeatherCondition {
  code: number;
  text: string;
  icon: string;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  uv: number;
  vis_km: number;
  precip_mm: number;
  condition: WeatherCondition;
  last_updated: string;
}

export interface DayForecast {
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  totalprecip_mm: number;
  avghumidity: number;
  maxwind_kph: number;
  uv: number;
  condition: WeatherCondition;
  daily_chance_of_rain: number;
}

export interface HourForecast {
  time: string;
  temp_c: number;
  condition: WeatherCondition;
  chance_of_rain: number;
  humidity: number;
  wind_kph: number;
}

export interface ForecastDay {
  date: string;
  day: DayForecast;
  hour: HourForecast[];
}

export interface Location {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface WeatherResponse {
  location: Location;
  current: CurrentWeather;
  forecast: {
    forecastday: ForecastDay[];
  };
  ai_summary?: string;
}

// Tree Analysis Types
export interface TreeHealth {
  healthy: number;
  needs_care: number;
  needs_replacement: number;
}

export interface CvDebug {
  orig_resolution: string;
  work_resolution: string;
  canopy_px: number;
  peaks_detected: number;
  after_area_filter: number;
}

export interface TreeAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  farmer_id?: string;
  county?: string;
  location?: string;
  land_acres?: number;
  total_tree_count: number;
  tree_density_per_acre?: number;
  confidence_score: number;
  canopy_coverage_pct: number;
  tree_health: TreeHealth;
  low_confidence: boolean;
  tree_species_guess?: string;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string;
  cv_debug: CvDebug;
}

// Usage Types
export interface UsageResponse {
  plan: string;
  requests_used: number;
  requests_limit: number;
  ai_requests_used: number;
  ai_requests_limit: number;
  period_start: string;
  period_end: string;
}

// App State Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AppError {
  message: string;
  status?: number;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
}
