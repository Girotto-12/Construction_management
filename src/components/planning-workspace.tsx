"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Plus,
  CalendarDays,
  Layers3,
  Package,
  Users,
  Truck,
  FileCheck,
} from "lucide-react";
import {
  PLAN_KEY,
  createResidentialPlan,
  readPlan,
  validatePlan,
  schedulePlan,
  resourcePlan,
  resourceConflicts,
  type Plan,
  type ResourceKind,
} from "@/lib/planning";
import { money, shortDate, formatQuantity, percent } from "@/lib/domain";
import { TaskEditor, ResourceEditor, kindNames } from "./planning-editors";
import { PlanningGantt } from "./planning-gantt";
type Tab = "schedule" | ResourceKind;
const tabs: { id: Tab; name: string; icon: typeof CalendarDays }[] = [
  { id: "schedule", name: "EAP e cronograma", icon: CalendarDays },
  { id: "material", name: "Materiais", icon: Package },
  { id: "contract", name: "Contratações", icon: FileCheck },
  { id: "team", name: "Equipes", icon: Users },
  { id: "machine", name: "Máquinas e aluguéis", icon: Truck },
];
const statuses = {
  planned: "A planejar",
  quoting: "Em cotação",
  reserved: "Previsto / reservado",
};
export function PlanningWorkspace() {
  const [plan, setPlan] = useState<Plan>(createResidentialPlan),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [tab, setTab] = useState<Tab>("schedule");
  const [editor, setEditor] = useState<{
    kind: "task" | ResourceKind;
    id?: string;
    afterId?: string;
    base: Plan;
  } | null>(null);
  useEffect(() => {
    const load = () => {
      try {
        setPlan(readPlan(localStorage.getItem(PLAN_KEY)));
        setReady(true);
        setError("");
      } catch {
        setReady(false);
        setError(
          "Não foi possível ler o planejamento salvo. Os dados foram preservados."
        );
      }
    };
    load();
    const listener = (e: StorageEvent) => {
      if (e.key === PLAN_KEY || e.key === null) load();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  const tasks = useMemo(() => schedulePlan(plan), [plan]);
  const conflicts = useMemo(
    () => resourceConflicts(plan, tasks),
    [plan, tasks]
  );
  const estimated = plan.resources.reduce(
    (sum, r) => sum + resourcePlan(r, tasks).total,
    0
  );
  const finish = tasks
    .map(t => t.end)
    .sort()
    .at(-1)!;
  const weight =
    Math.round(plan.tasks.reduce((sum, t) => sum + t.weight, 0) * 100) / 100;
  async function save(candidate: Plan) {
    const commit = async () => {
      const current = readPlan(localStorage.getItem(PLAN_KEY));
      if (current.revision !== candidate.revision)
        throw Error(
          "O rascunho mudou em outra aba. Feche o formulário e reabra para usar a versão atual."
        );
      const next = validatePlan({
        ...candidate,
        revision: current.revision + 1,
      });
      localStorage.setItem(PLAN_KEY, JSON.stringify(next));
      setPlan(next);
      setNotice(
        "Rascunho salvo neste navegador. Datas e necessidades recalculadas."
      );
      setError("");
    };
    if (navigator.locks) await navigator.locks.request(PLAN_KEY, commit);
    else await commit();
  }
  async function settings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await save({
        ...plan,
        name: String(f.get("name")).trim(),
        start: String(f.get("start")),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }
  async function remove(kind: "task" | "resource", id: string) {
    try {
      if (
        kind === "task" &&
        (plan.tasks.some(t => t.predecessors.includes(id)) ||
          plan.resources.some(r => r.taskId === id))
      )
        throw Error(
          "Remova os vínculos de predecessoras e recursos antes de remover este serviço."
        );
      await save({
        ...plan,
        tasks:
          kind === "task" ? plan.tasks.filter(t => t.id !== id) : plan.tasks,
        resources:
          kind === "resource"
            ? plan.resources.filter(r => r.id !== id)
            : plan.resources,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover.");
    }
  }
  return (
    <div className="client-shell">
      <header className="client-header">
        <Link href="/demo" className="brand">
          <span className="brand-symbol">
            <Building2 size={24} />
          </span>
          obra clara<span className="brand-dot">.</span>
        </Link>
        <Link href="/modelo/demo" className="account-link">Modelo da cozinha</Link>
        <Link href="/materiais/demo" className="account-link">Materiais e compras</Link>
        <span className="client-header-label">PLANEJAMENTO DA OBRA</span>
        <Link href="/demo" className="account-link">
          <ArrowLeft size={15} />
          Voltar à obra
        </Link>
      </header>
      <main className="client-main planning-main">
        <section className="page-title">
          <div>
            <span className="eyebrow">MODELO RESIDENCIAL · RASCUNHO</span>
            <h1>Planeje antes de executar.</h1>
            <p>Adapte os serviços e organize o que cada frente vai precisar.</p>
          </div>
          <span className="small-chip">Salvo neste navegador</span>
        </section>
        <p className="planning-intro">
          US single-family home: 12 phases with editable durations and dependencies. Quantities are examples; prices require quotes. Inspection dates are allowances, not approvals. Monday–Friday calendar excludes weekends only. The previous draft is preserved separately.
        </p>
        {error ? (
          <p role="alert" className="alert error">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="alert success">
            {notice}
          </p>
        ) : null}
        {!ready && !error ? <p role="status">Abrindo o modelo…</p> : null}
        {ready ? (
          <>
            <section className="panel planning-settings">
              <form onSubmit={settings} key={plan.revision}>
                <label>
                  Nome do planejamento
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={plan.name}
                  />
                </label>
                <label>
                  Início previsto
                  <input
                    name="start"
                    type="date"
                    min="2000-01-01"
                    max="2090-12-31"
                    required
                    defaultValue={plan.start}
                  />
                </label>
                <button className="button secondary">
                  Salvar e recalcular
                </button>
              </form>
              <p className="panel-note">
                Segunda a sexta, sem feriados. Dependências término–início: o
                próximo serviço começa no dia útil seguinte.
              </p>
            </section>
            <section className="client-facts planning-facts">
              <article>
                <CalendarDays size={20} />
                <div>
                  <span>Entrega calculada do rascunho</span>
                  <strong>
                    {shortDate(finish)} de {finish.slice(0, 4)}
                  </strong>
                  <small>Recalculada pelas dependências</small>
                </div>
              </article>
              <article>
                <Layers3 size={20} />
                <div>
                  <span>Serviços e recursos</span>
                  <strong>
                    {tasks.length} serviços · {plan.resources.length} recursos
                  </strong>
                  <small>Pesos físicos: {percent(weight)}%</small>
                </div>
              </article>
              <article>
                <Package size={20} />
                <div>
                  <span>Estimativa dos recursos cadastrados</span>
                  <strong>{estimated ? money(estimated, plan.currency) : "Quotes pending · USD"}</strong>
                  <small>{plan.resources.filter(r => r.unitCostCents === 0).length} recursos sem preço · orçamento incompleto</small>
                </div>
              </article>
            </section>
            {weight !== 100 ? (
              <p className="planning-warning">
                Os pesos somam {percent(weight)}%. Ajuste para 100% antes de
                usar esta base no avanço físico.
              </p>
            ) : null}
            {conflicts.length ? (
              <div className="planning-warning">
                <strong>Possíveis conflitos de alocação</strong>
                <ul>
                  {conflicts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <p>
                  Confira se o mesmo nome representa uma equipe ou equipamento
                  compartilhado.
                </p>
              </div>
            ) : null}
            <nav className="planning-tabs" aria-label="Áreas do planejamento">
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={tab === t.id ? "selected" : ""}
                  aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => setTab(t.id)}
                >
                  <t.icon size={17} />
                  {t.name}
                </button>
              ))}
            </nav>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {tab === "schedule"
                      ? "Serviços e sequência da obra"
                      : kindNames[tab]}
                  </h2>
                  <p>
                    {tab === "schedule"
                      ? "Edite as durações e predecessoras para recalcular a entrega."
                      : tab === "material"
                        ? "Organize as quantidades e quando iniciar cada compra."
                        : tab === "machine"
                          ? "Planeje retirada, devolução, diárias e transporte."
                          : "Distribua escopos e responsáveis entre os serviços."}
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() =>
                    setEditor({
                      kind: tab === "schedule" ? "task" : tab,
                      base: plan,
                    })
                  }
                >
                  <Plus size={17} />
                  {tab === "schedule"
                    ? "Adicionar serviço"
                    : "Adicionar recurso"}
                </button>
              </div>
              {tab === "schedule" ? (
                <>
<PlanningGantt onInsert={afterId => setEditor({kind:"task",afterId,base:plan})} tasks={tasks} onEdit={id => setEditor({kind:"task",id,base:plan})} />
<details><summary className="gantt-details-toggle">Detailed activity table · quantities, weights and actions</summary>
<div className="table-scroll">
                  <table className="planning-table">
                    <thead>
                      <tr>
                        <th>Serviço / EAP</th>
                        <th>Quantidade</th>
                        <th>Duração</th>
                        <th>Depende de</th>
                        <th>Início</th>
                        <th>Fim</th>
                        <th>Peso</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, i) => (
                        <tr key={t.id}>
                          <td>
                            <strong>
                              {String(i + 1).padStart(2, "0")} · {t.name}
                            </strong>
                            <div>{t.phase}</div><small>{t.owner}</small>
                          </td>
                          <td>
                            {formatQuantity(t.quantity, 3)} {t.unit}
                          </td>
                          <td>{t.duration} dias úteis</td>
                          <td>
                            {t.predecessors
                              .map(id => tasks.find(t => t.id === id)?.name)
                              .join(", ") || "Início da obra"}
                          </td>
                          <td>{shortDate(t.start)}</td>
                          <td>{shortDate(t.end)}</td>
                          <td>{percent(t.weight)}%</td>
                          <td>
                            <div className="planning-actions">
                              <button className="text-button" onClick={() => setEditor({kind:"task",afterId:t.id,base:plan})}>Inserir abaixo</button>
                              <button
                                className="text-button"
                                aria-label={"Editar " + t.name}
                                onClick={() =>
                                  setEditor({
                                    kind: "task",
                                    id: t.id,
                                    base: plan,
                                  })
                                }
                              >
                                Editar
                              </button>
                              <button
                                className="text-button"
                                aria-label={"Remover " + t.name}
                                onClick={() => remove("task", t.id)}
                              >
                                Remover
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></details></>
              ) : (
                <div className="planning-resource-list">
                  {plan.resources
                    .filter(r => r.kind === tab)
                    .map(r => {
                      const dates = resourcePlan(r, tasks);
                      return (
                        <article key={r.id} className="planning-resource">
                          <div className="planning-resource-heading">
                            <div>
                              <span className="eyebrow">
                                {tasks.find(t => t.id === r.taskId)?.name}
                              </span>
                              <h3>{r.name}</h3>
                              <p>
                                {r.supplier || "Responsável a definir"} ·{" "}
                                {statuses[r.status]}
                              </p>
                            </div>
                            <strong>{r.unitCostCents ? money(dates.total, plan.currency) : "Quote pending"}</strong>
                          </div>
                          <dl>
                            <div>
                              <dt>Quantidade</dt>
                              <dd>
                                {formatQuantity(r.quantity, 3)} {r.unit}
                              </dd>
                            </div>
                            <div>
                              <dt>
                                {tab === "material"
                                  ? "Necessário em"
                                  : "Início / retirada"}
                              </dt>
                              <dd>{shortDate(dates.start)}</dd>
                            </div>
                            <div>
                              <dt>
                                {tab === "machine"
                                  ? "Devolução prevista"
                                  : "Fim da alocação"}
                              </dt>
                              <dd>{shortDate(dates.end)}</dd>
                            </div>
                            <div>
                              <dt>Comprar / reservar até</dt>
                              <dd>{shortDate(dates.orderBy)}</dd>
                            </div>
                          </dl>
                          <p className="planning-resource-detail">
                            {tab === "machine"
                              ? dates.calendarDays +
                                " dias corridos de locação + " +
                                money(r.transportCents, plan.currency) +
                                " de transporte"
                              : tab === "team"
                                ? r.duration +
                                  " dias úteis × quantidade × diária"
                                : "Quantidade × preço unitário"}{" "}
                            · Preço: {money(r.unitCostCents, plan.currency)}
                          </p>
                          <div className="planning-actions">
                            <button
                              className="text-button"
                              aria-label={"Editar " + r.name}
                              onClick={() =>
                                setEditor({
                                  kind: r.kind,
                                  id: r.id,
                                  base: plan,
                                })
                              }
                            >
                              Editar
                            </button>
                            <button
                              className="text-button"
                              aria-label={"Remover " + r.name}
                              onClick={() => remove("resource", r.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  {!plan.resources.some(r => r.kind === tab) ? (
                    <p className="planning-intro">
                      Nenhum recurso nesta categoria. Adicione o primeiro
                      vinculado a um serviço.
                    </p>
                  ) : null}
                </div>
              )}
            </section>
            <p className="planning-intro planning-bottom">
              Materiais e contratações devem ter escopos separados para evitar
              dupla contagem. As estimativas não geram compras, contratos,
              reservas ou lançamentos financeiros. Publicar o planejamento na
              obra será uma próxima etapa.
            </p>
          </>
        ) : null}
        <footer>
          <span>obra clara.</span>
          <span>Planejamento residencial · demonstração local</span>
        </footer>
      </main>
      {editor?.kind === "task" ? (
        <TaskEditor
          afterId={editor.afterId}
          plan={editor.base}
          item={editor.base.tasks.find(t => t.id === editor.id)}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      ) : editor ? (
        <ResourceEditor
          plan={editor.base}
          kind={editor.kind}
          item={editor.base.resources.find(r => r.id === editor.id)}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}
