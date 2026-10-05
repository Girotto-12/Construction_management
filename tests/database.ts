import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
async function run() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
  await db.exec(
    await readFile("supabase/migrations/20261004155758_foundation.sql", "utf8")
  );
  async function asUser(id: string) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("set role authenticated");
  }
  await asUser("11111111-1111-4111-8111-111111111111");
  const a = await db.query<{ id: string }>(
    "select public.create_company('Empresa A','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') id"
  );
  const replay = await db.query<{ id: string }>(
    "select public.create_company('Empresa A','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') id"
  );
  assert.equal(a.rows[0].id, replay.rows[0].id);
  await assert.rejects(() =>
    db.query(
      "select public.create_company('Outro nome','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')"
    )
  );
  assert.equal(
    (await db.query("select * from public.companies")).rows.length,
    1
  );
  await asUser("22222222-2222-4222-8222-222222222222");
  assert.equal(
    (await db.query("select * from public.companies")).rows.length,
    0
  );
  await db.query(
    "select public.create_company('Empresa B','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')"
  );
  const visible = await db.query<{ name: string }>(
    "select name from public.companies"
  );
  assert.deepEqual(visible.rows, [{ name: "Empresa B" }]);
  await assert.rejects(() =>
    db.query(
      "insert into public.company_memberships(company_id,user_id,role) values($1,'22222222-2222-4222-8222-222222222222','admin')",
      [a.rows[0].id]
    )
  );
  await db.exec("reset role; set role anon");
  await assert.rejects(() =>
    db.query(
      "select public.create_company('Anonymous','cccccccc-cccc-4ccc-8ccc-cccccccccccc')"
    )
  );
  await db.exec("reset role");
  await db.query(
    "update public.company_memberships set active=false where company_id=$1",
    [a.rows[0].id]
  );
  await asUser("11111111-1111-4111-8111-111111111111");
  assert.equal(
    (await db.query("select * from public.companies")).rows.length,
    0
  );
  await assert.rejects(() =>
    db.query(
      "select public.create_company('Empresa A','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')"
    )
  );
  await db.close();
  console.log(
    "OK: migration, tenant isolation, direct-write denial, anonymous denial, idempotency and revocation (local PostgreSQL/PGlite)."
  );
}
run().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
