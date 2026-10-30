import type { Page } from "@/models/Referencia";
import type { Rastreabilidade, RastreabilidadeRequest } from "@/models/Rastreabilidade";

// Backend em memória usado quando VITE_USE_MOCK=true. Os dados somem ao recarregar a página.
type PageParams = { page?: number; size?: number; sort?: string };

let nextId = 5;
let db: Rastreabilidade[] = [
  { id: 4, lote: "LOT-2024-099", tipoMadeira: "Compensado Naval 18mm", fornecedor: "EcoMadeiras", origem: "Manejo Sustentável — Pará, BR", certificacoes: "IBAMA 2024-PA-1234", volume: "15 chapas (45m²)", dataRegistro: "2024-08-20T00:00:00", projeto: { id: 7 } },
  { id: 3, lote: "LOT-2024-061", tipoMadeira: "Pinus Tratado 25mm", fornecedor: "Pinheiro Madeiras Ltda.", origem: "Reflorestamento — Santa Catarina, BR", certificacoes: "FSC® COC-004321", volume: "8 chapas (28m²)", dataRegistro: "2024-07-01T00:00:00", projeto: { id: 11 } },
  { id: 2, lote: "LOT-2024-076", tipoMadeira: "Painel Freijó 18mm", fornecedor: "Madeireira Nobre", origem: "Manejo sustentável — Mato Grosso, BR", certificacoes: "IBAMA 2024-MG-4412", volume: "12 chapas (40m²)", dataRegistro: "2024-07-15T00:00:00", projeto: { id: 12 } },
  { id: 1, lote: "LOT-2024-089", tipoMadeira: "MDF Branco 15mm", fornecedor: "Pinheiro Madeiras Ltda.", origem: "Reflorestamento certificado — Paraná, BR", certificacoes: "FSC® COC-004321", volume: "24 chapas (83m²)", dataRegistro: "2024-08-02T00:00:00", projeto: { id: 11 } },
];

const delay = <T,>(v: T) => new Promise<T>(r => setTimeout(() => r(v), 150));

function paginate(items: Rastreabilidade[], params?: PageParams): Page<Rastreabilidade> {
  const size = params?.size ?? 10;
  const page = params?.page ?? 0;
  return {
    content: items.slice(page * size, page * size + size),
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
    size,
    number: page,
  };
}

export const mockRastreabilidades = {
  list: (params?: PageParams) => delay(paginate(db, params)),
  listByProjeto: (projetoId: number, params?: PageParams) =>
    delay(paginate(db.filter(r => r.projeto?.id === projetoId), params)),
  create: (body: RastreabilidadeRequest) => {
    const item: Rastreabilidade = {
      id: nextId++, ...body,
      dataRegistro: `${body.dataRegistro ?? new Date().toISOString().slice(0, 10)}T00:00:00`,
      projeto: { id: body.projetoId },
    };
    db = [item, ...db];
    return delay(item);
  },
  update: (id: number, body: RastreabilidadeRequest) => {
    const old = db.find(r => r.id === id);
    if (!old) return Promise.reject(new Error("Rastreabilidade não encontrada"));
    const item: Rastreabilidade = {
      ...old, ...body,
      dataRegistro: `${body.dataRegistro ?? old.dataRegistro.slice(0, 10)}T00:00:00`,
      projeto: { id: body.projetoId },
    };
    db = db.map(r => (r.id === id ? item : r));
    return delay(item);
  },
  remove: (id: number) => {
    db = db.filter(r => r.id !== id);
    return delay(undefined);
  },
};

