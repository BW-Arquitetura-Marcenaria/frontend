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

const STORAGE_KEY = "bw-mock-funil-oportunidades-v3";

const ETAPAS_KANBAN: [EtapaFunil, string][] = [
  ["NOVO_LEAD", "Novo Lead"],
  ["EM_QUALIFICACAO", "Em Qualificação"],
  ["QUALIFICADO", "Qualificado"],
  ["ORCAMENTO_ENVIADO", "Orçamento Enviado"],
  ["EM_NEGOCIACAO", "Em Negociação"],
  ["FECHADO", "Fechado"],
];

const INITIAL_MOCK_OPORTUNIDADES: DetalheFunil[] = [
  {
    clienteId: 10,
    nome: "João Silva",
    iniciais: "JS",
    origem: "Plataforma",
    recebidoEm: "2026-11-26T11:15:00",
    tipoProjeto: null,
    orcamento: null,
    score: null,
    classificacao: null,
    etapa: "NOVO_LEAD",
  },
  {
    clienteId: 11,
    nome: "Maria Souza",
    iniciais: "MS",
    origem: "Plataforma",
    recebidoEm: "2026-11-26T10:40:00",
    tipoProjeto: "Cozinha planejada",
    orcamento: 25000,
    score: null,
    classificacao: null,
    etapa: "NOVO_LEAD",
  },
  {
    clienteId: 12,
    nome: "Juliana Rocha",
    iniciais: "JR",
    origem: "Plataforma",
    recebidoEm: "2026-11-25T18:20:00",
    tipoProjeto: "Closet casal & Cabeceira estofada",
    orcamento: null,
    score: null,
    classificacao: null,
    etapa: "EM_QUALIFICACAO",
  },
  {
    clienteId: 1,
    nome: "Rafael Mendes",
    iniciais: "RM",
    origem: "Instagram",
    recebidoEm: "2026-11-26T10:30:00",
    tipoProjeto: "Marcenaria sob medida · Living & Adega",
    orcamento: 42000,
    score: 94,
    classificacao: "QUENTE",
    etapa: "QUALIFICADO",
  },
  {
    clienteId: 2,
    nome: "Camila Furtado",
    iniciais: "CF",
    origem: "Instagram",
    recebidoEm: "2026-11-25T16:15:00",
    tipoProjeto: "Projeto residencial completo · Casa Jardins",
    orcamento: 115000,
    score: 88,
    classificacao: "QUENTE",
    etapa: "QUALIFICADO",
  },
  {
    clienteId: 3,
    nome: "Bruno Lacerda",
    iniciais: "BL",
    origem: "Plataforma",
    recebidoEm: "2026-11-25T11:40:00",
    tipoProjeto: "Home Office & Estante em Freijó",
    orcamento: 24500,
    score: 79,
    classificacao: "MORNO",
    etapa: "QUALIFICADO",
  },
  {
    clienteId: 4,
    nome: "Thiago Cavalcanti",
    iniciais: "TC",
    origem: "Instagram",
    recebidoEm: "2026-11-24T14:20:00",
    tipoProjeto: "Cozinha planejada & Ilha Gourmet",
    orcamento: 58000,
    score: 91,
    classificacao: "QUENTE",
    etapa: "ORCAMENTO_ENVIADO",
  },
  {
    clienteId: 5,
    nome: "Eduardo Siqueira",
    iniciais: "ES",
    origem: "Plataforma",
    recebidoEm: "2026-11-23T09:50:00",
    tipoProjeto: "Suíte Master & Closet sob medida",
    orcamento: 64000,
    score: 84,
    classificacao: "MORNO",
    etapa: "ORCAMENTO_ENVIADO",
  },
  {
    clienteId: 6,
    nome: "Priscila Andrade",
    iniciais: "PA",
    origem: "Instagram",
    recebidoEm: "2026-11-21T12:00:00",
    tipoProjeto: "Reforma & Marcenaria · Apartamento 140m²",
    orcamento: 89000,
    score: 86,
    classificacao: "QUENTE",
    etapa: "EM_NEGOCIACAO",
  },
  {
    clienteId: 7,
    nome: "André Fonseca",
    iniciais: "AF",
    origem: "Plataforma",
    recebidoEm: "2026-11-19T17:10:00",
    tipoProjeto: "Painéis ripados & Bancada Suspensa",
    orcamento: 36000,
    score: 90,
    classificacao: "QUENTE",
    etapa: "EM_NEGOCIACAO",
  },
  {
    clienteId: 8,
    nome: "Fernanda Braga",
    iniciais: "FB",
    origem: "Instagram",
    recebidoEm: "2026-11-15T08:30:00",
    tipoProjeto: "Estúdio Comercial & Recepção Autoral",
    orcamento: 135000,
    score: 97,
    classificacao: "QUENTE",
    etapa: "FECHADO",
  },
  {
    clienteId: 9,
    nome: "Gustavo Melo",
    iniciais: "GM",
    origem: "Plataforma",
    recebidoEm: "2026-11-12T15:00:00",
    tipoProjeto: "Biblioteca residencial Casa Aroeira",
    orcamento: 78000,
    score: 95,
    classificacao: "QUENTE",
    etapa: "FECHADO",
  },
];

function lerMockOportunidades(): DetalheFunil[] {
  try {
    const salvo = sessionStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback para lista inicial
  }
  return [...INITIAL_MOCK_OPORTUNIDADES];
}

function salvarMockOportunidades(lista: DetalheFunil[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // ignora erro de storage
  }
}

function montarQuadroMock(origem: OrigemFunil = "Todos"): QuadroFunil {
  const todas = lerMockOportunidades();
  const filtradas = origem === "Todos"
    ? todas
    : todas.filter(item => item.origem.toLowerCase() === origem.toLowerCase());

  const ativas = filtradas.filter(item => item.etapa !== "FECHADO");
  const pontuadas = ativas.filter(item => item.score !== null);

  return {
    oportunidadesAtivas: ativas.length,
    pipeline: ativas.reduce((total, item) => total + (Number(item.orcamento) || 0), 0),
    scoreMedio: pontuadas.length
      ? Math.round(pontuadas.reduce((total, item) => total + (item.score ?? 0), 0) / pontuadas.length)
      : 0,
    colunas: ETAPAS_KANBAN.map(([etapa, titulo]) => {
      const cards = filtradas
        .filter(item => item.etapa === etapa)
        .map(({ etapa: _etapa, ...card }) => card);
      return { etapa, titulo, total: cards.length, cards };
    }),
  };
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function obterFunil(origem: OrigemFunil = "Todos"): Promise<QuadroFunil> {
  if (USE_MOCK) return montarQuadroMock(origem);
  const { data } = await axios.get<QuadroFunil>("/v1/admin/funil", {
    params: origem === "Todos" ? undefined : { origem },
  });
  return data;
}

export async function obterDetalheFunil(clienteId: number): Promise<DetalheFunil> {
  if (USE_MOCK) {
    const encontrado = lerMockOportunidades().find(item => item.clienteId === clienteId);
    if (!encontrado) throw new Error("Oportunidade não encontrada");
    return { ...encontrado };
  }
  const { data } = await axios.get<DetalheFunil>(`/v1/admin/funil/${clienteId}`);
  return data;
}

export async function atualizarEtapaFunil(clienteId: number, etapa: EtapaFunil): Promise<DetalheFunil> {
  if (USE_MOCK) {
    const lista = lerMockOportunidades();
    const idx = lista.findIndex(item => item.clienteId === clienteId);
    if (idx === -1) throw new Error("Oportunidade não encontrada");
    lista[idx] = { ...lista[idx], etapa };
    salvarMockOportunidades(lista);
    return { ...lista[idx] };
  }
  const { data } = await axios.put<DetalheFunil>(`/v1/admin/funil/${clienteId}/etapa`, { etapa });
  return data;
}

export async function enviarConviteCliente(payload: ConviteClientePayload): Promise<void> {
  if (USE_MOCK) {
    const lista = lerMockOportunidades();
    const partes = payload.nomeCompleto.trim().split(/\s+/);
    const iniciais = partes.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "BW";
    const novo: DetalheFunil = {
      clienteId: Date.now(),
      nome: payload.nomeCompleto.trim(),
      iniciais,
      origem: "Plataforma",
      recebidoEm: new Date().toISOString(),
      tipoProjeto: payload.tipoProjeto?.trim() || null,
      orcamento: payload.valor ?? null,
      score: null,
      classificacao: null,
      etapa: "NOVO_LEAD",
    };
    salvarMockOportunidades([novo, ...lista]);
    return;
  }
  await axios.post("/v1/admin/funil/convites", payload);
}
