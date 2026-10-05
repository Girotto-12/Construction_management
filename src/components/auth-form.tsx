"use client";
import { useActionState, useState } from "react";
import { authenticate } from "@/app/entrar/actions";
export function AuthForm() {
  const [state, action, pending] = useActionState(authenticate, {
    message: "",
  });
  const [signup, setSignup] = useState(false);
  return (
    <form action={action}>
      <input type="hidden" name="intent" value={signup ? "signup" : "login"} />
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Senha
        <input
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={8}
          maxLength={128}
          required
        />
      </label>
      {state.message ? (
        <p role="status" className="form-hint">
          {state.message}
        </p>
      ) : null}
      <button className="button primary full" disabled={pending}>
        {pending ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}
      </button>
      <button
        type="button"
        className="button secondary full"
        disabled={pending}
        onClick={() => setSignup(!signup)}
      >
        {signup ? "Já tenho uma conta" : "Quero criar minha conta"}
      </button>
    </form>
  );
}
