import { createDemo } from "./demo";
import {
  addExecution,
  addCost,
  type Project,
  type Entry,
  type Cost,
} from "./domain";
export const DEMO_KEY = "obra-clara.demo.v1";
export function readDemo(raw: string | null): Project {
  let project = createDemo();
  if (!raw) return project;
  const data = JSON.parse(raw) as {
    version: number;
    entries: Entry[];
    costs: Cost[];
  };
  if (
    data.version !== 1 ||
    !Array.isArray(data.entries) ||
    !Array.isArray(data.costs)
  )
    throw Error("Não foi possível ler os dados salvos desta demonstração.");
  for (const entry of data.entries) {
    if (
      typeof entry.requestId !== "string" ||
      typeof entry.note !== "string" ||
      typeof entry.createdAt !== "string" ||
      typeof entry.id !== "string"
    )
      throw Error("Registro salvo inválido.");
    const next = addExecution(project, entry);
    if (next !== project)
      next.entries[next.entries.length - 1] = {
        ...next.entries[next.entries.length - 1],
        id: entry.id,
        createdAt: entry.createdAt,
      };
    project = next;
  }
  for (const cost of data.costs) {
    if (
      typeof cost.requestId !== "string" ||
      typeof cost.description !== "string" ||
      typeof cost.createdAt !== "string" ||
      typeof cost.id !== "string"
    )
      throw Error("Custo salvo inválido.");
    const next = addCost(project, cost);
    if (next !== project)
      next.costs[next.costs.length - 1] = {
        ...next.costs[next.costs.length - 1],
        id: cost.id,
        createdAt: cost.createdAt,
      };
    project = next;
  }
  return project;
}
export function serializeDemo(project: Project) {
  const seed = createDemo();
  const entries = new Set(seed.entries.map(e => e.id)),
    costs = new Set(seed.costs.map(c => c.id));
  return JSON.stringify({
    version: 1,
    entries: project.entries.filter(e => !entries.has(e.id)),
    costs: project.costs.filter(c => !costs.has(c.id)),
  });
}
