"use server";
import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";
export async function createCompany(
  _state: { message: string },
  form: FormData
): Promise<{ message: string }> {
  const name = String(form.get("name") ?? "").trim(),
    requestId = String(form.get("requestId") ?? "");
  if (
    name.length < 2 ||
    name.length > 100 ||
    !/^[0-9a-f-]{36}$/i.test(requestId)
  )
    return { message: "Informe um nome de empresa entre 2 e 100 caracteres." };
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { message: "Sua sessão terminou. Entre novamente." };
  const { error } = await client.rpc("create_company", {
    company_name: name,
    request_id: requestId,
  });
  if (error)
    return {
      message:
        "Não foi possível criar a empresa. Confira a conexão e tente novamente.",
    };
  revalidatePath("/app");
  return { message: "Empresa criada." };
}
