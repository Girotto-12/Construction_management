"use client";
import { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
} from "lucide-react";
import { WEATHER_ZONE, type Forecast } from "@/lib/weather";
const icons = {
  sun: Sun,
  partly: CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};
export function WeatherWeek() {
  const [forecast, setForecast] = useState<Forecast | null>(null),
    [error, setError] = useState(false),
    [unit, setUnit] = useState<"F" | "C">("F"),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let stopped = false,
      busy = false;
    const controller = new AbortController();
    async function update() {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const r = await fetch("/api/weather", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!r.ok) throw Error();
        const data = await r.json();
        if (!stopped) {
          setForecast(data);
          setError(false);
        }
      } catch {
        if (!stopped) setError(true);
      } finally {
        busy = false;
      }
    }
    void update();
    const timer = setInterval(update, 30 * 60 * 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [attempt]);
  const temperature = (value: number | null) =>
    value === null
      ? "—"
      : Math.round(unit === "F" ? value : ((value - 32) * 5) / 9) + "°";
  const stamp = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: WEATHER_ZONE,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  const stale =
    forecast &&
    Date.now() - Date.parse(forecast.issuedAt) > 24 * 60 * 60 * 1000;
  return (
    <section className="panel weather-panel" aria-labelledby="weather-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TEMPO NA OBRA · PREVISÃO REAL</span>
          <h2 id="weather-title">Alpine, Utah · próximos 7 dias</h2>
          <p>
            Horário local de Utah · atualização automática a cada 30 minutos.
          </p>
        </div>
        <div className="segmented" aria-label="Unidade de temperatura">
          {(["F", "C"] as const).map(v => (
            <button
              key={v}
              aria-pressed={unit === v}
              className={unit === v ? "selected" : ""}
              onClick={() => setUnit(v)}
            >
              °{v}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p role="status" className="weather-message">
          Não foi possível atualizar.{" "}
          {forecast ? "Exibindo a última previsão consultada. " : ""}
          <button
            className="text-button"
            onClick={() => setAttempt(n => n + 1)}
          >
            Tentar novamente
          </button>
        </p>
      ) : null}
      {!forecast && !error ? (
        <p role="status">Consultando a previsão de Alpine…</p>
      ) : null}
      {forecast ? (
        <>
          <div
            className="weather-color-legend"
            aria-label="Legenda das cores da previsão"
          >
            <span>
              <i className="weather-good" />
              Favorável
            </span>
            <span>
              <i className="weather-attention" />
              Atenção
            </span>
            <span>
              <i className="weather-impact" />
              Possível impacto
            </span>
          </div>
          <div className="weather-days">
            {forecast.days.map(d => {
              const Icon = icons[d.kind as keyof typeof icons] ?? Cloud;
              const impact = ["rain", "snow", "storm"].includes(d.kind)
                ? "impact"
                : d.kind === "unknown" || d.chance === null
                  ? "unknown"
                  : ["fog", "cloud"].includes(d.kind) || d.chance >= 30
                    ? "attention"
                    : "good";
              const impactLabel = {
                impact: "Possível impacto",
                attention: "Atenção",
                good: "Favorável",
                unknown: "Dados incompletos",
              }[impact];
              return (
                <article
                  className={"weather-day weather-" + impact}
                  key={d.date}
                >
                  <time dateTime={d.date}>
                    {new Intl.DateTimeFormat("pt-BR", {
                      weekday: "short",
                      timeZone: "UTC",
                    }).format(new Date(d.date + "T12:00:00Z"))}
                    <span>
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        timeZone: "UTC",
                      }).format(new Date(d.date + "T12:00:00Z"))}
                    </span>
                  </time>
                  <span className="weather-impact-label">{impactLabel}</span>
                  <Icon size={28} aria-hidden="true" />
                  <p className="weather-condition">{d.condition}</p>
                  <div className="weather-temp">
                    <strong title="Máxima prevista no período diurno">
                      {temperature(d.high)}
                    </strong>
                    <span title="Mínima prevista no período noturno">
                      {temperature(d.low)}
                    </span>
                    <small>°{unit}</small>
                  </div>
                  <span className="weather-detail">
                    <Droplets size={13} />
                    {d.chance === null ? "—" : d.chance + "%"} precip.
                  </span>
                  <span className="weather-detail">
                    <Wind size={13} />
                    {d.wind === null ? "—" : d.wind + " mph"}
                  </span>
                </article>
              );
            })}
          </div>
          <p className="weather-color-note">
            Verde: céu aberto ou sol entre nuvens, com chance de precipitação
            abaixo de 30%. Amarelo: nublado, neblina ou chance a partir de 30%.
            Vermelho: previsão de chuva, neve, gelo ou trovoadas. Dados
            incompletos ficam neutros.
          </p>
          <p className="weather-meta">
            Previsão emitida em {stamp(forecast.issuedAt)} · consultada em{" "}
            {stamp(forecast.fetchedAt)}
            {stale ? " · Previsão antiga; aguarde nova emissão." : ""}
          </p>
        </>
      ) : null}
      <p className="panel-note">
        Máxima do dia e mínima da noite; períodos não disponíveis aparecem como
        —. A chance de precipitação inclui chuva ou neve e mostra o maior valor
        dos períodos do dia.{" "}
        <a
          href="https://forecast.weather.gov/MapClick.php?lat=40.4533&lon=-111.7780"
          target="_blank"
          rel="noreferrer"
        >
          Fonte: NWS / NOAA
        </a>
        .
      </p>
    </section>
  );
}
