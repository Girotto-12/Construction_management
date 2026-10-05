"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  executed,
  leaves,
  formatQuantity,
  today,
  type Project,
  type ExecutionInput,
  type CostInput,
} from "@/lib/domain";
type Props = {
  project: Project;
  kind: "execution" | "cost";
  packageId?: string;
  onClose: () => void;
  onSave: (
    kind: "execution" | "cost",
    input: ExecutionInput | CostInput
  ) => Promise<void>;
};
export function EntryDialog({
  project,
  kind,
  packageId,
  onClose,
  onSave,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const request = useRef(crypto.randomUUID());
  const [itemId, setItemId] = useState(
    packageId ??
      leaves(project).find(i => executed(project, i) < i.quantity)?.id ??
      leaves(project)[0].id
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const item = leaves(project).find(i => i.id === itemId)!;
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const common = {
      requestId: request.current,
      packageId: itemId,
      date: String(form.get("date")),
    };
    try {
      const input =
        kind === "execution"
          ? {
              ...common,
              quantity: Number(form.get("quantity")),
              note: String(form.get("note") ?? ""),
            }
          : {
              ...common,
              amountCents: Math.round(Number(form.get("amount")) * 100),
              category: String(form.get("category")) as CostInput["category"],
              description: String(form.get("description") ?? ""),
            };
      await onSave(kind, input);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar. Tente novamente."
      );
      setBusy(false);
    }
  }
  const room = (id: string | null) =>
    project.rooms.find(r => r.id === id)?.name ?? "Toda a obra";
  return (
    <dialog
      ref={ref}
      className="entry-dialog"
      onCancel={e => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <form onSubmit={submit}>
        <div className="dialog-head">
          <div>
            <span className="eyebrow">DIÁRIO DA OBRA</span>
            <h2 id="dialog-title">
              {kind === "execution" ? "Registrar execução" : "Lançar custo"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            onClick={onClose}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </div>
        <label>
          Serviço da EAP
          <select
            name="package"
            value={itemId}
            onChange={e => {
              setItemId(e.target.value);
              request.current = crypto.randomUUID();
              setError("");
            }}
          >
            {leaves(project).map(i => (
              <option value={i.id} key={i.id}>
                {i.code} · {i.name} · {room(i.roomId)}
              </option>
            ))}
          </select>
        </label>
        <div className="form-summary">
          <span>{room(item.roomId)}</span>
          <strong>
            {kind === "execution"
              ? "Saldo: " +
                formatQuantity(
                  item.quantity - executed(project, item),
                  item.precision
                ) +
                " " +
                item.unit
              : "O custo será somado a esta etapa da EAP."}
          </strong>
        </div>
        <div className="form-grid">
          <label>
            Data
            <input
              name="date"
              type="date"
              required
              min={project.start}
              max={today(project.timezone)}
              defaultValue={today(project.timezone)}
            />
          </label>
          {kind === "execution" ? (
            <label>
              Quantidade ({item.unit})
              <input
                key={itemId}
                name="quantity"
                type="number"
                required
                min={1 / 10 ** item.precision}
                step={1 / 10 ** item.precision}
                max={Number(
                  (item.quantity - executed(project, item)).toFixed(
                    item.precision
                  )
                )}
                placeholder="Ex.: 10"
                autoFocus
              />
            </label>
          ) : (
            <label>
              Valor ({project.currency === "BRL" ? "R$" : "US$"})
              <input
                name="amount"
                type="number"
                required
                min=".01"
                max="1000000000"
                step=".01"
                placeholder="Ex.: 850,00"
                autoFocus
              />
            </label>
          )}
        </div>
        {kind === "execution" ? (
          <label>
            Observação <span className="optional">opcional</span>
            <textarea
              name="note"
              maxLength={1000}
              rows={3}
              placeholder="O que foi realizado neste ambiente?"
            />
          </label>
        ) : (
          <>
            <label>
              Categoria
              <select name="category">
                <option value="material">Material</option>
                <option value="mao-de-obra">Mão de obra</option>
                <option value="equipamento">Equipamento</option>
                <option value="outros">Outros</option>
              </select>
            </label>
            <label>
              Descrição
              <input
                name="description"
                required
                maxLength={300}
                placeholder="Ex.: argamassa e rejunte"
              />
            </label>
          </>
        )}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="form-hint">
          {kind === "execution"
            ? "A execução atualiza a planta e o avanço físico."
            : "O lançamento atualiza os custos da EAP. Ele não altera o avanço físico."}
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            {busy
              ? "Salvando…"
              : kind === "execution"
                ? "Salvar execução"
                : "Salvar custo"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
