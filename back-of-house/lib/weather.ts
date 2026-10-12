import type { Forecast } from "./types";
import { SAMPLE_FORECASTS } from "./menu-engine";

// WMO weather codes that mean rain, drizzle, showers or storms.
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

function describe(code: number, tempF: number): string {
  if (RAIN_CODES.has(code)) return tempF < 60 ? "Cool and rainy" : "Rainy";
  if (code >= 71 && code <= 77) return "Snowy";
  if (code === 0 || code === 1) return tempF >= 85 ? "Hot and sunny" : tempF <= 50 ? "Cold and clear" : "Clear";
  if (code === 45 || code === 48) return "Foggy";
  return "Cloudy";
}

/** Today's forecast from Open-Meteo (free, no key). Falls back to a sample day. */
export async function getForecast(): Promise<Forecast> {
  const lat = process.env.SHOP_LATITUDE;
  const lon = process.env.SHOP_LONGITUDE;
  if (!lat || !lon) return SAMPLE_FORECASTS.warm;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}` +
    `&daily=temperature_2m_max,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const tempF = Math.round(data.daily.temperature_2m_max[0]);
    const code = Number(data.daily.weather_code[0]);
    const rainChance = Number(data.daily.precipitation_probability_max?.[0] ?? 0);
    const rainy = RAIN_CODES.has(code) || rainChance >= 60;
    return { tempF, rainy, label: rainy && !RAIN_CODES.has(code) ? "Rain likely" : describe(code, tempF), source: "live" };
  } catch {
    return SAMPLE_FORECASTS.warm;
  }
}
