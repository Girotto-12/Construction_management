"use server";
import { redirect } from "next/navigation";
import { serverClient, configured } from "@/lib/supabase/server";
export type AuthState = { message: string };
export async function authenticate(
  _previous: AuthState,
  form: FormData
): Promise<AuthState> {
  if (!configured())
    return {
      message:
        "A conexão da empresa está em preparação. A demonstração já está disponível.",
    };
  const email = String(form.get("email") ?? "").trim(),
    password = String(form.get("password") ?? "");
  if (!email || password.length < 8 || password.length > 128)
    return {
      message:
        "Confira o e-mail e informe uma senha com pelo menos 8 caracteres.",
    };
  const client = await serverClient(),
    intent = String(form.get("intent"));
  if (intent === "signup") {
    const origin = process.env.NEXT_PUBLIC_SITE_URL;
    if (!origin)
      return { message: "A criação de contas ainda está em preparação." };
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL("/auth/confirmar", origin).toString(),
      },
    });
    if (error)
      return {
        message:
          "Não foi possível criar a conta. Confira os dados e tente novamente mais tarde.",
      };
    if (!data.session)
      return {
        message:
          "Confira seu e-mail para confirmar o cadastro e depois entre na sua conta.",
      };
  } else {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error)
      return {
        message:
          "Não foi possível entrar. Confira e-mail, senha e confirmação do cadastro.",
      };
  }
  redirect("/app");
}
export async function signOut() {
  const client = await serverClient();
  await client.auth.signOut();
  redirect("/entrar");
}
