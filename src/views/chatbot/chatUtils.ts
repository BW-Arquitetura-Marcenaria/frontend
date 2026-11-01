import type { MensagemChat } from "@/api/chat";

export function juntarMensagens(atuais: MensagemChat[], novas: MensagemChat[]): MensagemChat[] {
  return [...new Map([...atuais, ...novas].map(mensagem => [mensagem.id, mensagem])).values()]
    .sort((a, b) => a.id - b.id);
}

export function erroChat(erro: unknown, padrao: string): string {
  if (typeof erro === "object" && erro !== null) {
    const resposta = erro as { response?: { status?: number; data?: { message?: string } } };
    if (resposta.response?.status === 429) return "Muitas mensagens enviadas. Aguarde um minuto e tente novamente.";
    if (resposta.response?.status === 401 || resposta.response?.status === 403) return "Acesso não autorizado. Entre novamente na sua conta.";
    if (resposta.response?.data?.message) return resposta.response.data.message;
  }
  return padrao;
}

export function horaChat(data: string): string {
  const dataLocal = new Date(data);
  return Number.isNaN(dataLocal.getTime()) ? "" : dataLocal.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
