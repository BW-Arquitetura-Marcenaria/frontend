import axios from "@/api/axios";

export type MensagemChat = {
  id: number;
  remetente: "CLIENTE" | "ADMIN";
  conteudo: string;
  criadoEm: string;
};

export type ConversaChat = {
  clienteId: number;
  nomeCliente: string;
  ultimaMensagem: string;
  ultimoRemetente: "CLIENTE" | "ADMIN";
  ultimaMensagemEm: string;
  naoLidas: number;
};

export type ResumoAtendimento = {
  resumo: string | null;
  ambiente: string | null;
  movel: string | null;
  cor: string | null;
  material: string | null;
  orcamento: string | null;
  situacaoProjeto: string | null;
  precisaVisitaTecnica: boolean | null;
  saoPaulo: boolean | null;
  atendidoEm: string | null;
};

export async function listarConversas(): Promise<ConversaChat[]> {
  const { data } = await axios.get<ConversaChat[]>("/v1/admin/chat/conversas");
  return data;
}

export async function listarMensagensAdmin(clienteId: number, depois = 0): Promise<MensagemChat[]> {
  const { data } = await axios.get<MensagemChat[]>(`/v1/admin/chat/conversas/${clienteId}/mensagens`, { params: { depois } });
  return data;
}

export async function enviarMensagemAdmin(clienteId: number, conteudo: string): Promise<MensagemChat> {
  const { data } = await axios.post<MensagemChat>(`/v1/admin/chat/conversas/${clienteId}/mensagens`, { conteudo });
  return data;
}

export async function obterResumoAtendimento(clienteId: number): Promise<ResumoAtendimento> {
  const { data } = await axios.get<ResumoAtendimento>(`/v1/admin/chat/conversas/${clienteId}/resumo`);
  return data;
}

export async function marcarMensagensAdminLidas(clienteId: number): Promise<void> {
  await axios.put(`/v1/admin/chat/conversas/${clienteId}/lidas`);
}

export async function obterNaoLidasAdmin(): Promise<number> {
  const { data } = await axios.get<{ total: number }>("/v1/admin/chat/nao-lidas");
  return data.total;
}

export async function listarMensagensCliente(depois = 0): Promise<MensagemChat[]> {
  const { data } = await axios.get<MensagemChat[]>("/v1/chat/mensagens", { params: { depois } });
  return data;
}

export async function enviarMensagemCliente(conteudo: string): Promise<MensagemChat> {
  const { data } = await axios.post<MensagemChat>("/v1/chat/mensagens", { conteudo });
  return data;
}

export async function marcarMensagensClienteLidas(): Promise<void> {
  await axios.put("/v1/chat/mensagens/lidas");
}

export async function obterNaoLidasCliente(): Promise<number> {
  const { data } = await axios.get<{ total: number }>("/v1/chat/nao-lidas");
  return data.total;
}
