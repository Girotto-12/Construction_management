"use client";
import { WeatherWeek } from "./weather-week";
import { PhysicalCurve } from "./physical-curve";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers3,
  LayoutDashboard,
  Map,
  CalendarDays,
  BookOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Building2,
  Coins,
  Check,
  Clock3,
  LogIn,
  ChartNoAxesCombined,
  Wallet,
  Info,
} from "lucide-react";
import { createDemo } from "@/lib/demo";
import { DEMO_KEY, readDemo, serializeDemo } from "@/lib/local-demo";
import {
  addExecution,
  addCost,
  childrenOf,
  executed,
  leaves,
  layers,
  money,
  percent,
  formatQuantity,
  progress,
  roomProgress,
  shortDate,
  today,
  totals,
  type Project,
  type Layer,
  type ExecutionInput,
  type CostInput,
} from "@/lib/domain";
import { FloorPlan } from "./floor-plan";
import { EntryDialog } from "./entry-dialog";
type Tab = "overview" | "eap" | "schedule" | "diary";
const tabs = [
  { id: "overview" as const, label: "Obra ao vivo", icon: LayoutDashboard },
  { id: "eap" as const, label: "EAP e custos", icon: Layers3 },
  { id: "schedule" as const, label: "Cronograma", icon: CalendarDays },
  { id: "diary" as const, label: "Diário de obra", icon: BookOpen },
];
const dayIndex = (date: string) =>
  Math.floor(new Date(date + "T12:00:00Z").getTime() / 86400000);
const fromDay = (value: number) =>
  new Date(value * 86400000).toISOString().slice(0, 10);
export function Workspace() {
  const [project, setProject] = useState<Project>(createDemo);
  const [tab, setTab] = useState<Tab>("overview");
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [layer, setLayer] = useState<Layer>("alvenaria"),
    [selected, setSelected] = useState("cozinha");
  const [view, setView] = useState<"actual" | "planned">("actual");
  const [date, setDate] = useState("2026-10-04");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    kind: "execution" | "cost";
    packageId?: string;
  } | null>(null);
  useEffect(() => {
    {
      const load = () => {
        try {
          setProject(readDemo(localStorage.getItem(DEMO_KEY)));
          setReady(true);
          setError("");
        } catch {
          setError(
            "Os dados locais não puderam ser lidos. Seus registros foram preservados; verifique o armazenamento do navegador."
          );
          setReady(false);
        }
      };
      setDate(today(createDemo().timezone));
      load();
      const handler = (event: StorageEvent) => {
        if (event.key === DEMO_KEY) load();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }
  }, []);
  const now = today(project.timezone),
    actual = progress(project, now),
    planned = progress(project, now, "planned"),
    amounts = totals(project);
  const selectedRoom =
    project.rooms.find(r => r.id === selected) ?? project.rooms[0];
  const roomItems = leaves(project).filter(
    i => i.roomId === selectedRoom?.id && i.layer === layer
  );
  const roomValue = roomProgress(
    project,
    selectedRoom?.id ?? "",
    layer,
    date,
    view
  );
  const scopeCost = totals(project, "9999-12-31", roomItems);
  const earliest = dayIndex(project.start),
    latest = dayIndex(
      view === "actual" ? (now < project.end ? now : project.end) : project.end
    );
  async function save(
    kind: "execution" | "cost",
    input: ExecutionInput | CostInput
  ) {
    {
      const commit = async () => {
        const current = readDemo(localStorage.getItem(DEMO_KEY));
        const updated =
          kind === "execution"
            ? addExecution(current, input as ExecutionInput)
            : addCost(current, input as CostInput);
        localStorage.setItem(DEMO_KEY, serializeDemo(updated));
        setProject(updated);
      };
      if (navigator.locks) await navigator.locks.request(DEMO_KEY, commit);
      else await commit();
    }
    setDate(now);
    setView("actual");
    setNotice(
      kind === "execution"
        ? "Execução registrada. A planta e o avanço foram atualizados."
        : "Custo lançado e somado à EAP."
    );
  }
  function changeView(mode: "actual" | "planned") {
    setView(mode);
    if (mode === "actual" && date > now) setDate(now);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <Building2 size={24} />
          </span>
          obra clara<span className="brand-dot">.</span>
        </Link>
        <div className="sidebar-project">
          <span className="sidebar-caption">ESPAÇO DE TRABALHO</span>
          <strong>{project.company}</strong>
          <span>Gestão de obras residenciais</span>
        </div>
        <nav aria-label="Navegação principal">
          <Link href="/planejamento/demo" className="planning-nav-link">
            <CalendarDays size={19} />
            Planejamento
          </Link>
          {tabs.map(t => (
            <button
              key={t.id}
              aria-current={tab === t.id ? "page" : undefined}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={19} />
              {t.label}
              {tab === t.id ? <span className="nav-mark" /> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Map size={21} />
          <strong>Uma obra conectada</strong>
          <p>Cada registro aproxima o planejamento da realidade.</p>
        </div>
        <div className="sidebar-bottom">
          <div className="avatar">OC</div>
          <div>
            <strong>Espaço de demonstração</strong>
            <small>Explore o fluxo da obra</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            Obras <ChevronRight size={14} />
            <strong>{project.name}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-badge">DEMONSTRAÇÃO</span>
            <Link href="/cliente/demo" className="account-link">
              Visão do cliente
            </Link>
            <Link href="/entrar" className="account-link">
              <LogIn size={16} />
              Entrar
            </Link>
          </div>
        </header>
        <section className="page-title">
          <div>
            <div className="eyebrow">
              RESIDENCIAL · {project.rooms.reduce((s, r) => s + r.area, 0)} m²
            </div>
            <h1>
              {tab === "overview"
                ? "Sua obra, por inteiro."
                : tabs.find(t => t.id === tab)?.label}
            </h1>
            <p>
              {tab === "overview"
                ? "O que foi planejado. O que já aconteceu. O próximo passo."
                : tab === "eap"
                  ? "Cada serviço com seu orçamento, execução e custo."
                  : tab === "schedule"
                    ? "Veja as etapas e acompanhe a distância entre o plano e a execução."
                    : "O trabalho do canteiro registrado em um só lugar."}
            </p>
          </div>
          <button
            className="button primary"
            disabled={!ready}
            onClick={() => setDialog({ kind: "execution" })}
          >
            <Plus size={18} />
            Registrar execução
          </button>
        </section>
        <div className="project-strip">
          <span>
            <Building2 size={15} />
            {project.name}
          </span>
          <span>
            <CalendarDays size={15} />
            {shortDate(project.start)} — {shortDate(project.end)} de{" "}
            {project.end.slice(0, 4)}
          </span>
          <span className="status-pill">Em execução</span>
          <span className="save-label">
            {ready ? <Check size={14} /> : <Clock3 size={14} />}Dados de exemplo
            · salvos neste navegador
          </span>
        </div>
        {error ? (
          <div className="alert error" role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="alert success" role="status">
            {notice}
            <button aria-label="Dispensar aviso" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        ) : null}
        {!ready && !error ? (
          <div className="loading" role="status">
            Abrindo sua obra…
          </div>
        ) : null}
        {tab === "schedule" ? <WeatherWeek /> : null}
        <section className="metrics" aria-label="Indicadores da obra">
          <Metric
            label="Avanço físico"
            value={percent(actual) + "%"}
            note={percent(planned) + "% planejado · simulação para hoje"}
            icon={<ChartNoAxesCombined size={18} />}
            progress={actual}
          />
          <Metric
            label="Orçamento da obra"
            value={money(amounts.budget, project.currency)}
            note="Soma dos serviços da EAP"
            icon={<Wallet size={18} />}
          />
          <Metric
            label="Custo lançado"
            value={money(amounts.spent, project.currency)}
            note={
              percent((amounts.spent / amounts.budget) * 100) +
              "% do orçamento utilizado"
            }
            icon={<Coins size={18} />}
          />
          <Metric
            label="Saldo do orçamento"
            value={money(amounts.balance, project.currency)}
            note="Orçado menos custos lançados"
            icon={<ArrowUpRight size={18} />}
            warning={amounts.balance < 0}
          />
        </section>
        {tab === "overview" ? (
          <>
            <div className="workspace-grid">
              <section className="panel plan-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">PLANTA E AVANÇO</span>
                    <h2>O canteiro ganha forma</h2>
                  </div>
                  <span className="small-chip">Térreo</span>
                </div>
                <div className="plan-controls">
                  <div className="segmented" aria-label="Etapa da planta">
                    {layers.map(l => (
                      <button
                        key={l.id}
                        aria-pressed={layer === l.id}
                        className={layer === l.id ? "selected" : ""}
                        onClick={() => setLayer(l.id)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <select
                    aria-label="Visualização da planta"
                    value={view}
                    onChange={e =>
                      changeView(e.target.value as "actual" | "planned")
                    }
                  >
                    <option value="actual">Executado</option>
                    <option value="planned">Planejado</option>
                  </select>
                </div>
                <FloorPlan
                  project={project}
                  layer={layer}
                  date={date}
                  mode={view}
                  selected={selected}
                  onSelect={setSelected}
                />
                <div className="plan-legend">
                  <span>
                    <i className="pending" />
                    Não iniciado
                  </span>
                  <span>
                    <i className="running" />
                    Em execução
                  </span>
                  <span>
                    <i className="complete" />
                    Concluído
                  </span>
                </div>
                <div className="timeline-control">
                  <div>
                    <strong>
                      {view === "actual" ? "Execução até" : "Planejamento para"}{" "}
                      {shortDate(date)}
                    </strong>
                    <span>
                      {view === "planned"
                        ? "Simulação por datas · distribuição linear"
                        : "Baseado nos registros do diário"}
                    </span>
                  </div>
                  <input
                    aria-label="Data da visualização"
                    type="range"
                    min={earliest}
                    max={Math.max(earliest, latest)}
                    value={Math.min(dayIndex(date), Math.max(earliest, latest))}
                    onChange={e => setDate(fromDay(Number(e.target.value)))}
                  />
                  <div className="timeline-labels">
                    <span>{shortDate(project.start)}</span>
                    <button
                      onClick={() => {
                        setDate(now < project.end ? now : project.end);
                        setView("actual");
                      }}
                    >
                      Voltar para hoje
                    </button>
                    <span>{shortDate(fromDay(latest))}</span>
                  </div>
                </div>
              </section>
              <section className="panel room-detail">
                <span className="eyebrow">AMBIENTE SELECIONADO</span>
                <div className="room-title">
                  <h2>{selectedRoom?.name}</h2>
                  <span>{selectedRoom?.area} m²</span>
                </div>
                <div className="room-preview-icon">
                  <Map size={28} />
                  <span>{layers.find(l => l.id === layer)?.label}</span>
                </div>
                <div className="detail-progress">
                  <strong>
                    {roomValue === null ? "—" : percent(roomValue) + "%"}
                  </strong>
                  <span>
                    {view === "actual" ? "executado" : "planejado"} até{" "}
                    {shortDate(date)}
                  </span>
                </div>
                <div className="progress-track">
                  <span style={{ width: (roomValue ?? 0) + "%" }} />
                </div>
                {roomItems.map(i => (
                  <div className="scope-summary" key={i.id}>
                    <span className="eap-code">{i.code}</span>
                    <strong>{i.name}</strong>
                    <small>
                      {formatQuantity(executed(project, i, date), i.precision)}{" "}
                      de {formatQuantity(i.quantity, i.precision)} {i.unit}{" "}
                      executados
                    </small>
                  </div>
                ))}
                <div className="detail-cost">
                  <div>
                    <span>Orçado</span>
                    <strong>{money(scopeCost.budget, project.currency)}</strong>
                  </div>
                  <div>
                    <span>Custo lançado</span>
                    <strong>{money(scopeCost.spent, project.currency)}</strong>
                  </div>
                </div>
                <button
                  className="button primary full"
                  disabled={!ready || !roomItems.length}
                  onClick={() =>
                    setDialog({
                      kind: "execution",
                      packageId: roomItems[0]?.id,
                    })
                  }
                >
                  <Plus size={17} />
                  Registrar neste ambiente
                </button>
                <button
                  className="button secondary full"
                  disabled={!ready || !roomItems.length}
                  onClick={() =>
                    setDialog({ kind: "cost", packageId: roomItems[0]?.id })
                  }
                >
                  <Coins size={17} />
                  Lançar custo
                </button>
                <p className="detail-footnote">
                  A cor representa o percentual medido no ambiente, não a
                  localização exata do serviço.
                </p>
              </section>
            </div>
            <section className="panel next-section">
              <div className="panel-heading">
                <h2>Frentes em andamento</h2>
                <button className="text-button" onClick={() => setTab("eap")}>
                  Ver EAP completa <ChevronRight size={16} />
                </button>
              </div>
              <div className="front-grid">
                {project.packages
                  .filter(i => !i.parentId)
                  .map(group => {
                    const items = childrenOf(project, group.id),
                      p = progress(project, now, "actual", items),
                      cost = totals(project, now, items);
                    return (
                      <button
                        key={group.id}
                        className="front-card"
                        onClick={() => {
                          setTab("eap");
                          setCollapsed(
                            project.packages
                              .filter(i => !i.parentId && i.id !== group.id)
                              .map(i => i.id)
                          );
                        }}
                      >
                        <span>
                          {group.code} · {group.name}
                        </span>
                        <strong>{percent(p)}%</strong>
                        <div className="progress-track">
                          <span style={{ width: p + "%" }} />
                        </div>
                        <small>
                          {money(cost.spent, project.currency)} lançados
                        </small>
                      </button>
                    );
                  })}
              </div>
            </section>
          </>
        ) : null}
        {tab === "eap" ? <PhysicalCurve project={project} asOf={now} /> : null}
        {tab === "eap" ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Estrutura Analítica do Projeto</h2>
                <p>
                  Orçamento e custos consolidados por etapa. Valores em{" "}
                  {project.currency}.
                </p>
              </div>
              <button
                className="button secondary"
                disabled={!ready}
                onClick={() => setDialog({ kind: "cost" })}
              >
                <Plus size={17} />
                Lançar custo
              </button>
            </div>
            <div className="table-scroll">
              <table className="eap-table">
                <thead>
                  <tr>
                    <th>Etapa / serviço</th>
                    <th>Avanço</th>
                    <th>Orçado</th>
                    <th>Custo lançado</th>
                    <th>Saldo</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.packages
                    .filter(i => !i.parentId)
                    .flatMap(group => {
                      const items = childrenOf(project, group.id),
                        t = totals(project, "9999-12-31", items),
                        closed = collapsed.includes(group.id);
                      const row = (
                        <tr className="group-row" key={group.id}>
                          <td>
                            <button
                              onClick={() =>
                                setCollapsed(
                                  closed
                                    ? collapsed.filter(id => id !== group.id)
                                    : [...collapsed, group.id]
                                )
                              }
                              aria-expanded={!closed}
                            >
                              {closed ? (
                                <ChevronRight size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                              <span className="eap-code">{group.code}</span>
                              {group.name}
                            </button>
                          </td>
                          <td>
                            {percent(progress(project, now, "actual", items))}%
                          </td>
                          <td>{money(t.budget, project.currency)}</td>
                          <td>{money(t.spent, project.currency)}</td>
                          <td className={t.balance < 0 ? "negative" : ""}>
                            {money(t.balance, project.currency)}
                          </td>
                          <td />
                        </tr>
                      );
                      return [
                        row,
                        ...(closed
                          ? []
                          : items.map(i => {
                              const v = totals(project, "9999-12-31", [i]);
                              return (
                                <tr key={i.id}>
                                  <td>
                                    <div className="service-name">
                                      <span className="eap-code">{i.code}</span>
                                      <div>
                                        <strong>{i.name}</strong>
                                        <small>
                                          {project.rooms.find(
                                            r => r.id === i.roomId
                                          )?.name ?? "Toda a obra"}{" "}
                                          ·{" "}
                                          {formatQuantity(
                                            i.quantity,
                                            i.precision
                                          )}{" "}
                                          {i.unit}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span>
                                      {percent(
                                        (executed(project, i) / i.quantity) *
                                          100
                                      )}
                                      %
                                    </span>
                                    <div className="progress-track compact">
                                      <span
                                        style={{
                                          width:
                                            (executed(project, i) /
                                              i.quantity) *
                                              100 +
                                            "%",
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td>{money(v.budget, project.currency)}</td>
                                  <td>{money(v.spent, project.currency)}</td>
                                  <td
                                    className={v.balance < 0 ? "negative" : ""}
                                  >
                                    {money(v.balance, project.currency)}
                                  </td>
                                  <td>
                                    <button
                                      className="icon-button"
                                      aria-label={
                                        "Lançar custo em " +
                                        i.code +
                                        " " +
                                        i.name
                                      }
                                      disabled={!ready}
                                      onClick={() =>
                                        setDialog({
                                          kind: "cost",
                                          packageId: i.id,
                                        })
                                      }
                                    >
                                      <Plus size={17} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })),
                      ];
                    })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total da obra</td>
                    <td>{percent(actual)}%</td>
                    <td>{money(amounts.budget, project.currency)}</td>
                    <td>{money(amounts.spent, project.currency)}</td>
                    <td>{money(amounts.balance, project.currency)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="panel-note">
              <Info size={15} />
              Saldo não é previsão de lucro. Compromissos de compra, pagamentos
              e projeção final serão tratados nas próximas etapas.
            </p>
          </section>
        ) : null}
        {tab === "schedule" ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Cronograma físico</h2>
                <p>Datas previstas e avanço medido por serviço.</p>
              </div>
              <span className="small-chip">Ago — Dez / 2026</span>
            </div>
            <div className="table-scroll">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Serviço / ambiente</th>
                    <th>Período previsto</th>
                    <th>Executado</th>
                    <th className="months">AGO · SET · OUT · NOV · DEZ</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves(project).map(i => (
                    <tr key={i.id}>
                      <td>
                        <strong>
                          {i.code} · {i.name}
                        </strong>
                        <small>
                          {project.rooms.find(r => r.id === i.roomId)?.name ??
                            "Toda a obra"}
                        </small>
                      </td>
                      <td>
                        {shortDate(i.start)} — {shortDate(i.end)}
                      </td>
                      <td>
                        {percent((executed(project, i) / i.quantity) * 100)}%
                      </td>
                      <td className="gantt-cell">
                        <div
                          className="gantt-bar"
                          style={{
                            marginLeft:
                              ((dayIndex(i.start) - earliest) /
                                (dayIndex(project.end) - earliest + 1)) *
                                100 +
                              "%",
                            width:
                              ((dayIndex(i.end) - dayIndex(i.start) + 1) /
                                (dayIndex(project.end) - earliest + 1)) *
                                100 +
                              "%",
                          }}
                        >
                          <span
                            style={{
                              width:
                                (executed(project, i) / i.quantity) * 100 + "%",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="panel-note">
              <Info size={15} />A simulação da planta distribui a quantidade
              entre as datas. Dependências e recálculo automático ainda não
              estão ativos.
            </p>
          </section>
        ) : null}
        {tab === "diary" ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Histórico da obra</h2>
                <p>Execuções e custos ligados aos serviços da EAP.</p>
              </div>
              <button
                className="button secondary"
                disabled={!ready}
                onClick={() => setDialog({ kind: "cost" })}
              >
                <Coins size={17} />
                Lançar custo
              </button>
            </div>
            <div className="diary-list">
              {[
                ...project.entries.map(e => ({
                  ...e,
                  kind: "execution" as const,
                })),
                ...project.costs.map(c => ({ ...c, kind: "cost" as const })),
              ]
                .sort(
                  (a, b) =>
                    b.date.localeCompare(a.date) ||
                    b.createdAt.localeCompare(a.createdAt)
                )
                .map(entry => {
                  const item = project.packages.find(
                    i => i.id === entry.packageId
                  )!;
                  return (
                    <article key={entry.id} className="diary-entry">
                      <span className={"entry-symbol " + entry.kind}>
                        {entry.kind === "execution" ? (
                          <Check size={17} />
                        ) : (
                          <Coins size={17} />
                        )}
                      </span>
                      <div>
                        <div className="entry-heading">
                          <strong>
                            {item.code} · {item.name}
                          </strong>
                          <time>{shortDate(entry.date)}</time>
                        </div>
                        <small>
                          {project.rooms.find(r => r.id === item.roomId)
                            ?.name ?? "Toda a obra"}
                        </small>
                        <p>
                          {entry.kind === "execution"
                            ? entry.note || "Execução registrada."
                            : entry.description}
                        </p>
                      </div>
                      <strong className="entry-value">
                        {entry.kind === "execution"
                          ? "+" +
                            formatQuantity(entry.quantity, item.precision) +
                            " " +
                            item.unit
                          : money(entry.amountCents, project.currency)}
                      </strong>
                    </article>
                  );
                })}
            </div>
          </section>
        ) : null}
        <footer>
          <span>obra clara.</span>
          <span>
            Demonstração interativa · dados fictícios · sem sincronização entre
            dispositivos
          </span>
        </footer>
      </main>
      {dialog ? (
        <EntryDialog
          key={dialog.kind + dialog.packageId}
          project={project}
          {...dialog}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
  progress: amount,
  warning,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  progress?: number;
  warning?: boolean;
}) {
  return (
    <article className="metric-card">
      <div className="metric-label">
        {label}
        {icon}
      </div>
      <strong className={warning ? "negative" : ""}>{value}</strong>
      {amount !== undefined ? (
        <div className="progress-track">
          <span style={{ width: amount + "%" }} />
        </div>
      ) : null}
      <small>{note}</small>
    </article>
  );
}
