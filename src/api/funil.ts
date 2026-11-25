import axios from "@/api/axios";

export type EtapaFunil = "NOVO_LEAD" | "EM_QUALIFICACAO" | "QUALIFICADO" | "ORCAMENTO_ENVIADO" | "EM_NEGOCIACAO" | "FECHADO";
export type OrigemFunil = "Todos" | "Instagram" | "Plataforma";
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

export type ConviteClientePayload = {
  nomeCompleto: string;
  email: string;
  tipoProjeto?: string;
  valor?: number;
};

export async function obterFunil(origem: OrigemFunil = "Todos"): Promise<QuadroFunil> {
  const { data } = await axios.get<QuadroFunil>("/v1/admin/funil", {
    params: origem === "Todos" ? undefined : { origem },
  });
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

export async function enviarConviteCliente(payload: ConviteClientePayload): Promise<void> {
  await axios.post("/v1/admin/funil/convites", payload);
}
