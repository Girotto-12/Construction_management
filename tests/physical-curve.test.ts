import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../src/lib/demo";
import { physicalCurve } from "../src/lib/physical-curve";
import { addExecution, progress } from "../src/lib/domain";
test("physical curve preserves dates, cumulative execution, and future gaps", () => {
  const project = createDemo();
  const series = physicalCurve(project, "2026-10-04");
  assert.equal(series[0].date, project.start);
  assert.equal(series.at(-1)?.date, project.end);
  assert.equal(series.at(-1)?.planned, 100);
  assert.equal(
    series.find(p => p.date === "2026-10-04")?.actual,
    progress(project, "2026-10-04")
  );
  assert.equal(series.find(p => p.date === "2026-10-05")?.actual, null);
  const next = addExecution(
    project,
    {
      requestId: "curve",
      packageId: "piso-cozinha",
      date: "2026-10-04",
      quantity: 15,
      note: "",
    },
    "2026-10-04"
  );
  const updated = physicalCurve(next, "2026-10-04");
  assert.equal(updated.find(p => p.date === "2026-10-04")?.actual, 54.5);
  assert.equal(
    updated.find(p => p.date === "2026-10-03")?.actual,
    series.find(p => p.date === "2026-10-03")?.actual
  );
  assert.deepEqual(
    updated.map(p => p.planned),
    series.map(p => p.planned)
  );
  assert.equal(physicalCurve(project, "2026-12-20").at(-1)?.date, "2026-12-20");
  assert.ok(physicalCurve(project, "2026-08-01").every(p => p.actual === null));
});
