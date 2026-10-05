import Link from "next/link";
import { Building2 } from "lucide-react";
import { configured } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth-form";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ confirmacao?: string }>;
}) {
  const { confirmacao } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/demo" className="brand">
          <span className="brand-symbol">
            <Building2 size={25} />
          </span>
          obra clara<span className="brand-dot">.</span>
        </Link>
        <h1>Seu espaço de trabalho</h1>
        {configured() ? (
          <>
            <p>Entre para acessar as empresas vinculadas à sua conta.</p>
            {confirmacao === "erro" ? (
              <p role="alert" className="form-error">
                O link de confirmação não pôde ser validado. Tente entrar ou
                solicite um novo link.
              </p>
            ) : null}
            <AuthForm />
          </>
        ) : (
          <>
            <p>
              O espaço da empresa está em preparação. Você já pode explorar a
              planta, registrar execução e acompanhar custos na demonstração.
            </p>
            <Link href="/demo" className="button primary full">
              Explorar demonstração
            </Link>
          </>
        )}
        <Link className="auth-bottom" href="/demo">
          Voltar para a obra de exemplo
        </Link>
      </section>
    </main>
  );
}
