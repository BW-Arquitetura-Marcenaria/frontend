import axios from "@/api/axios";

export type EtapaFunil = "QUALIFICADO" | "ORCAMENTO_ENVIADO" | "EM_NEGOCIACAO" | "FECHADO";
export type ValorOrcamento = number | string | null;

export type CardFunil = {
  clienteId: number;
  nome: string;
  iniciais: string;
  origem: string;
  recebidoEm: string | null;
  tipoProjeto: string | null;
  orcamento: ValorOrcamento;
  score: number | null;
  classificacao: string | null;
};

export type ColunaFunil = {
  etapa: EtapaFunil;
  titulo: string;
  total: number;
  cards: CardFunil[];
};

export type QuadroFunil = {
  oportunidadesAtivas: number;
  pipeline: number | string;
  scoreMedio: number;
  colunas: ColunaFunil[];
};

export type DetalheFunil = CardFunil & { etapa: EtapaFunil };

export async function obterFunil(): Promise<QuadroFunil> {
  const { data } = await axios.get<QuadroFunil>("/v1/admin/funil");
  return data;
}

export async function obterDetalheFunil(clienteId: number): Promise<DetalheFunil> {
  const { data } = await axios.get<DetalheFunil>(`/v1/admin/funil/${clienteId}`);
  return data;
}

export async function atualizarEtapaFunil(clienteId: number, etapa: EtapaFunil): Promise<DetalheFunil> {
  const { data } = await axios.put<DetalheFunil>(`/v1/admin/funil/${clienteId}/etapa`, { etapa });
  return data;
}
