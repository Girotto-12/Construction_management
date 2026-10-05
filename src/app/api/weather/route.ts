import { NextResponse } from "next/server";
import { normalizeForecast, type Forecast } from "@/lib/weather";
export const dynamic = "force-dynamic";
let cached: Forecast | null = null;
let pending: Promise<Forecast> | null = null;
async function retrieve() {
  const options = {
    headers: {
      "User-Agent": "ObraClara/0.2 (Alpine weather preview)",
      Accept: "application/geo+json",
    },
    cache: "no-store" as const,
    signal: AbortSignal.timeout(10000),
  };
  const point = await fetch(
    "https://api.weather.gov/points/40.4533,-111.7780",
    options
  );
  if (!point.ok) throw Error("Weather unavailable");
  const location = await point.json();
  const url = new URL(location.properties.forecast);
  if (
    url.origin !== "https://api.weather.gov" ||
    !url.pathname.startsWith("/gridpoints/")
  )
    throw Error("Invalid weather endpoint");
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error("Weather unavailable");
  const data = normalizeForecast(await response.json());
  cached = data;
  return data;
}
export async function GET() {
  try {
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < 30 * 60 * 1000)
      return NextResponse.json(cached);
    if (!pending)
      pending = retrieve().finally(() => {
        pending = null;
      });
    return NextResponse.json(await pending);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar a previsão de Alpine." },
      { status: 503 }
    );
  }
}
