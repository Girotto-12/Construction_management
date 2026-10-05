import { NextResponse, type NextRequest } from "next/server";
import { serverClient, configured } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  if (!configured())
    return NextResponse.redirect(new URL("/entrar", request.url));
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const client = await serverClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/app", request.url));
  }
  return NextResponse.redirect(
    new URL("/entrar?confirmacao=erro", request.url)
  );
}
