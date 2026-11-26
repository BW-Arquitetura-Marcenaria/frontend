import axios from "@/api/axios";
import type { Referencia, Page } from "@/models/Referencia";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "bw-mock-referencias-v1";

const INITIAL_REFERENCIAS: Referencia[] = [
  { id: 1, categoria: "Cozinha", descricao: "Armário superior com portas basculantes e amortecimento Blum", materialBase: "MDF Ultra 18mm", unidade: "m²", precoReferencia: 2150 },
  { id: 2, categoria: "Living & Estantes", descricao: "Estante piso-teto em lâmina natural de Freijó e serralheria", materialBase: "MDF Folheado Freijó + Aço Carbono", unidade: "m²", precoReferencia: 3200 },
  { id: 3, categoria: "Suíte & Closet", descricao: "Closet modulado com portas em vidro reflecta e iluminação LED", materialBase: "MDF 18mm + Alumínio Champagne", unidade: "m²", precoReferencia: 2680 },
  { id: 4, categoria: "Painéis & Ripados", descricao: "Painel ripado acústico com réguas usinadas sob medida", materialBase: "MDF Louro Freijó 18mm", unidade: "m²", precoReferencia: 1490 },
  { id: 5, categoria: "Comercial", descricao: "Bancada de atendimento e expositor com iluminação embutida", materialBase: "Compensado Naval + Laca Acetinada", unidade: "m.l.", precoReferencia: 2950 },
];

function lerReferenciasMock(): Referencia[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Referencia[];
  } catch {
    // ignore
  }
  return structuredClone(INITIAL_REFERENCIAS);
}

function salvarReferenciasMock(lista: Referencia[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // ignore
  }
}

export async function getReferencias(params?: { page?: number; size?: number; sort?: string }) {
  if (USE_MOCK) {
    const lista = lerReferenciasMock();
    const page = params?.page ?? 0;
    const size = params?.size ?? 50;
    const content = lista.slice(page * size, (page + 1) * size);
    return {
      content,
      totalElements: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
      size,
      number: page,
    } as Page<Referencia>;
  }
  const resp = await axios.get('/v1/referencias', { params });
  return resp.data as Page<Referencia>;
}

export async function getReferenciaById(id: number) {
  if (USE_MOCK) {
    const item = lerReferenciasMock().find(r => r.id === id);
    if (!item) throw new Error("Referência não encontrada");
    return item;
  }
  const resp = await axios.get(`/v1/referencias/${id}`);
  return resp.data as Referencia;
}

export async function deleteReferencia(id: number) {
  if (USE_MOCK) {
    salvarReferenciasMock(lerReferenciasMock().filter(r => r.id !== id));
    return true;
  }
  await axios.delete(`/v1/referencias/${id}`);
  return true;
}

export async function createReferencia(body: {
  categoria: string;
  precoReferencia: number | string;
  descricao: string;
  materialBase: string;
  unidade: string;
}) {
  if (USE_MOCK) {
    const lista = lerReferenciasMock();
    const novo: Referencia = {
      id: Date.now(),
      categoria: body.categoria,
      descricao: body.descricao,
      materialBase: body.materialBase,
      unidade: body.unidade,
      precoReferencia: Number(body.precoReferencia),
    };
    salvarReferenciasMock([novo, ...lista]);
    return novo;
  }
  const resp = await axios.post('/v1/referencias', body);
  return resp.data as Referencia;
}

export async function updateReferencia(id: number, body: {
  categoria: string;
  precoReferencia: number | string;
  descricao: string;
  materialBase: string;
  unidade: string;
}) {
  if (USE_MOCK) {
    const atualizado: Referencia = {
      id,
      categoria: body.categoria,
      descricao: body.descricao,
      materialBase: body.materialBase,
      unidade: body.unidade,
      precoReferencia: Number(body.precoReferencia),
    };
    salvarReferenciasMock(lerReferenciasMock().map(r => (r.id === id ? atualizado : r)));
    return atualizado;
  }
  const resp = await axios.put(`/v1/referencias/${id}`, body);
  return resp.data as Referencia;
}

export async function exportReferencias(format: 'pdf' | 'excel') {
  if (USE_MOCK) {
    const lista = lerReferenciasMock();
    const csv = [
      "ID;Categoria;Descricao;Material Base;Unidade;Preco Referencia",
      ...lista.map(r => `${r.id};"${r.categoria}";"${r.descricao}";"${r.materialBase}";"${r.unidade}";${r.precoReferencia}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tabela-precos-referencia.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }
  const resp = await axios.get(`/v1/referencias/export/${format}`, { responseType: 'blob' });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const url = URL.createObjectURL(resp.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tabela-precos-referencia.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
