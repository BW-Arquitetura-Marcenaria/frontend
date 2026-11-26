import axios from "@/api/axios";

// BigDecimal pode ser serializado como número ou string, dependendo do servidor.
export type ValorMonetario = number | string;

export type RegistroFinanceiro = {
  id: number;
  descricao: string | null;
  quantidade: number;
  valor: ValorMonetario;
  frete: ValorMonetario;
  valorTotal: ValorMonetario;
  valorFinalDesconto: ValorMonetario | null;
  valorEntrada: ValorMonetario | null;
  receberEntrega: ValorMonetario | null;
  valorRecebidoFinal: ValorMonetario | null;
  valorTotalLiquido: ValorMonetario | null;
  dataPedido: string | null;
  dataEntrega: string | null;
  contatoCliente: string | null;
  regiaoVenda: string | null;
};

export type RegistroFinanceiroPayload = Omit<RegistroFinanceiro, "id">;

export type PaginaFinanceira = {
  content: RegistroFinanceiro[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type FinanceiroKpis = {
  receitasMes: ValorMonetario;
  variacaoReceitasPercentual: ValorMonetario;
  despesasMes: ValorMonetario;
  variacaoDespesasPercentual: ValorMonetario;
  resultadoLiquido: ValorMonetario;
  margemPercentual: ValorMonetario;
};

export type FinanceiroMes = {
  mes: string;
  receitas: ValorMonetario;
  despesas: ValorMonetario;
};

export type ResultadoImportacaoFinanceiro = {
  totalLinhasProcessadas: number;
  totalImportado: number;
  erros: string[];
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "bw-mock-financeiro-v1";

const INITIAL_REGISTROS: RegistroFinanceiro[] = [
  {
    id: 101,
    descricao: "Estante Residencial Casa Aroeira (Freijó + Serralheria)",
    quantidade: 1,
    valor: 74500,
    frete: 1800,
    valorTotal: 76300,
    valorFinalDesconto: 75000,
    valorEntrada: 37500,
    receberEntrega: 37500,
    valorRecebidoFinal: 75000,
    valorTotalLiquido: 73200,
    dataPedido: "2026-10-12",
    dataEntrega: "2026-11-18",
    contatoCliente: "Gustavo Melo · (11) 99214-8830",
    regiaoVenda: "São Paulo · Alto de Pinheiros",
  },
  {
    id: 102,
    descricao: "Estante com Adega Apartamento Jardins",
    quantidade: 1,
    valor: 92000,
    frete: 2200,
    valorTotal: 94200,
    valorFinalDesconto: 92000,
    valorEntrada: 46000,
    receberEntrega: 46000,
    valorRecebidoFinal: 46000,
    valorTotalLiquido: 89800,
    dataPedido: "2026-10-28",
    dataEntrega: "2026-12-05",
    contatoCliente: "Camila Furtado · (11) 98411-5020",
    regiaoVenda: "São Paulo · Jardins",
  },
  {
    id: 103,
    descricao: "Marcenaria Comercial Estúdio Oliva",
    quantidade: 1,
    valor: 132000,
    frete: 3000,
    valorTotal: 135000,
    valorFinalDesconto: 130000,
    valorEntrada: 65000,
    receberEntrega: 65000,
    valorRecebidoFinal: 130000,
    valorTotalLiquido: 127000,
    dataPedido: "2026-11-04",
    dataEntrega: "2026-11-25",
    contatoCliente: "Fernanda Braga · (11) 97102-3319",
    regiaoVenda: "São Paulo · Vila Madalena",
  },
  {
    id: 104,
    descricao: "Cozinha Planejada & Ilha Gourmet",
    quantidade: 1,
    valor: 56500,
    frete: 1500,
    valorTotal: 58000,
    valorFinalDesconto: 56500,
    valorEntrada: 28250,
    receberEntrega: 28250,
    valorRecebidoFinal: 28250,
    valorTotalLiquido: 55000,
    dataPedido: "2026-11-19",
    dataEntrega: "2026-12-18",
    contatoCliente: "Thiago Cavalcanti · (11) 99630-4410",
    regiaoVenda: "São Paulo · Moema",
  },
];

function lerFinanceiroMock(): RegistroFinanceiro[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RegistroFinanceiro[];
  } catch {
    // ignore
  }
  return structuredClone(INITIAL_REGISTROS);
}

function salvarFinanceiroMock(lista: RegistroFinanceiro[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // ignore
  }
}

export async function listarFinanceiros(page = 0, size = 10): Promise<PaginaFinanceira> {
  if (USE_MOCK) {
    const todos = lerFinanceiroMock();
    const start = page * size;
    const content = todos.slice(start, start + size);
    return {
      content,
      totalElements: todos.length,
      totalPages: Math.max(1, Math.ceil(todos.length / size)),
      size,
      number: page,
    };
  }
  const { data } = await axios.get<PaginaFinanceira>("/v1/financeiros", { params: { page, size, sort: "id,DESC" } });
  return data;
}

export async function obterKpisFinanceiros(): Promise<FinanceiroKpis> {
  if (USE_MOCK) {
    const todos = lerFinanceiroMock();
    const receitasMes = todos.reduce((acc, r) => acc + Number(r.valorRecebidoFinal ?? r.valorTotal ?? 0), 0);
    const despesasMes = todos.reduce((acc, r) => acc + Number(r.frete ?? 0) * 6, 0);
    const resultadoLiquido = receitasMes - despesasMes;
    const margemPercentual = receitasMes > 0 ? Number(((resultadoLiquido / receitasMes) * 100).toFixed(1)) : 0;
    return {
      receitasMes,
      variacaoReceitasPercentual: 14.8,
      despesasMes,
      variacaoDespesasPercentual: -3.2,
      resultadoLiquido,
      margemPercentual,
    };
  }
  const { data } = await axios.get<FinanceiroKpis>("/v1/financeiros/kpis");
  return data;
}

export async function obterComparativoFinanceiro(meses = 6): Promise<FinanceiroMes[]> {
  if (USE_MOCK) {
    const serie: FinanceiroMes[] = [
      { mes: "2026-06", receitas: 168000, despesas: 42000 },
      { mes: "2026-07", receitas: 194000, despesas: 48500 },
      { mes: "2026-08", receitas: 215000, despesas: 51000 },
      { mes: "2026-09", receitas: 238000, despesas: 54000 },
      { mes: "2026-10", receitas: 251000, despesas: 49000 },
      { mes: "2026-11", receitas: 279250, despesas: 51000 },
    ];
    return serie.slice(-meses);
  }
  const { data } = await axios.get<FinanceiroMes[]>("/v1/financeiros/receitas-despesas-mensal", { params: { meses } });
  return data;
}

export async function criarFinanceiro(body: RegistroFinanceiroPayload): Promise<RegistroFinanceiro> {
  if (USE_MOCK) {
    const lista = lerFinanceiroMock();
    const novo: RegistroFinanceiro = { ...body, id: Date.now() };
    salvarFinanceiroMock([novo, ...lista]);
    return novo;
  }
  const { data } = await axios.post<RegistroFinanceiro>("/v1/financeiros", body);
  return data;
}

export async function atualizarFinanceiro(id: number, body: RegistroFinanceiroPayload): Promise<RegistroFinanceiro> {
  if (USE_MOCK) {
    const lista = lerFinanceiroMock();
    const atualizado: RegistroFinanceiro = { ...body, id };
    salvarFinanceiroMock(lista.map(r => (r.id === id ? atualizado : r)));
    return atualizado;
  }
  const { data } = await axios.put<RegistroFinanceiro>(`/v1/financeiros/${id}`, { ...body, id });
  return data;
}

export async function excluirFinanceiro(id: number): Promise<void> {
  if (USE_MOCK) {
    salvarFinanceiroMock(lerFinanceiroMock().filter(r => r.id !== id));
    return;
  }
  await axios.delete(`/v1/financeiros/${id}`);
}

export async function importarFinanceiro(arquivo: File): Promise<ResultadoImportacaoFinanceiro> {
  if (USE_MOCK) {
    return {
      totalLinhasProcessadas: 4,
      totalImportado: 4,
      erros: [],
    };
  }
  const form = new FormData();
  form.append("arquivo", arquivo);
  const { data } = await axios.post<ResultadoImportacaoFinanceiro>("/v1/financeiros/import/excel", form);
  return data;
}

export async function exportarFinanceiro(): Promise<void> {
  if (USE_MOCK) {
    const rows = lerFinanceiroMock();
    const csv = [
      "ID;Descricao;Cliente;Regiao;Data Pedido;Valor Total;Recebido",
      ...rows.map(r => `${r.id};"${r.descricao ?? ""}";"${r.contatoCliente ?? ""}";"${r.regiaoVenda ?? ""}";${r.dataPedido ?? ""};${r.valorTotal};${r.valorRecebidoFinal ?? 0}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { data } = await axios.get<Blob>("/v1/financeiros/export/excel", { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
