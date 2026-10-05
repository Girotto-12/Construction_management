"use client";
import { useActionState } from "react";
import { createCompany } from "@/app/app/actions";
export function CompanyForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(createCompany, {
    message: "",
  });
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <label>
        Nome da empresa
        <input
          name="name"
          minLength={2}
          maxLength={100}
          required
          placeholder="Sua construtora"
        />
      </label>
      <button className="button primary full" disabled={pending}>
        {pending ? "Criando…" : "Criar empresa"}
      </button>
      {state.message ? <p role="status">{state.message}</p> : null}
    </form>
  );
}
