import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../src/lib/demo";
import {
  addExecution,
  addCost,
  progress,
  roomProgress,
  totals,
  childrenOf,
  validDate,
} from "../src/lib/domain";
import { readDemo, serializeDemo } from "../src/lib/local-demo";
test("reference baseline and room quantities", () => {
  const p = createDemo();
  assert.equal(progress(p, "2026-10-04"), 53);
  assert.equal(
    roomProgress(p, "cozinha", "alvenaria", "2026-10-04", "actual"),
    50
  );
  const next = addExecution(
    p,
    {
      requestId: "one",
      packageId: "piso-cozinha",
      quantity: 15,
      date: "2026-10-04",
      note: "Piso",
    },
    "2026-10-04"
  );
  assert.equal(
    roomProgress(next, "cozinha", "pisos", "2026-10-04", "actual"),
    50
  );
  assert.equal(progress(next, "2026-10-04"), 54.5); // the kitchen is 3% of the new EAP
  assert.equal(roomProgress(next, "sala", "pisos", "2026-10-04", "actual"), 0);
  assert.equal(
    roomProgress(next, "cozinha", "pisos", "2026-10-03", "actual"),
    0
  );
});
test("budget rolls up only leaves; cost does not change physical progress", () => {
  const p = createDemo(),
    before = totals(p),
    groupBefore = totals(p, "9999-12-31", childrenOf(p, "acabamento"));
  const q = addCost(
    p,
    {
      requestId: "cost-one",
      packageId: "piso-cozinha",
      amountCents: 85000,
      date: "2026-10-04",
      category: "material",
      description: "Argamassa",
    },
    "2026-10-04"
  );
  assert.equal(totals(q).budget, before.budget);
  assert.equal(totals(q).spent, before.spent + 85000);
  assert.equal(
    totals(q, "9999-12-31", childrenOf(q, "acabamento")).spent,
    groupBefore.spent + 85000
  );
  assert.equal(progress(q, "2026-10-04"), 53);
});
test("reject excess, incorrect precision, invalid dates, group postings and non-finite values", () => {
  const p = createDemo(),
    base = {
      requestId: "x",
      packageId: "piso-cozinha",
      quantity: 31,
      date: "2026-10-04",
      note: "",
    };
  assert.throws(() => addExecution(p, base, "2026-10-04"), /saldo/);
  for (const quantity of [NaN, Infinity, -1, 0, 1.001])
    assert.throws(() => addExecution(p, { ...base, quantity }, "2026-10-04"));
  for (const date of ["2026-02-30", "2026-08-02", "2026-10-05"])
    assert.throws(() =>
      addExecution(p, { ...base, quantity: 1, date }, "2026-10-04")
    );
  assert.equal(validDate("2026-02-30"), false);
  assert.throws(() =>
    addExecution(
      p,
      { ...base, quantity: 1, packageId: "acabamento" },
      "2026-10-04"
    )
  );
  assert.throws(() =>
    addExecution(
      p,
      { ...base, quantity: 0.5, packageId: "ele-cozinha" },
      "2026-10-04"
    )
  );
  assert.equal(p.entries.length, 13);
});
test("safe replay, changed payload conflict and browser persistence", () => {
  const p = createDemo(),
    input = {
      requestId: "same",
      packageId: "piso-cozinha",
      quantity: 15,
      date: "2026-10-04",
      note: "Piso",
    };
  const q = addExecution(p, input, "2026-10-04");
  assert.equal(addExecution(q, input, "2026-10-04"), q);
  assert.throws(
    () => addExecution(q, { ...input, quantity: 10 }, "2026-10-04"),
    /outros dados/
  );
  const restored = readDemo(serializeDemo(q));
  assert.deepEqual(restored.entries, q.entries);
  assert.equal(progress(restored, "2026-10-04"), 54.5);
  assert.throws(() => readDemo('{"version":2}'));
});
test("planned simulation never creates an executed measurement", () => {
  const p = createDemo();
  assert.equal(
    roomProgress(p, "cozinha", "pisos", "2026-11-06", "planned"),
    100
  );
  assert.equal(roomProgress(p, "cozinha", "pisos", "2026-11-06", "actual"), 0);
  assert.equal(progress(p, "2026-12-18", "planned"), 100);
});
