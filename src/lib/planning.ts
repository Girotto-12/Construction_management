import Decimal from "decimal.js";
import { validDate } from "./domain";
import { createUsResidentialPlan } from "./us-residential-template";
export const PLAN_KEY = "obra-clara.planning.us.v1";
export const createResidentialPlan = createUsResidentialPlan;
export type PlanTask = {
  id: string;
  name: string;
  phase?: string;
  owner?: string;
  duration: number;
  predecessors: string[];
  quantity: number;
  unit: string;
  weight: number;
};
export type ResourceKind = "material" | "contract" | "team" | "machine";
export type PlanResource = {
  id: string;
  taskId: string;
  kind: ResourceKind;
  name: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  leadDays: number;
  offset: number;
  duration: number;
  supplier: string;
  status: "planned" | "quoting" | "reserved";
  transportCents: number;
};
export type Plan = {
  version: 1;
  revision: number;
  name: string;
  start: string;
  currency: "BRL" | "USD";
  tasks: PlanTask[];
  resources: PlanResource[];
};
export type ScheduledTask = PlanTask & { start: string; end: string };
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(date + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
function weekday(date: string) {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  return day !== 0 && day !== 6;
}
export function workday(date: string) {
  while (!weekday(date)) date = shiftDate(date, 1);
  return date;
}
export function addWorkdays(date: string, count: number) {
  date = workday(date);
  while (count > 0) {
    date = shiftDate(date, 1);
    if (weekday(date)) count--;
  }
  return date;
}
export function schedulePlan(plan: Plan): ScheduledTask[] {
  const found = new Map<string, ScheduledTask>(),
    visiting = new Set<string>();
  function visit(id: string): ScheduledTask {
    const cached = found.get(id);
    if (cached) return cached;
    if (visiting.has(id))
      throw Error("As dependências formam um ciclo. Revise as predecessoras.");
    const task = plan.tasks.find(t => t.id === id);
    if (!task) throw Error("Uma atividade predecessora não existe.");
    visiting.add(id);
    let start = workday(plan.start);
    for (const predecessor of task.predecessors) {
      const next = addWorkdays(visit(predecessor).end, 1);
      if (next > start) start = next;
    }
    const item = { ...task, start, end: addWorkdays(start, task.duration - 1) };
    found.set(id, item);
    visiting.delete(id);
    return item;
  }
  return plan.tasks.map(t => visit(t.id));
}
export function validatePlan(plan: Plan) {
  if (
    plan.version !== 1 ||
    !Number.isSafeInteger(plan.revision) ||
    plan.revision < 0 ||
    !plan.name?.trim() ||
    plan.name.length > 100 ||
    !validDate(plan.start) ||
    plan.start < "2000-01-01" ||
    plan.start > "2090-12-31" ||
    !["BRL", "USD"].includes(plan.currency) ||
    !Array.isArray(plan.tasks) ||
    !Array.isArray(plan.resources)
  )
    throw Error("Confira nome, início e moeda do planejamento.");
  if (
    !plan.tasks.length ||
    plan.tasks.length > 100 ||
    plan.resources.length > 500
  )
    throw Error("Use de 1 a 100 serviços e até 500 recursos neste rascunho.");
  const ids = new Set<string>();
  for (const t of plan.tasks) {
    if (typeof t.id !== "string" || !t.id || ids.has(t.id))
      throw Error("Serviço duplicado ou inválido.");
    ids.add(t.id);
    if (
      typeof t.name !== "string" ||
      !t.name.trim() ||
      t.name.length > 100 ||
      !Number.isInteger(t.duration) ||
      t.duration < 1 ||
      t.duration > 365 ||
      !Number.isFinite(t.quantity) ||
      t.quantity <= 0 ||
      t.quantity > 1e9 ||
      typeof t.unit !== "string" ||
      !t.unit.trim() ||
      t.unit.length > 25 ||
      !Number.isFinite(t.weight) ||
      t.weight < 0 ||
      t.weight > 100 ||
      !Array.isArray(t.predecessors) ||
      new Set(t.predecessors).size !== t.predecessors.length
    )
      throw Error(
        "Confira nome, duração, quantidade, unidade e peso do serviço."
      );
  }
  const scheduled = schedulePlan(plan),
    resourceIds = new Set<string>();
  for (const r of plan.resources) {
    const t = scheduled.find(t => t.id === r.taskId);
    if (
      typeof r.id !== "string" ||
      !r.id ||
      resourceIds.has(r.id) ||
      !t ||
      !["material", "contract", "team", "machine"].includes(r.kind) ||
      typeof r.name !== "string" ||
      !r.name.trim() ||
      r.name.length > 100 ||
      !Number.isFinite(r.quantity) ||
      r.quantity <= 0 ||
      r.quantity > 1e9 ||
      typeof r.unit !== "string" ||
      !r.unit.trim() ||
      r.unit.length > 25 ||
      !Number.isSafeInteger(r.unitCostCents) ||
      r.unitCostCents < 0 ||
      r.unitCostCents > 1e11 ||
      !Number.isInteger(r.offset) ||
      r.offset < 0 ||
      !Number.isInteger(r.duration) ||
      r.duration < 1 ||
      r.offset + r.duration > t.duration ||
      !Number.isInteger(r.leadDays) ||
      r.leadDays < 0 ||
      r.leadDays > 365 ||
      typeof r.supplier !== "string" ||
      r.supplier.length > 100 ||
      !["planned", "quoting", "reserved"].includes(r.status) ||
      !Number.isSafeInteger(r.transportCents) ||
      r.transportCents < 0 ||
      r.transportCents > 1e11
    )
      throw Error(
        "Confira o recurso: o período deve caber na duração do serviço."
      );
    if (!Number.isSafeInteger(resourcePlan(r, scheduled).total))
      throw Error("A estimativa deste recurso ultrapassa o limite de cálculo.");
    resourceIds.add(r.id);
  }
  return plan;
}
export function resourcePlan(resource: PlanResource, tasks: ScheduledTask[]) {
  const task = tasks.find(t => t.id === resource.taskId);
  if (!task) throw Error("Serviço do recurso não encontrado.");
  const start = addWorkdays(task.start, resource.offset),
    end = addWorkdays(start, resource.duration - 1);
  const calendarDays =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const multiplier =
    resource.kind === "machine"
      ? calendarDays
      : resource.kind === "team"
        ? resource.duration
        : 1;
  const total = new Decimal(resource.quantity)
    .mul(resource.unitCostCents)
    .mul(multiplier)
    .plus(resource.kind === "machine" ? resource.transportCents : 0)
    .toDecimalPlaces(0)
    .toNumber();
  return {
    start,
    end,
    orderBy: shiftDate(start, -resource.leadDays),
    calendarDays,
    total,
  };
}
export function resourceConflicts(plan: Plan, tasks = schedulePlan(plan)) {
  const allocations = plan.resources.filter(
    r => r.kind === "team" || r.kind === "machine"
  );
  const result: string[] = [];
  for (let i = 0; i < allocations.length; i++)
    for (let j = i + 1; j < allocations.length; j++) {
      const a = allocations[i],
        b = allocations[j];
      if (
        a.kind !== b.kind ||
        a.name.trim().toLowerCase() !== b.name.trim().toLowerCase() ||
        a.supplier.trim().toLowerCase() !== b.supplier.trim().toLowerCase()
      )
        continue;
      const x = resourcePlan(a, tasks),
        y = resourcePlan(b, tasks);
      if (x.start <= y.end && y.start <= x.end)
        result.push(
          a.name +
            ": períodos sobrepostos em " +
            tasks.find(t => t.id === a.taskId)!.name +
            " e " +
            tasks.find(t => t.id === b.taskId)!.name +
            "."
        );
    }
  return result;
}
export function createLegacyResidentialPlan(): Plan {
  const definitions: [
    string,
    string,
    number,
    string[],
    number,
    string,
    number,
  ][] = [
    ["preparo", "Projetos e preparação", 10, [], 1, "serviço", 5],
    ["terreno", "Preparação do terreno", 5, ["preparo"], 142, "m²", 5],
    ["fundacao", "Fundações", 15, ["terreno"], 40, "m³", 15],
    ["estrutura", "Estrutura e vedações", 25, ["fundacao"], 200, "m²", 25],
    ["cobertura", "Cobertura", 10, ["estrutura"], 160, "m²", 10],
    [
      "instalacoes",
      "Instalações elétricas e hidráulicas",
      15,
      ["estrutura"],
      90,
      "pontos",
      15,
    ],
    [
      "revestimento",
      "Revestimentos e pisos",
      20,
      ["cobertura", "instalacoes"],
      142,
      "m²",
      15,
    ],
    ["pintura", "Pintura e acabamentos", 10, ["revestimento"], 350, "m²", 5],
    ["entrega", "Vistoria e entrega", 5, ["pintura"], 1, "serviço", 5],
  ];
  const tasks = definitions.map(
    ([id, name, duration, predecessors, quantity, unit, weight]) => ({
      id,
      name,
      duration,
      predecessors,
      quantity,
      unit,
      weight,
    })
  );
  const resource = (
    id: string,
    taskId: string,
    kind: ResourceKind,
    name: string,
    quantity: number,
    unit: string,
    unitCostCents: number,
    duration = 1,
    leadDays = 7
  ): PlanResource => ({
    id,
    taskId,
    kind,
    name,
    quantity,
    unit,
    unitCostCents,
    duration,
    leadDays,
    offset: 0,
    supplier: "A definir",
    status: "planned",
    transportCents: 0,
  });
  return {
    version: 1,
    revision: 0,
    name: "Modelo residencial · 142 m²",
    start: "2026-10-05",
    currency: "BRL",
    tasks,
    resources: [
      resource(
        "concreto",
        "fundacao",
        "material",
        "Concreto (quantidade de exemplo)",
        40,
        "m³",
        45000
      ),
      resource(
        "pisos",
        "revestimento",
        "material",
        "Pisos (quantidade de exemplo)",
        156.2,
        "m²",
        6500,
        1,
        15
      ),
      resource(
        "projetista",
        "preparo",
        "contract",
        "Projetos e preparação",
        1,
        "serviço",
        1200000,
        10,
        15
      ),
      resource(
        "instalador",
        "instalacoes",
        "contract",
        "Execução das instalações",
        1,
        "serviço",
        1800000,
        15,
        10
      ),
      resource(
        "equipe-base",
        "fundacao",
        "team",
        "Equipe de fundações",
        4,
        "pessoa/dia",
        22000,
        15
      ),
      {
        ...resource(
          "escavadeira",
          "terreno",
          "machine",
          "Miniescavadeira",
          1,
          "máquina/dia",
          85000,
          5,
          5
        ),
        transportCents: 120000,
      },
      resource(
        "andaime",
        "pintura",
        "machine",
        "Conjunto de andaimes",
        1,
        "conjunto/dia",
        12000,
        10,
        3
      ),
    ],
  };
}
export function readPlan(raw: string | null): Plan {
  return raw ? validatePlan(JSON.parse(raw)) : createResidentialPlan();
}
