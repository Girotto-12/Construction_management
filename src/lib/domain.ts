import Decimal from "decimal.js";
export type Layer = "alvenaria" | "eletrica" | "pisos";
export type Room = {
  id: string;
  name: string;
  area: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type WorkPackage = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  roomId: string | null;
  layer: Layer | null;
  unit: string;
  precision: number;
  quantity: number;
  unitCostCents: number;
  weight: number;
  start: string;
  end: string;
};
export type Entry = {
  id: string;
  requestId: string;
  packageId: string;
  date: string;
  quantity: number;
  note: string;
  createdAt: string;
};
export type Cost = {
  id: string;
  requestId: string;
  packageId: string;
  date: string;
  amountCents: number;
  category: "material" | "mao-de-obra" | "equipamento" | "outros";
  description: string;
  createdAt: string;
};
export type Project = {
  id: string;
  name: string;
  company: string;
  start: string;
  end: string;
  timezone: string;
  currency: "BRL" | "USD";
  rooms: Room[];
  packages: WorkPackage[];
  entries: Entry[];
  costs: Cost[];
};
export type Workspace = { version: 1; project: Project };
export type ExecutionInput = {
  requestId: string;
  packageId: string;
  date: string;
  quantity: number;
  note: string;
};
export type CostInput = {
  requestId: string;
  packageId: string;
  date: string;
  amountCents: number;
  category: Cost["category"];
  description: string;
};
export const layers: { id: Layer; label: string }[] = [
  { id: "alvenaria", label: "Alvenaria" },
  { id: "eletrica", label: "Elétrica" },
  { id: "pisos", label: "Pisos" },
];
export const leaves = (p: Project) => p.packages.filter(x => x.quantity > 0);
export const percent = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
export const formatQuantity = (n: number, precision: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: precision }).format(
    n
  );
export const money = (cents: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const shortDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(date + "T12:00:00Z"))
    .replace(".", "");
export function today(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export function childrenOf(project: Project, id: string): WorkPackage[] {
  const childIds = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of project.packages)
      if (
        item.parentId &&
        childIds.has(item.parentId) &&
        !childIds.has(item.id)
      ) {
        childIds.add(item.id);
        changed = true;
      }
  }
  return leaves(project).filter(x => childIds.has(x.id));
}
export function executed(
  project: Project,
  item: WorkPackage,
  date = "9999-12-31"
) {
  return project.entries
    .filter(e => e.packageId === item.id && e.date <= date)
    .reduce((a, e) => a.plus(e.quantity), new Decimal(0))
    .toNumber();
}
export function plannedRatio(item: WorkPackage, date: string) {
  if (date < item.start) return 0;
  if (date >= item.end) return 1;
  const days = (value: string) =>
    new Date(value + "T12:00:00Z").getTime() / 86400000;
  return Math.max(
    0,
    Math.min(
      1,
      (days(date) - days(item.start) + 1) /
        (days(item.end) - days(item.start) + 1)
    )
  );
}
export function progress(
  project: Project,
  date: string,
  mode: "actual" | "planned" = "actual",
  items = leaves(project)
) {
  const weight = items.reduce((s, i) => s + i.weight, 0);
  if (!weight) return 0;
  return items
    .reduce(
      (s, i) =>
        s.plus(
          (mode === "actual"
            ? new Decimal(executed(project, i, date)).div(i.quantity)
            : new Decimal(plannedRatio(i, date))
          ).mul(i.weight)
        ),
      new Decimal(0)
    )
    .div(weight)
    .mul(100)
    .toNumber();
}
export function totals(
  project: Project,
  date = "9999-12-31",
  items = leaves(project)
) {
  const ids = new Set(items.map(i => i.id));
  const budget = items.reduce(
    (s, i) =>
      s +
      new Decimal(i.quantity)
        .mul(i.unitCostCents)
        .toDecimalPlaces(0)
        .toNumber(),
    0
  );
  const spent = project.costs
    .filter(c => ids.has(c.packageId) && c.date <= date)
    .reduce((s, c) => s + c.amountCents, 0);
  return { budget, spent, balance: budget - spent };
}
export function roomProgress(
  project: Project,
  room: string,
  layer: Layer,
  date: string,
  mode: "actual" | "planned"
) {
  const items = leaves(project).filter(
    i => i.roomId === room && i.layer === layer
  );
  if (!items.length) return null;
  const quantity = items.reduce((s, i) => s + i.quantity, 0);
  return (
    (items.reduce(
      (s, i) =>
        s +
        (mode === "actual"
          ? executed(project, i, date)
          : i.quantity * plannedRatio(i, date)),
      0
    ) /
      quantity) *
    100
  );
}
function itemAndDate(project: Project, id: string, date: string, now: string) {
  const item = leaves(project).find(i => i.id === id);
  if (!item) throw new Error("Selecione um serviço válido da EAP.");
  if (!validDate(date) || date < project.start || date > now)
    throw new Error("Informe uma data entre o início da obra e hoje.");
  return item;
}
export function addExecution(
  project: Project,
  input: ExecutionInput,
  now = today(project.timezone)
): Project {
  const previous = project.entries.find(e => e.requestId === input.requestId);
  if (previous) {
    if (
      previous.packageId !== input.packageId ||
      previous.date !== input.date ||
      previous.quantity !== input.quantity ||
      previous.note !== input.note.trim()
    )
      throw new Error("Esta solicitação já foi usada com outros dados.");
    return project;
  }
  const item = itemAndDate(project, input.packageId, input.date, now);
  const scale = 10 ** item.precision;
  if (
    !Number.isFinite(input.quantity) ||
    input.quantity <= 0 ||
    Math.abs(input.quantity * scale - Math.round(input.quantity * scale)) >
      0.000001
  )
    throw new Error("Confira a quantidade e as casas decimais da unidade.");
  if (
    Math.round(input.quantity * scale) +
      Math.round(executed(project, item) * scale) >
    Math.round(item.quantity * scale)
  )
    throw new Error("A quantidade supera o saldo deste serviço e ambiente.");
  if (input.note.length > 1000)
    throw new Error("Use até 1.000 caracteres na observação.");
  return {
    ...project,
    entries: [
      ...project.entries,
      {
        ...input,
        note: input.note.trim(),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
export function addCost(
  project: Project,
  input: CostInput,
  now = today(project.timezone)
): Project {
  const previous = project.costs.find(e => e.requestId === input.requestId);
  if (previous) {
    if (
      previous.packageId !== input.packageId ||
      previous.date !== input.date ||
      previous.amountCents !== input.amountCents ||
      previous.category !== input.category ||
      previous.description !== input.description.trim()
    )
      throw new Error("Esta solicitação já foi usada com outros dados.");
    return project;
  }
  itemAndDate(project, input.packageId, input.date, now);
  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents <= 0 ||
    input.amountCents > 100000000000
  )
    throw new Error("Informe um valor válido maior que zero.");
  if (
    !["material", "mao-de-obra", "equipamento", "outros"].includes(
      input.category
    )
  )
    throw new Error("Selecione a categoria do custo.");
  if (!input.description.trim() || input.description.length > 300)
    throw new Error("Descreva o custo em até 300 caracteres.");
  return {
    ...project,
    costs: [
      ...project.costs,
      {
        ...input,
        description: input.description.trim(),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
