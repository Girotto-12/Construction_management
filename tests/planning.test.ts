import test from "node:test";
import assert from "node:assert/strict";
import {
  createLegacyResidentialPlan as createResidentialPlan,
  validatePlan,
  schedulePlan,
  resourcePlan,
  resourceConflicts,
  readPlan,
} from "../src/lib/planning";
test("residential schedule respects weekends, parallel work and predecessor changes", () => {
  const p = createResidentialPlan();
  validatePlan(p);
  const a = schedulePlan(p);
  assert.equal(a[0].start, "2026-10-05");
  assert.equal(a[0].end, "2026-10-16");
  assert.equal(a[1].start, "2026-10-19");
  assert.equal(
    a.find(t => t.id === "cobertura")!.start,
    a.find(t => t.id === "instalacoes")!.start
  );
  assert.ok(
    a.find(t => t.id === "revestimento")!.start >
      a.find(t => t.id === "instalacoes")!.end
  );
  const changed = {
    ...p,
    tasks: p.tasks.map(t => (t.id === "fundacao" ? { ...t, duration: 20 } : t)),
  };
  validatePlan(changed);
  assert.ok(schedulePlan(changed).at(-1)!.end > a.at(-1)!.end);
  assert.equal(
    readPlan(JSON.stringify(changed)).tasks.find(t => t.id === "fundacao")!
      .duration,
    20
  );
  assert.throws(
    () =>
      validatePlan({
        ...p,
        tasks: p.tasks.map(t =>
          t.id === "preparo" ? { ...t, predecessors: ["entrega"] } : t
        ),
      }),
    /ciclo/
  );
  assert.throws(
    () =>
      validatePlan({
        ...p,
        tasks: p.tasks.map(t =>
          t.id === "fundacao" ? { ...t, duration: 2 } : t
        ),
      }),
    /período/
  );
});
test("rental includes calendar weekends and transport, while team uses working days", () => {
  const p = createResidentialPlan(),
    tasks = schedulePlan(p),
    base = p.resources.find(r => r.id === "andaime")!;
  const rental = {
    ...base,
    taskId: "preparo",
    offset: 4,
    duration: 2,
    quantity: 1,
    unitCostCents: 10000,
    transportCents: 2000,
  };
  const r = resourcePlan(rental, tasks);
  assert.equal(r.start, "2026-10-09");
  assert.equal(r.end, "2026-10-12");
  assert.equal(r.calendarDays, 4);
  assert.equal(r.total, 42000);
  assert.equal(resourcePlan({ ...rental, kind: "team" }, tasks).total, 20000);
  assert.equal(
    resourcePlan({ ...rental, kind: "material", leadDays: 7 }, tasks).orderBy,
    "2026-10-02"
  );
  const overlap = { ...rental, id: "other" };
  assert.equal(
    resourceConflicts({ ...p, resources: [rental, overlap] }, tasks).length,
    1
  );
  assert.equal(
    resourceConflicts(
      { ...p, resources: [rental, { ...overlap, offset: 7, duration: 1 }] },
      tasks
    ).length,
    0
  );
});
