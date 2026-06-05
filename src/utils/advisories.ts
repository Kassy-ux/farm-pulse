import type { WeatherResponse } from '../types';

export interface CropAdvisory {
  icon: string;
  title: string;
  message: string;
  severity: 'good' | 'caution' | 'warning';
}

/**
 * Derive practical crop advisories from the current weather + forecast data.
 * This logic interprets WeatherAI data into actionable farming recommendations.
 */
export function generateCropAdvisories(weather: WeatherResponse): CropAdvisory[] {
  const advisories: CropAdvisory[] = [];
  const { current, forecast } = weather;
  const forecastDays = forecast?.forecastday ?? [];
  const today = forecastDays[0]?.day;
  const tomorrow = forecastDays[1]?.day;

  // Rain advisory
  const rainChanceTomorrow = forecastDays[1]?.day?.daily_chance_of_rain ?? 0;
  const precipToday = today?.totalprecip_mm ?? 0;

  if (precipToday > 20) {
    advisories.push({
      icon: '🌧️',
      title: 'Heavy Rain Today',
      message: `${precipToday.toFixed(0)}mm expected. Avoid field operations — soil compaction risk is high. Hold off on fertilizer application.`,
      severity: 'warning',
    });
  } else if (rainChanceTomorrow > 70 && tomorrow) {
    advisories.push({
      icon: '🌦️',
      title: 'Rain Likely Tomorrow',
      message: `${rainChanceTomorrow}% rain probability. Complete any pesticide or fertilizer applications today for best uptake.`,
      severity: 'caution',
    });
  } else if (rainChanceTomorrow < 20) {
    advisories.push({
      icon: '💧',
      title: 'Dry Conditions Ahead',
      message: 'Low rain probability for the next 24 hours. Ensure irrigation is active for water-sensitive crops.',
      severity: 'caution',
    });
  }

  // Temperature advisory
  const maxTemp = today?.maxtemp_c ?? current.temp_c;
  const minTemp = today?.mintemp_c ?? current.temp_c;

  if (maxTemp > 35) {
    advisories.push({
      icon: '🌡️',
      title: 'Heat Stress Risk',
      message: `Peak temperature of ${maxTemp.toFixed(0)}°C expected. Irrigate in the early morning and evening. Shade-sensitive crops may need protection.`,
      severity: 'warning',
    });
  } else if (minTemp < 10) {
    advisories.push({
      icon: '❄️',
      title: 'Cold Night Ahead',
      message: `Temperature dropping to ${minTemp.toFixed(0)}°C. Cover frost-sensitive seedlings and young plants overnight.`,
      severity: 'warning',
    });
  } else {
    advisories.push({
      icon: '🌱',
      title: 'Favorable Growing Conditions',
      message: `Temperatures between ${minTemp.toFixed(0)}°C–${maxTemp.toFixed(0)}°C are ideal for most crops. Good day for planting or transplanting.`,
      severity: 'good',
    });
  }

  // Humidity / fungal disease advisory
  const humidity = current.humidity;
  if (humidity > 80) {
    advisories.push({
      icon: '🍄',
      title: 'High Fungal Disease Risk',
      message: `Humidity at ${humidity}%. Conditions favour fungal pathogens (blight, mildew). Inspect crops and apply preventive fungicide if needed.`,
      severity: 'warning',
    });
  } else if (humidity < 30) {
    advisories.push({
      icon: '🏜️',
      title: 'Low Humidity',
      message: `At ${humidity}% humidity, evapotranspiration is high. Increase irrigation frequency to prevent moisture stress.`,
      severity: 'caution',
    });
  }

  // Wind advisory
  const windKph = current.wind_kph;
  if (windKph > 40) {
    advisories.push({
      icon: '💨',
      title: 'Strong Wind Warning',
      message: `Winds at ${windKph.toFixed(0)} km/h. Avoid spraying — pesticide drift is a concern. Secure any polytunnel or greenhouse covers.`,
      severity: 'warning',
    });
  }

  // UV advisory
  if (current.uv >= 8) {
    advisories.push({
      icon: '☀️',
      title: 'High UV — Good Drying Day',
      message: `UV index ${current.uv}. Ideal for drying harvested grains or coffee. Protect yourself with sunscreen while working in the field.`,
      severity: 'good',
    });
  }

  // Spraying window
  const goodSprayDay =
    windKph < 20 && humidity < 70 && rainChanceTomorrow < 40;
  if (goodSprayDay) {
    advisories.push({
      icon: '🚿',
      title: 'Good Spraying Window',
      message: 'Low wind, moderate humidity, and little rain expected — optimal conditions for pesticide or foliar fertilizer application.',
      severity: 'good',
    });
  }

  return advisories;
}

/** Map a weather condition code to a large emoji icon */
export function conditionEmoji(code: number): string {
  if ([0, 1000].includes(code)) return '☀️';
  if ([1, 2, 1003].includes(code)) return '⛅';
  if ([3, 1006, 1009].includes(code)) return '☁️';
  if ([45, 48, 1030, 1135, 1147].includes(code)) return '🌫️';
  if (
    (code >= 51 && code <= 67) ||
    [80, 81, 82, 1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1243, 1246].includes(code)
  ) {
    return '🌧️';
  }
  if (
    (code >= 71 && code <= 77) ||
    [85, 86, 1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)
  ) {
    return '❄️';
  }
  if ([95, 96, 99, 1087, 1273, 1276, 1279, 1282].includes(code)) return '⛈️';
  if ([1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252].includes(code)) return '🌨️';

  return '🌤️';
}

/** Get wind direction as a cardinal label */
export function windLabel(dir: string): string {
  return dir;
}

/** Format a date string like "Monday, 3 Jun" */
export function formatForecastDate(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('en-KE', { weekday: 'short' }),
    date: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
  };
}
