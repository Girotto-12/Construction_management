"use client";
import { roomProgress, percent, type Project, type Layer } from "@/lib/domain";
export function FloorPlan({
  project,
  layer,
  date,
  mode,
  selected,
  onSelect,
}: {
  project: Project;
  layer: Layer;
  date: string;
  mode: "actual" | "planned";
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <svg
      className="floor-plan"
      viewBox="0 0 555 450"
      role="group"
      aria-label="Planta da Residência Horizonte, ambientes e avanço"
    >
      <defs>
        <pattern
          id="plan-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path d="M20 0H0V20" fill="none" stroke="#e6ecee" strokeWidth=".6" />
        </pattern>
        <pattern
          id="tiles"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M16 0H0V16"
            fill="none"
            stroke="#26755b"
            strokeOpacity=".3"
          />
        </pattern>
      </defs>
      <rect width="555" height="450" fill="url(#plan-grid)" />
      <path
        d="M45 22H510 M45 16v12 M510 16v12 M25 40V405 M19 40h12 M19 405h12"
        stroke="#aab8bd"
        strokeWidth="1"
      />
      <text x="278" y="17" textAnchor="middle" className="dimension">
        PLANTA TÉRREA · 142 m²
      </text>
      {project.rooms.map(room => {
        const value = roomProgress(project, room.id, layer, date, mode);
        const n = value ?? 0;
        const done = n >= 100 - 1e-8;
        const color = done ? "#b6d9c6" : n > 0 ? "#f0d4a1" : "#e9eef0";
        const label =
          room.name +
          ": " +
          (value === null
            ? "não se aplica"
            : percent(n) +
              "% " +
              (mode === "actual" ? "executado" : "planejado"));
        return (
          <g
            key={room.id}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={selected === room.id}
            onClick={() => onSelect(room.id)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(room.id);
              }
            }}
            className="plan-room"
          >
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              fill={color}
              stroke={selected === room.id ? "#173e48" : "#60777e"}
              strokeWidth={selected === room.id ? 5 : 3}
            />
            {layer === "pisos" && n > 0 ? (
              <rect
                x={room.x + 5}
                y={room.y + room.height * (1 - n / 100) + 3}
                width={room.width - 10}
                height={Math.max(0, (room.height * n) / 100 - 8)}
                fill="url(#tiles)"
              />
            ) : null}
            {layer === "eletrica"
              ? [0, 1, 2, 3].map(i => (
                  <circle
                    key={i}
                    cx={room.x + 18 + (i * (room.width - 36)) / 3}
                    cy={room.y + 20}
                    r="5"
                    fill={n >= (i + 1) * 25 ? "#387e68" : "#fff"}
                    stroke="#8ca09e"
                  />
                ))
              : null}
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2 - 8}
              textAnchor="middle"
              className="room-name"
            >
              {room.name}
            </text>
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2 + 18}
              textAnchor="middle"
              className="room-number"
            >
              {value === null ? "—" : percent(n) + "%"}
            </text>
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height - 15}
              textAnchor="middle"
              className="room-area"
            >
              {room.area} m²
            </text>
          </g>
        );
      })}
      <path
        d="M66 405v-35a35 35 0 0 1 35 35 M330 195v30a30 30 0 0 0 30-30 M155 190v-30a30 30 0 0 1 30 30 M330 190v-30a30 30 0 0 1 30 30"
        stroke="#768b90"
        fill="none"
        strokeWidth="1.5"
        pointerEvents="none"
      />
      <text x="278" y="438" textAnchor="middle" className="dimension">
        DESENHO DE EXEMPLO · SEM ESCALA
      </text>
    </svg>
  );
}
