"use client";
import { useMemo, useState, useId } from "react";
import { physicalCurve } from "@/lib/physical-curve";
import { percent, shortDate, type Project } from "@/lib/domain";
export function PhysicalCurve({
  project,
  asOf,
}: {
  project: Project;
  asOf: string;
}) {
  const points = useMemo(() => physicalCurve(project, asOf), [project, asOf]);
  const todayIndex = Math.max(
    0,
    points.findIndex(p => p.date === asOf)
  );
  const [selection, setSelection] = useState<number | null>(null);
  const index = Math.min(selection ?? todayIndex, points.length - 1),
    selected = points[index];
  const id = useId();
  if (!selected) return null;
  const x = (i: number) => 56 + (i / Math.max(1, points.length - 1)) * 808;
  const y = (v: number) => 266 - v * 2.2;
  const plannedPath = points
    .map((p, i) => (i ? "L" : "M") + x(i) + "," + y(p.planned))
    .join(" ");
  const actualPath = points
    .filter(p => p.actual !== null)
    .map((p, i) =>
      i ? "H" + x(i) + "V" + y(p.actual!) : "M" + x(i) + "," + y(p.actual!)
    )
    .join(" ");
  const delta =
    selected.actual === null ? null : selected.actual - selected.planned;
  const ticks = Array.from(
    new Set([0, 1, 2, 3, 4].map(n => Math.round(((points.length - 1) * n) / 4)))
  );
  return (
    <section className="panel physical-curve" aria-labelledby={id}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">AVANÇO FÍSICO ACUMULADO</span>
          <h2 id={id}>Curva S · planejado × realizado</h2>
          <p>Percentual da obra ponderado pelos pesos dos serviços da EAP.</p>
        </div>
        <span className="small-chip">Planejado: simulação</span>
      </div>
      <div className="curve-summary" aria-live="polite">
        <div>
          <span>Data consultada</span>
          <strong>
            {shortDate(selected.date)} de {selected.date.slice(0, 4)}
          </strong>
        </div>
        <div>
          <span>Planejado</span>
          <strong>{percent(selected.planned)}%</strong>
        </div>
        <div>
          <span>Realizado</span>
          <strong>
            {selected.actual === null
              ? "Ainda não medido"
              : percent(selected.actual) + "%"}
          </strong>
        </div>
        <div>
          <span>Desvio físico</span>
          <strong className={delta !== null && delta < 0 ? "negative" : ""}>
            {delta === null
              ? "—"
              : (delta > 0 ? "+" : "") + percent(delta) + " p.p."}
          </strong>
        </div>
      </div>
      <div className="curve-legend">
        <span>
          <i className="planned" />
          Planejado
        </span>
        <span>
          <i className="actual" />
          Realizado até {shortDate(asOf)}
        </span>
      </div>
      <div className="curve-scroll">
        <svg
          className="curve-svg"
          viewBox="0 0 900 310"
          role="img"
          aria-label="Curva de avanço físico: planejado durante o projeto e realizado somente até hoje. Consulte os valores pelo controle de data abaixo."
        >
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1="56" x2="864" y1={y(v)} y2={y(v)} stroke="#e2eaec" />
              <text x="44" y={y(v) + 4} textAnchor="end">
                {v}%
              </text>
            </g>
          ))}
          {ticks.map(i => (
            <text
              key={i}
              x={x(i)}
              y="294"
              textAnchor={
                i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
              }
            >
              {shortDate(points[i].date)}
            </text>
          ))}
          <path
            d={plannedPath}
            fill="none"
            stroke="#9a7943"
            strokeWidth="3"
            strokeDasharray="7 5"
          />
          <path d={actualPath} fill="none" stroke="#297660" strokeWidth="3" />
          {asOf >= project.start ? (
            <g>
              <line
                x1={x(todayIndex)}
                x2={x(todayIndex)}
                y1="35"
                y2="266"
                stroke="#a4b4ba"
                strokeDasharray="3 5"
              />
              <text x={x(todayIndex)} y="23" textAnchor="middle">
                Hoje
              </text>
            </g>
          ) : null}
          <line
            x1={x(index)}
            x2={x(index)}
            y1="46"
            y2="266"
            stroke="#173e48"
            opacity=".45"
          />
          <circle
            cx={x(index)}
            cy={y(selected.planned)}
            r="5"
            fill="#9a7943"
            stroke="white"
            strokeWidth="2"
          />
          {selected.actual !== null ? (
            <circle
              cx={x(index)}
              cy={y(selected.actual)}
              r="5"
              fill="#297660"
              stroke="white"
              strokeWidth="2"
            />
          ) : null}
        </svg>
      </div>
      <div className="curve-date">
        <label htmlFor={id + "-date"}>Consultar avanço por data</label>
        <button className="text-button" onClick={() => setSelection(null)}>
          Voltar para hoje
        </button>
        <input
          id={id + "-date"}
          type="range"
          min="0"
          max={points.length - 1}
          value={index}
          aria-valuetext={selected.date}
          onChange={e => setSelection(Number(e.target.value))}
        />
      </div>
      <p className="panel-note">
        Planejado distribuído linearmente entre as datas dos serviços. Realizado
        calculado pelas quantidades registradas, com saltos nas datas de
        execução e sem projeção futura. Custos não alteram esta curva.
      </p>
    </section>
  );
}
