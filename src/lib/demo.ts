import type { Project, WorkPackage, Entry, Cost } from "./domain";
const rooms = [
  {
    id: "quarto1",
    name: "Quarto 01",
    area: 24,
    x: 45,
    y: 40,
    width: 170,
    height: 150,
  },
  {
    id: "quarto2",
    name: "Quarto 02",
    area: 24,
    x: 220,
    y: 40,
    width: 170,
    height: 150,
  },
  {
    id: "banheiro",
    name: "Banheiro",
    area: 10,
    x: 395,
    y: 40,
    width: 115,
    height: 150,
  },
  {
    id: "sala",
    name: "Sala de estar",
    area: 54,
    x: 45,
    y: 195,
    width: 265,
    height: 210,
  },
  {
    id: "cozinha",
    name: "Cozinha",
    area: 30,
    x: 315,
    y: 195,
    width: 195,
    height: 210,
  },
];
const base = {
  roomId: null,
  layer: null,
  unit: "",
  precision: 2,
  quantity: 0,
  unitCostCents: 0,
  weight: 0,
  start: "2026-08-03",
  end: "2026-12-18",
};
const groups: WorkPackage[] = [
  { ...base, id: "preparacao", parentId: null, code: "01", name: "Preparação" },
  {
    ...base,
    id: "estrutura",
    parentId: null,
    code: "02",
    name: "Estrutura e vedações",
  },
  {
    ...base,
    id: "instalacoes",
    parentId: null,
    code: "03",
    name: "Instalações",
  },
  {
    ...base,
    id: "acabamento",
    parentId: null,
    code: "04",
    name: "Acabamentos",
  },
  { ...base, id: "entrega", parentId: null, code: "05", name: "Entrega" },
];
export function createDemo(): Project {
  const packages: WorkPackage[] = [
    ...groups,
    {
      ...base,
      id: "projeto",
      parentId: "preparacao",
      code: "01.01",
      name: "Projetos e mobilização",
      unit: "etapas",
      precision: 0,
      quantity: 5,
      unitCostCents: 240000,
      weight: 5,
      start: "2026-08-03",
      end: "2026-08-20",
    },
    {
      ...base,
      id: "fundacao",
      parentId: "estrutura",
      code: "02.01",
      name: "Fundação e estrutura",
      unit: "m³",
      precision: 3,
      quantity: 40,
      unitCostCents: 165000,
      weight: 25,
      start: "2026-08-17",
      end: "2026-09-11",
    },
    ...rooms.map(
      (r, i): WorkPackage => ({
        ...base,
        id: "alv-" + r.id,
        parentId: "estrutura",
        code: "02.0" + (i + 2),
        name: "Alvenaria",
        roomId: r.id,
        layer: "alvenaria",
        unit: "m²",
        quantity: 40,
        unitCostCents: 18000,
        weight: 4,
        start: "2026-09-07",
        end: "2026-10-09",
      })
    ),
    ...rooms.map(
      (r, i): WorkPackage => ({
        ...base,
        id: "ele-" + r.id,
        parentId: "instalacoes",
        code: "03.0" + (i + 1),
        name: "Instalação elétrica",
        roomId: r.id,
        layer: "eletrica",
        unit: "pontos",
        precision: 0,
        quantity: 12,
        unitCostCents: 35000,
        weight: 2,
        start: "2026-09-21",
        end: "2026-10-23",
      })
    ),
    {
      ...base,
      id: "hidraulica",
      parentId: "instalacoes",
      code: "03.06",
      name: "Instalação hidráulica",
      unit: "pontos",
      precision: 0,
      quantity: 30,
      unitCostCents: 48000,
      weight: 10,
      start: "2026-09-21",
      end: "2026-10-23",
    },
    ...rooms.map(
      (r, i): WorkPackage => ({
        ...base,
        id: "piso-" + r.id,
        parentId: "acabamento",
        code: "04.0" + (i + 1),
        name: "Assentamento de pisos",
        roomId: r.id,
        layer: "pisos",
        unit: "m²",
        quantity: r.area,
        unitCostCents: 12000,
        weight: 3,
        start: "2026-10-05",
        end: "2026-11-06",
      })
    ),
    {
      ...base,
      id: "pintura",
      parentId: "acabamento",
      code: "04.06",
      name: "Pintura e acabamento",
      unit: "m²",
      quantity: 350,
      unitCostCents: 4500,
      weight: 10,
      start: "2026-11-09",
      end: "2026-12-04",
    },
    {
      ...base,
      id: "vistoria",
      parentId: "entrega",
      code: "05.01",
      name: "Vistoria e entrega",
      unit: "etapas",
      precision: 0,
      quantity: 4,
      unitCostCents: 100000,
      weight: 5,
      start: "2026-12-07",
      end: "2026-12-18",
    },
  ];
  const amounts: Record<string, number> = {
    projeto: 5,
    fundacao: 40,
    hidraulica: 12,
  };
  rooms.forEach((r, i) => {
    amounts["alv-" + r.id] = [40, 32, 28, 30, 20][i];
    amounts["ele-" + r.id] = [8, 4, 5, 5, 2][i];
  });
  const entries: Entry[] = Object.entries(amounts).map(
    ([packageId, quantity], i) => ({
      id: "seed-" + i,
      requestId: "seed-" + i,
      packageId,
      quantity,
      date:
        packageId === "projeto"
          ? "2026-08-20"
          : packageId === "fundacao"
            ? "2026-09-11"
            : "2026-10-02",
      note: "Medição de exemplo",
      createdAt: "2026-10-02T18:00:00Z",
    })
  );
  const costs: Cost[] = entries.map((entry, i) => ({
    id: "cost-" + i,
    requestId: "cost-" + i,
    packageId: entry.packageId,
    date: entry.date,
    amountCents: Math.round(
      entry.quantity *
        packages.find(p => p.id === entry.packageId)!.unitCostCents *
        (i % 3 === 0 ? 1.08 : 0.95)
    ),
    category: i % 2 ? "material" : "mao-de-obra",
    description: "Custo de exemplo",
    createdAt: entry.createdAt,
  }));
  return {
    id: "demo-horizonte",
    name: "Residência Horizonte",
    company: "Construtora demonstração",
    start: "2026-08-03",
    end: "2026-12-18",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    rooms,
    packages,
    entries,
    costs,
  };
}
