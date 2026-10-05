import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient, configured } from "@/lib/supabase/server";
import { CompanyForm } from "@/components/company-form";
import { signOut } from "@/app/entrar/actions";
export const dynamic = "force-dynamic";
export default async function Companies() {
  if (!configured()) redirect("/entrar");
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: companies, error } = await client
    .from("companies")
    .select("id,name")
    .order("created_at");
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Suas empresas</h1>
        <p>Seu vínculo define quais empresas você pode acessar.</p>
        {error ? (
          <p role="alert">
            Não foi possível carregar as empresas. Tente novamente mais tarde.
          </p>
        ) : companies?.length ? (
          <div className="company-list">
            {companies.map(company => (
              <div key={company.id}>
                <strong>{company.name}</strong>
              </div>
            ))}
          </div>
        ) : (
          <CompanyForm requestId={crypto.randomUUID()} />
        )}
        <p>
          O cadastro de obras reais será conectado na próxima etapa. O fluxo de
          planta e EAP já pode ser testado com uma obra de exemplo.
        </p>
        <Link href="/demo" className="button secondary full">
          Abrir obra de exemplo
        </Link>
        <form action={signOut}>
          <button className="button secondary full">Sair da conta</button>
        </form>
      </section>
    </main>
  );
}
