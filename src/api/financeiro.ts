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

export async function listarFinanceiros(page = 0, size = 10): Promise<PaginaFinanceira> {
  const { data } = await axios.get<PaginaFinanceira>("/v1/financeiros", { params: { page, size, sort: "id,DESC" } });
  return data;
}

export async function obterKpisFinanceiros(): Promise<FinanceiroKpis> {
  const { data } = await axios.get<FinanceiroKpis>("/v1/financeiros/kpis");
  return data;
}

export async function obterComparativoFinanceiro(meses = 6): Promise<FinanceiroMes[]> {
  const { data } = await axios.get<FinanceiroMes[]>("/v1/financeiros/receitas-despesas-mensal", { params: { meses } });
  return data;
}

export async function criarFinanceiro(body: RegistroFinanceiroPayload): Promise<RegistroFinanceiro> {
  const { data } = await axios.post<RegistroFinanceiro>("/v1/financeiros", body);
  return data;
}

export async function atualizarFinanceiro(id: number, body: RegistroFinanceiroPayload): Promise<RegistroFinanceiro> {
  const { data } = await axios.put<RegistroFinanceiro>(`/v1/financeiros/${id}`, { ...body, id });
  return data;
}

export async function excluirFinanceiro(id: number): Promise<void> {
  await axios.delete(`/v1/financeiros/${id}`);
}

export async function importarFinanceiro(arquivo: File): Promise<ResultadoImportacaoFinanceiro> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const { data } = await axios.post<ResultadoImportacaoFinanceiro>("/v1/financeiros/import/excel", form);
  return data;
}

export async function exportarFinanceiro(): Promise<void> {
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
    // Aguarda o navegador iniciar o download antes de liberar o objeto.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
