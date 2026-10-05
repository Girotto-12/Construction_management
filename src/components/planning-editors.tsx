"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  type Plan,
  type PlanTask,
  type PlanResource,
  type ResourceKind,
} from "@/lib/planning";
export const kindNames: Record<ResourceKind, string> = {
  material: "Materiais",
  contract: "Contratações",
  team: "Equipes",
  machine: "Máquinas e aluguéis",
};
function Editor({
  title,
  children,
  onClose,
  onSubmit,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(new FormData(e.currentTarget));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="entry-dialog planning-dialog"
      aria-labelledby="planning-editor-title"
      onCancel={e => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-head">
          <h2 id="planning-editor-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar no rascunho"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function TaskEditor({
  afterId,
  plan,
  item,
  onClose,
  onSave,
}: {
  plan: Plan;
  item?: PlanTask;
  afterId?: string;
  onClose: () => void;
  onSave: (p: Plan) => Promise<void>;
}) {
  return (
    <Editor
      title={item ? "Editar serviço" : "Adicionar serviço"}
      onClose={onClose}
      onSubmit={async f => {
        const task: PlanTask = {
          phase: item?.phase ?? plan.tasks.find(t => t.id === afterId)?.phase,
          owner: item?.owner,
          id: item?.id ?? crypto.randomUUID(),
          name: String(f.get("name")).trim(),
          duration: Number(f.get("duration")),
          quantity: Number(f.get("quantity")),
          unit: String(f.get("unit")).trim(),
          weight: Number(f.get("weight")),
          predecessors: f.getAll("predecessors").map(String),
        };
        await onSave({
          ...plan,
          tasks: item
            ? plan.tasks.map(t => (t.id === item.id ? task : t))
            : afterId ? plan.tasks.flatMap(t => t.id === afterId ? [t, task] : [t]) : [...plan.tasks, task],
        });
      }}
    >
      {afterId ? <p className="panel-note">Inserir abaixo de: {plan.tasks.find(t => t.id === afterId)?.name}. A posição não cria dependências; escolha as predecessoras abaixo.</p> : null}
      <label>
        Nome do serviço
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={item?.name}
          autoFocus
        />
      </label>
      <div className="form-grid">
        <label>
          Duração (dias úteis)
          <input
            name="duration"
            type="number"
            min="1"
            max="365"
            step="1"
            required
            defaultValue={item?.duration ?? 5}
          />
        </label>
        <label>
          Peso no avanço físico (%)
          <input
            name="weight"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            defaultValue={item?.weight ?? 0}
          />
        </label>
        <label>
          Quantidade prevista
          <input
            name="quantity"
            type="number"
            min="0.001"
            max="1000000000"
            step="0.001"
            required
            defaultValue={item?.quantity ?? 1}
          />
        </label>
        <label>
          Unidade
          <input
            name="unit"
            required
            maxLength={25}
            defaultValue={item?.unit ?? "serviço"}
          />
        </label>
      </div>
      <fieldset className="planning-predecessors">
        <legend>Começar depois de concluir</legend>
        {plan.tasks
          .filter(t => t.id !== item?.id)
          .map(t => (
            <label key={t.id}>
              <input
                type="checkbox"
                name="predecessors"
                value={t.id}
                defaultChecked={item?.predecessors.includes(t.id)}
              />
              {t.name}
            </label>
          ))}
      </fieldset>
      <p className="form-hint">
        Sem predecessora, começa no início da obra. Calendário: segunda a sexta,
        sem feriados. Reduzir a duração exige acomodar os recursos já
        vinculados.
      </p>
    </Editor>
  );
}
export function ResourceEditor({
  plan,
  item,
  kind,
  onClose,
  onSave,
}: {
  plan: Plan;
  item?: PlanResource;
  kind: ResourceKind;
  onClose: () => void;
  onSave: (p: Plan) => Promise<void>;
}) {
  const [taskId, setTaskId] = useState(item?.taskId ?? plan.tasks[0].id),
    task = plan.tasks.find(t => t.id === taskId)!;
  const daily = kind === "machine" || kind === "team";
  return (
    <Editor
      title={(item ? "Editar · " : "Adicionar · ") + kindNames[kind]}
      onClose={onClose}
      onSubmit={async f => {
        const resource: PlanResource = {
          id: item?.id ?? crypto.randomUUID(),
          taskId,
          kind,
          name: String(f.get("name")).trim(),
          quantity: Number(f.get("quantity")),
          unit: String(f.get("unit")).trim(),
          unitCostCents: Math.round(Number(f.get("price")) * 100),
          leadDays: Number(f.get("lead")),
          offset: Number(f.get("offset")),
          duration: Number(f.get("duration")),
          supplier: String(f.get("supplier")).trim(),
          status: String(f.get("status")) as PlanResource["status"],
          transportCents:
            kind === "machine"
              ? Math.round(Number(f.get("transport")) * 100)
              : 0,
        };
        await onSave({
          ...plan,
          resources: item
            ? plan.resources.map(r => (r.id === item.id ? resource : r))
            : [...plan.resources, resource],
        });
      }}
    >
      <label>
        {kind === "contract" ? "Escopo da contratação" : "Nome do recurso"}
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={item?.name}
          autoFocus
        />
      </label>
      <label>
        Serviço da EAP
        <select value={taskId} onChange={e => setTaskId(e.target.value)}>
          {plan.tasks.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Quantidade
          <input
            name="quantity"
            type="number"
            required
            min="0.001"
            max="1000000000"
            step="0.001"
            defaultValue={item?.quantity ?? 1}
          />
        </label>
        <label>
          Unidade
          <input
            name="unit"
            required
            maxLength={25}
            defaultValue={
              item?.unit ??
              (kind === "machine"
                ? "máquina/dia"
                : kind === "team"
                  ? "pessoa/dia"
                  : "unidade")
            }
          />
        </label>
        <label>
          {daily ? "Preço por unidade / dia" : "Preço por unidade"} (
          {plan.currency})
          <input
            name="price"
            type="number"
            min="0"
            max="1000000000"
            step="0.01"
            required
            defaultValue={(item?.unitCostCents ?? 0) / 100}
          />
        </label>
        <label>
          Antecedência de compra / reserva (dias corridos)
          <input
            name="lead"
            type="number"
            min="0"
            max="365"
            step="1"
            required
            defaultValue={item?.leadDays ?? 7}
          />
        </label>
        <label>
          Começar após (dias úteis do serviço)
          <input
            name="offset"
            type="number"
            min="0"
            max={task.duration - 1}
            step="1"
            required
            defaultValue={item?.offset ?? 0}
          />
        </label>
        <label>
          {kind === "material" ? "Janela de uso" : "Duração da alocação"} (dias
          úteis)
          <input
            name="duration"
            type="number"
            min="1"
            max={task.duration}
            step="1"
            required
            defaultValue={item?.duration ?? 1}
          />
        </label>
      </div>
      <label>
        Fornecedor / equipe responsável
        <input
          name="supplier"
          maxLength={100}
          defaultValue={item?.supplier ?? "A definir"}
        />
      </label>
      <label>
        Situação do planejamento
        <select name="status" defaultValue={item?.status ?? "planned"}>
          <option value="planned">A planejar</option>
          <option value="quoting">Em cotação</option>
          <option value="reserved">Previsto / reservado</option>
        </select>
      </label>
      {kind === "machine" ? (
        <label>
          Transporte total ({plan.currency})
          <input
            name="transport"
            type="number"
            required
            min="0"
            max="1000000000"
            step="0.01"
            defaultValue={(item?.transportCents ?? 0) / 100}
          />
        </label>
      ) : null}
      <p className="form-hint">
        {kind === "machine"
          ? "Locação estimada por dias corridos entre retirada e devolução, incluindo fins de semana, mais transporte."
          : kind === "team"
            ? "Equipe estimada por quantidade × diária × dias úteis alocados."
            : "Estimativa = quantidade × preço unitário; o período não multiplica o valor."}{" "}
        Reservas e contratações são anotações locais; nenhum pedido é enviado.
      </p>
    </Editor>
  );
}
