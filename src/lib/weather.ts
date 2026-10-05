export const WEATHER_ZONE = "America/Denver";
export type WeatherDay = {
  date: string;
  high: number | null;
  low: number | null;
  chance: number | null;
  wind: number | null;
  condition: string;
  kind: string;
};
export type Forecast = {
  days: WeatherDay[];
  issuedAt: string;
  fetchedAt: string;
};
export function weatherCondition(text: string) {
  const t = text.toLowerCase();
  if (/thunder/.test(t)) return { condition: "Trovoadas", kind: "storm" };
  if (/freezing|sleet|ice/.test(t))
    return { condition: "Gelo / chuva congelante", kind: "snow" };
  if (/snow/.test(t))
    return {
      condition: /rain/.test(t) ? "Chuva e neve" : "Neve",
      kind: "snow",
    };
  if (/rain|shower|drizzle/.test(t))
    return { condition: "Chuva", kind: "rain" };
  if (/fog|mist/.test(t)) return { condition: "Neblina", kind: "fog" };
  if (/partly|mostly sunny/.test(t))
    return { condition: "Sol entre nuvens", kind: "partly" };
  if (/cloud|overcast/.test(t)) return { condition: "Nublado", kind: "cloud" };
  if (/sunny|clear/.test(t)) return { condition: "Céu aberto", kind: "sun" };
  return { condition: text || "Indisponível", kind: "cloud" };
}
export function normalizeForecast(raw: unknown, now = new Date()): Forecast {
  const p = (
    raw as {
      properties?: {
        generatedAt?: string;
        updateTime?: string;
        periods?: unknown[];
      };
    }
  )?.properties;
  if (
    !p?.generatedAt ||
    !Number.isFinite(Date.parse(p.generatedAt)) ||
    !Array.isArray(p.periods)
  )
    throw Error("Invalid forecast");
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: WEATHER_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const days: WeatherDay[] = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.parse(date + "T12:00:00Z") + i * 86400000)
      .toISOString()
      .slice(0, 10),
    high: null,
    low: null,
    chance: null,
    wind: null,
    condition: "Indisponível",
    kind: "unknown",
  }));
  const rank: Record<string, number> = {
    unknown: -1,
    sun: 0,
    partly: 1,
    cloud: 2,
    fog: 3,
    rain: 4,
    snow: 5,
    storm: 6,
  };
  let matched = 0;
  for (const value of p.periods) {
    const r = value as {
      startTime?: string;
      isDaytime?: boolean;
      temperature?: number;
      temperatureUnit?: string;
      shortForecast?: string;
      windSpeed?: string;
      probabilityOfPrecipitation?: { value?: number | null };
    };
    if (
      !r.startTime ||
      !Number.isFinite(Date.parse(r.startTime)) ||
      typeof r.temperature !== "number" ||
      !Number.isFinite(r.temperature) ||
      !["F", "C"].includes(r.temperatureUnit ?? "") ||
      typeof r.isDaytime !== "boolean"
    )
      continue;
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: WEATHER_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(r.startTime));
    const d = days.find(d => d.date === key);
    if (!d) continue;
    matched++;
    const temp =
      r.temperatureUnit === "C" ? (r.temperature * 9) / 5 + 32 : r.temperature;
    if (r.isDaytime) d.high = d.high === null ? temp : Math.max(d.high, temp);
    else d.low = d.low === null ? temp : Math.min(d.low, temp);
    const chance = r.probabilityOfPrecipitation?.value;
    if (
      typeof chance === "number" &&
      Number.isFinite(chance) &&
      chance >= 0 &&
      chance <= 100
    )
      d.chance = Math.max(d.chance ?? 0, chance);
    if (typeof r.windSpeed === "string" && r.windSpeed.includes("mph")) {
      const speeds = r.windSpeed.match(/\d+(?:\.\d+)?/g)?.map(Number);
      if (speeds?.length) d.wind = Math.max(d.wind ?? 0, ...speeds);
    }
    const c = weatherCondition(r.shortForecast ?? "");
    if (rank[c.kind] > rank[d.kind]) Object.assign(d, c);
  }
  if (!matched) throw Error("No current forecast");
  return {
    days,
    issuedAt:
      p.updateTime && Number.isFinite(Date.parse(p.updateTime))
        ? p.updateTime
        : p.generatedAt,
    fetchedAt: now.toISOString(),
  };
}
