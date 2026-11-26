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

export type MensagemAssistente = {
  autor: "CLIENTE" | "ASSISTENTE";
  texto: string;
  enviadoEm: string;
};

export type ConversaAssistente = {
  concluido: boolean;
  mensagens: MensagemAssistente[];
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY_CHAT = "bw-mock-chat-v1";
const STORAGE_KEY_ASSISTENTE = "bw-mock-assistente-v1";

type MockChatState = {
  conversas: ConversaChat[];
  mensagensPorCliente: Record<number, MensagemChat[]>;
  resumosPorCliente: Record<number, ResumoAtendimento>;
};

const INITIAL_CHAT_STATE: MockChatState = {
  conversas: [
    {
      clienteId: 1,
      nomeCliente: "Rafael Mendes",
      ultimaMensagem: "Perfeito! Podemos agendar a medição da adega na quinta-feira?",
      ultimoRemetente: "CLIENTE",
      ultimaMensagemEm: "2026-11-26T10:45:00",
      naoLidas: 1,
    },
    {
      clienteId: 2,
      nomeCliente: "Camila Furtado",
      ultimaMensagem: "Confirmamos o acabamento em lâmina natural de Freijó.",
      ultimoRemetente: "ADMIN",
      ultimaMensagemEm: "2026-11-25T17:20:00",
      naoLidas: 0,
    },
    {
      clienteId: 4,
      nomeCliente: "Thiago Cavalcanti",
      ultimaMensagem: "Recebi a proposta da cozinha gourmet, vou revisar hoje à noite.",
      ultimoRemetente: "CLIENTE",
      ultimaMensagemEm: "2026-11-24T19:10:00",
      naoLidas: 0,
    },
  ],
  mensagensPorCliente: {
    1: [
      { id: 1, remetente: "CLIENTE", conteudo: "Olá! Gostaria de fazer uma estante com adega integrada no living.", criadoEm: "2026-11-26T10:30:00" },
      { id: 2, remetente: "ADMIN", conteudo: "Olá, Rafael! Recebemos o resumo do seu projeto em Freijó e serralheria. Já separamos amostras para a visita técnica.", criadoEm: "2026-11-26T10:38:00" },
      { id: 3, remetente: "CLIENTE", conteudo: "Perfeito! Podemos agendar a medição da adega na quinta-feira?", criadoEm: "2026-11-26T10:45:00" },
    ],
    2: [
      { id: 4, remetente: "CLIENTE", conteudo: "Bom dia! Temos preferência por madeira natural com iluminação quente.", criadoEm: "2026-11-25T16:15:00" },
      { id: 5, remetente: "ADMIN", conteudo: "Confirmamos o acabamento em lâmina natural de Freijó.", criadoEm: "2026-11-25T17:20:00" },
    ],
    4: [
      { id: 6, remetente: "ADMIN", conteudo: "Olá, Thiago! Enviamos o detalhamento técnico da ilha gourmet.", criadoEm: "2026-11-24T14:20:00" },
      { id: 7, remetente: "CLIENTE", conteudo: "Recebi a proposta da cozinha gourmet, vou revisar hoje à noite.", criadoEm: "2026-11-24T19:10:00" },
    ],
  },
  resumosPorCliente: {
    1: {
      resumo: "Living integrado com estante piso-teto e adega climatizada para 48 garrafas.",
      ambiente: "Sala de Estar / Living",
      movel: "Estante & Adega sob medida",
      cor: "Nogueira / Preto fosco",
      material: "MDF folheado Freijó + Serralheria",
      orcamento: "R$ 42.000",
      situacaoProjeto: "Imóvel entregue, pronto para medição",
      precisaVisitaTecnica: true,
      saoPaulo: true,
      atendidoEm: "2026-11-26T10:32:00",
    },
    2: {
      resumo: "Marcenaria residencial completa para sala, suíte master e cozinha.",
      ambiente: "Residencial completo",
      movel: "Painéis, armários e bancadas",
      cor: "Amadeirado quente e Off-white",
      material: "Freijó natural e Laca acetinada",
      orcamento: "R$ 115.000",
      situacaoProjeto: "Em reforma com planta executiva",
      precisaVisitaTecnica: true,
      saoPaulo: true,
      atendidoEm: "2026-11-25T16:20:00",
    },
    4: {
      resumo: "Cozinha planejada com ilha central, torre quente e ferragens com amortecimento.",
      ambiente: "Cozinha Gourmet",
      movel: "Armários superiores, inferiores e ilha",
      cor: "Grafite e Carvalho",
      material: "MDF Ultra resistente à umidade",
      orcamento: "R$ 58.000",
      situacaoProjeto: "Aguardando aprovação de orçamento",
      precisaVisitaTecnica: true,
      saoPaulo: true,
      atendidoEm: "2026-11-24T14:00:00",
    },
  },
};

function lerChatMock(): MockChatState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CHAT);
    if (raw) return JSON.parse(raw) as MockChatState;
  } catch {
    // ignore
  }
  return structuredClone(INITIAL_CHAT_STATE);
}

function salvarChatMock(state: MockChatState) {
  try {
    sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export async function listarConversas(): Promise<ConversaChat[]> {
  if (USE_MOCK) return lerChatMock().conversas;
  const { data } = await axios.get<ConversaChat[]>("/v1/admin/chat/conversas");
  return data;
}

export async function listarMensagensAdmin(clienteId: number, depois = 0): Promise<MensagemChat[]> {
  if (USE_MOCK) {
    const msgs = lerChatMock().mensagensPorCliente[clienteId] ?? [];
    return msgs.filter(m => m.id > depois);
  }
  const { data } = await axios.get<MensagemChat[]>(`/v1/admin/chat/conversas/${clienteId}/mensagens`, { params: { depois } });
  return data;
}

export async function enviarMensagemAdmin(clienteId: number, conteudo: string): Promise<MensagemChat> {
  if (USE_MOCK) {
    const state = lerChatMock();
    const nova: MensagemChat = {
      id: Date.now(),
      remetente: "ADMIN",
      conteudo,
      criadoEm: new Date().toISOString(),
    };
    const lista = state.mensagensPorCliente[clienteId] ?? [];
    state.mensagensPorCliente[clienteId] = [...lista, nova];
    state.conversas = state.conversas.map(c =>
      c.clienteId === clienteId
        ? { ...c, ultimaMensagem: conteudo, ultimoRemetente: "ADMIN", ultimaMensagemEm: nova.criadoEm, naoLidas: 0 }
        : c
    );
    salvarChatMock(state);
    return nova;
  }
  const { data } = await axios.post<MensagemChat>(`/v1/admin/chat/conversas/${clienteId}/mensagens`, { conteudo });
  return data;
}

export async function obterResumoAtendimento(clienteId: number): Promise<ResumoAtendimento> {
  if (USE_MOCK) {
    return (
      lerChatMock().resumosPorCliente[clienteId] ?? {
        resumo: "Briefing inicial registrado pela plataforma BW.",
        ambiente: "Sob medida",
        movel: "Marcenaria autoral",
        cor: "A definir",
        material: "MDF / Madeira natural",
        orcamento: "Sob consulta",
        situacaoProjeto: "Qualificação inicial",
        precisaVisitaTecnica: true,
        saoPaulo: true,
        atendidoEm: new Date().toISOString(),
      }
    );
  }
  const { data } = await axios.get<ResumoAtendimento>(`/v1/admin/chat/conversas/${clienteId}/resumo`);
  return data;
}

export async function marcarMensagensAdminLidas(clienteId: number): Promise<void> {
  if (USE_MOCK) {
    const state = lerChatMock();
    state.conversas = state.conversas.map(c => (c.clienteId === clienteId ? { ...c, naoLidas: 0 } : c));
    salvarChatMock(state);
    return;
  }
  await axios.put(`/v1/admin/chat/conversas/${clienteId}/lidas`);
}

export async function obterNaoLidasAdmin(): Promise<number> {
  if (USE_MOCK) {
    return lerChatMock().conversas.reduce((acc, c) => acc + c.naoLidas, 0);
  }
  const { data } = await axios.get<{ total: number }>("/v1/admin/chat/nao-lidas");
  return data.total;
}

export async function listarMensagensCliente(depois = 0): Promise<MensagemChat[]> {
  if (USE_MOCK) {
    const msgs = lerChatMock().mensagensPorCliente[1] ?? [];
    return msgs.filter(m => m.id > depois);
  }
  const { data } = await axios.get<MensagemChat[]>("/v1/chat/mensagens", { params: { depois } });
  return data;
}

export async function enviarMensagemCliente(conteudo: string): Promise<MensagemChat> {
  if (USE_MOCK) {
    const state = lerChatMock();
    const nova: MensagemChat = {
      id: Date.now(),
      remetente: "CLIENTE",
      conteudo,
      criadoEm: new Date().toISOString(),
    };
    const lista = state.mensagensPorCliente[1] ?? [];
    state.mensagensPorCliente[1] = [...lista, nova];
    salvarChatMock(state);
    return nova;
  }
  const { data } = await axios.post<MensagemChat>("/v1/chat/mensagens", { conteudo });
  return data;
}

export async function marcarMensagensClienteLidas(): Promise<void> {
  if (USE_MOCK) return;
  await axios.put("/v1/chat/mensagens/lidas");
}

export async function obterNaoLidasCliente(): Promise<number> {
  if (USE_MOCK) return 0;
  const { data } = await axios.get<{ total: number }>("/v1/chat/nao-lidas");
  return data.total;
}

export async function obterConversaAssistente(): Promise<ConversaAssistente> {
  if (USE_MOCK) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_ASSISTENTE);
      if (raw) return JSON.parse(raw) as ConversaAssistente;
    } catch {
      // ignore
    }
    const inicial: ConversaAssistente = {
      concluido: false,
      mensagens: [
        {
          autor: "ASSISTENTE",
          texto: "Olá! Sou o assistente de projetos da BW Arquitetura & Marcenaria. Qual ambiente você deseja transformar e qual estilo ou acabamento tem em mente?",
          enviadoEm: new Date().toISOString(),
        },
      ],
    };
    sessionStorage.setItem(STORAGE_KEY_ASSISTENTE, JSON.stringify(inicial));
    return inicial;
  }
  const { data } = await axios.get<ConversaAssistente>("/v1/chat/assistente");
  return data;
}

export async function enviarMensagemAssistente(mensagem: string): Promise<{ resposta: string; concluido: boolean }> {
  if (USE_MOCK) {
    const atual = await obterConversaAssistente();
    const confirmar = /confirm|fechar|humano|atendente|orçamento|orcamento|visita/i.test(mensagem) || atual.mensagens.length >= 5;
    const resposta = confirmar
      ? "Perfeito! Registrei o resumo do seu projeto e encaminhei para a equipe BW Arquitetura. Um arquiteto dará sequência por aqui."
      : "Excelente escolha! Para prepararmos uma estimativa precisa, você já possui medidas aproximadas ou prefere agendar uma visita técnica em São Paulo? (Digite 'confirmar' para falar com a equipe humana)";
    const novoEstado: ConversaAssistente = {
      concluido: confirmar,
      mensagens: [
        ...atual.mensagens,
        { autor: "CLIENTE", texto: mensagem, enviadoEm: new Date().toISOString() },
        { autor: "ASSISTENTE", texto: resposta, enviadoEm: new Date().toISOString() },
      ],
    };
    sessionStorage.setItem(STORAGE_KEY_ASSISTENTE, JSON.stringify(novoEstado));
    return { resposta, concluido: confirmar };
  }
  const { data } = await axios.post<{ resposta: string; concluido: boolean }>("/v1/chat/assistente/mensagens", { mensagem }, { timeout: 100000 });
  return data;
}
