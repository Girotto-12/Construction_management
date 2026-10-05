"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Check,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { createDemo } from "@/lib/demo";
import { DEMO_KEY, readDemo } from "@/lib/local-demo";
import {
  childrenOf,
  progress,
  percent,
  shortDate,
  today,
  layers,
  roomProgress,
  formatQuantity,
  type Layer,
} from "@/lib/domain";
import { FloorPlan } from "./floor-plan";
export function ClientOverview() {
  const [project, setProject] = useState(createDemo),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  const [layer, setLayer] = useState<Layer>("alvenaria"),
    [selected, setSelected] = useState("cozinha");
  useEffect(() => {
    const load = () => {
      try {
        setProject(readDemo(localStorage.getItem(DEMO_KEY)));
        setError(false);
        setReady(true);
      } catch {
        setError(true);
        setReady(false);
      }
    };
    load();
    const update = (e: StorageEvent) => {
      if (e.key === DEMO_KEY || e.key === null) load();
    };
    window.addEventListener("storage", update);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", load);
    };
  }, []);
  const now = today(project.timezone),
    total = progress(project, now);
  const stages = project.packages
    .filter(p => !p.parentId)
    .map(p => {
      const items = childrenOf(project, p.id);
      return {
        ...p,
        actual: progress(project, now, "actual", items),
        start: items.map(i => i.start).sort()[0],
        end: items
          .map(i => i.end)
          .sort()
          .at(-1)!,
      };
    });
  const updates = project.entries
    .filter(e => e.date <= now)
    .toSorted(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    )
    .slice(0, 5);
  const room = project.rooms.find(r => r.id === selected)!;
  const roomValue = roomProgress(project, selected, layer, now, "actual");
  return (
    <div className="client-shell">
      <header className="client-header">
        <Link href="/cliente/demo" className="brand">
          <span className="brand-symbol">
            <Building2 size={24} />
          </span>
          obra clara<span className="brand-dot">.</span>
        </Link>
        <span className="client-header-label">ACOMPANHAMENTO DA OBRA</span>
        <Link href="/demo" className="account-link">
          <ArrowLeft size={15} />
          Voltar à demonstração
        </Link>
      </header>
      <main className="client-main">
        <div className="client-demo-note">
          Prévia do espaço do cliente · obra de exemplo · dados deste navegador.
          O acesso privado ainda não está conectado.
        </div>
        <section className="client-hero">
          <div>
            <span className="eyebrow">CADA ETAPA, MAIS PERTO DE CASA</span>
            <h1>Sua obra está ganhando forma.</h1>
            <p>
              Acompanhe o que já foi feito e as próximas etapas da{" "}
              {project.name}.
            </p>
            <div className="client-project-name">
              <Building2 size={17} />
              <strong>{project.name}</strong>
              <span>
                {project.rooms.reduce((sum, r) => sum + r.area, 0)} m² ·{" "}
                {project.rooms.length} ambientes
              </span>
            </div>
          </div>
          <div className="client-progress">
            <span>Avanço físico realizado</span>
            <strong>{ready ? percent(total) + "%" : "—"}</strong>
            <div className="progress-track">
              <span style={{ width: ready ? total + "%" : "0%" }} />
            </div>
            <small>Calculado pelas execuções registradas</small>
          </div>
        </section>
        {error ? (
          <p role="alert" className="alert error">
            Não foi possível ler os registros desta demonstração. Atualize a
            página para tentar novamente.
          </p>
        ) : null}
        {!ready && !error ? (
          <p role="status">Carregando o resumo da obra…</p>
        ) : null}
        {ready ? (
          <>
            <section className="client-facts" aria-label="Resumo da obra">
              <article>
                <CalendarDays size={20} />
                <div>
                  <span>Entrega planejada</span>
                  <strong>
                    {shortDate(project.end)} de {project.end.slice(0, 4)}
                  </strong>
                  <small>Data do planejamento atual</small>
                </div>
              </article>
              <article>
                <Check size={20} />
                <div>
                  <span>Etapas concluídas</span>
                  <strong>
                    {stages.filter(s => s.actual >= 100).length} de{" "}
                    {stages.length}
                  </strong>
                  <small>
                    {stages.filter(s => s.actual > 0 && s.actual < 100).length}{" "}
                    em andamento
                  </small>
                </div>
              </article>
              <article>
                <MapPin size={20} />
                <div>
                  <span>Última execução registrada</span>
                  <strong>
                    {updates[0]
                      ? shortDate(updates[0].date) +
                        " de " +
                        updates[0].date.slice(0, 4)
                      : "Sem registros"}
                  </strong>
                  <small>Atualizado a partir das medições</small>
                </div>
              </article>
            </section>
            <div className="client-grid">
              <section className="panel client-plan">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">
                      SUA CASA, AMBIENTE POR AMBIENTE
                    </span>
                    <h2>Veja o avanço na planta</h2>
                    <p>Selecione uma etapa e toque no ambiente.</p>
                  </div>
                </div>
                <div className="segmented" aria-label="Etapa da planta">
                  {layers.map(l => (
                    <button
                      key={l.id}
                      className={layer === l.id ? "selected" : ""}
                      aria-pressed={layer === l.id}
                      onClick={() => setLayer(l.id)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <FloorPlan
                  project={project}
                  layer={layer}
                  date={now}
                  mode="actual"
                  selected={selected}
                  onSelect={setSelected}
                />
                <div className="client-room-summary">
                  <div>
                    <strong>{room.name}</strong>
                    <span>
                      {layers.find(l => l.id === layer)?.label} · {room.area} m²
                    </span>
                  </div>
                  <strong>
                    {roomValue === null
                      ? "Não se aplica"
                      : percent(roomValue) + "% executado"}
                  </strong>
                </div>
                <p className="panel-note">
                  As cores representam o percentual executado no ambiente, não a
                  posição exata do serviço.
                </p>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">DO INÍCIO À ENTREGA</span>
                    <h2>Etapas da sua obra</h2>
                  </div>
                </div>
                <ol className="client-stages">
                  {stages.map((s, i) => (
                    <li key={s.id}>
                      <span
                        className={
                          "client-stage-number " +
                          (s.actual >= 100 ? "done" : "")
                        }
                      >
                        {s.actual >= 100 ? (
                          <Check size={16} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <div>
                        <div className="client-stage-title">
                          <h3>{s.name}</h3>
                          <strong>{percent(s.actual)}%</strong>
                        </div>
                        <span className="client-stage-status">
                          {s.actual >= 100
                            ? "Concluída"
                            : s.actual > 0
                              ? "Em andamento"
                              : "A iniciar"}
                        </span>
                        <div className="progress-track">
                          <span style={{ width: s.actual + "%" }} />
                        </div>
                        <small>
                          Planejado: {shortDate(s.start)} — {shortDate(s.end)}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="panel-note">
                  As datas são do planejamento. Esta prévia ainda não recalcula
                  a entrega conforme o andamento.
                </p>
              </section>
            </div>
            <section className="panel client-updates">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">O QUE JÁ ACONTECEU</span>
                  <h2>Últimas execuções</h2>
                  <p>Um resumo dos serviços registrados na obra.</p>
                </div>
              </div>
              {updates.length ? (
                <div className="client-updates-list">
                  {updates.map(e => {
                    const item = project.packages.find(
                      p => p.id === e.packageId
                    )!;
                    return (
                      <article key={e.id}>
                        <span className="client-update-check">
                          <Check size={17} />
                        </span>
                        <div>
                          <h3>{item.name}</h3>
                          <p>
                            {project.rooms.find(r => r.id === item.roomId)
                              ?.name ?? "Toda a obra"}{" "}
                            · {formatQuantity(e.quantity, item.precision)}{" "}
                            {item.unit} registrados
                          </p>
                        </div>
                        <time dateTime={e.date}>{shortDate(e.date)}</time>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p>Ainda não há execuções registradas.</p>
              )}
            </section>
          </>
        ) : null}
        <footer>
          <span>obra clara.</span>
          <span>Um jeito mais claro de acompanhar sua obra.</span>
        </footer>
      </main>
    </div>
  );
}
