import type {
  Agendamento,
  DecisaoAgendamentoRequest,
  GoogleAuthorizationUrlResponse,
  GoogleCalendarInfo,
  SolicitacaoAgendamentoRequest,
} from "@/models/Agendamento";
import { horariosColidem } from "@/models/Agendamento";

const STORAGE_KEY = "bw-agendamentos-mock-v1";
const GOOGLE_CONNECTED_KEY = "bw-google-calendar-connected-mock";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function futureDateISO(offsetDays: number, hour: number, minute = 0): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}T${pad(hour)}:${pad(minute)}:00`;
}

const INITIAL_SEED: Agendamento[] = [
  {
    id: 1,
    titulo: "Visita Técnica — Camila Furtado",
    descricao: "Medição de ambiente e avaliação de iluminação natural para estante sob medida.",
    inicio: futureDateISO(1, 10, 0),
    fim: futureDateISO(1, 11, 30),
    status: "PENDENTE",
    googleEventId: null,
    observacaoAdmin: null,
  },
  {
    id: 2,
    titulo: "Reunião de Briefing — Thiago Cavalcanti",
    descricao: "Apresentação de referências de madeira maciça e definição de ferragens.",
    inicio: futureDateISO(2, 14, 0),
    fim: futureDateISO(2, 15, 0),
    status: "PENDENTE",
    googleEventId: null,
    observacaoAdmin: null,
  },
  {
    id: 3,
    titulo: "Oliveira — Montagem Estante Sala",
    descricao: "Entrega e montagem da estante em Freijó Natural com iluminação embutida.",
    inicio: futureDateISO(3, 9, 0),
    fim: futureDateISO(3, 12, 0),
    status: "APROVADO",
    googleEventId: "gcal_evt_bw_oliveira_003",
    observacaoAdmin: "Confirmado com equipe de montagem.",
  },
  {
    id: 4,
    titulo: "Silva — Entrega Cozinha Planejada",
    descricao: "Conferência final dos acabamentos e instalação dos amortecedores Blum.",
    inicio: futureDateISO(5, 14, 0),
    fim: futureDateISO(5, 17, 0),
    status: "APROVADO",
    googleEventId: "gcal_evt_bw_silva_004",
    observacaoAdmin: "Criado diretamente pelo admin.",
  },
  {
    id: 5,
    titulo: "Carvalho — Instalação Adega Climatizada",
    descricao: "Ajuste de marcenaria fina no Apartamento Jardins.",
    inicio: futureDateISO(7, 8, 30),
    fim: futureDateISO(7, 11, 30),
    status: "APROVADO",
    googleEventId: "gcal_evt_bw_carvalho_005",
    observacaoAdmin: "Aprovado e sincronizado com a agenda principal.",
  },
];

function loadList(): Agendamento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED));
      return [...INITIAL_SEED];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...INITIAL_SEED];
  } catch {
    return [...INITIAL_SEED];
  }
}

function saveList(items: Agendamento[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function isGoogleConnected(): boolean {
  try {
    const val = localStorage.getItem(GOOGLE_CONNECTED_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

function setGoogleConnected(connected: boolean): void {
  try {
    localStorage.setItem(GOOGLE_CONNECTED_KEY, String(connected));
  } catch {
    // ignore
  }
}

function validarPeriodo(titulo: string, inicio: string, fim: string): void {
  if (!titulo || !titulo.trim()) {
    throw new Error("O título do agendamento é obrigatório.");
  }
  if (!inicio || !fim) {
    throw new Error("A data de início e a data de fim são obrigatórias.");
  }
  const startMs = new Date(inicio).getTime();
  const endMs = new Date(fim).getTime();
  const nowMs = Date.now();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new Error("Formato de data/hora inválido.");
  }
  if (startMs <= nowMs || endMs <= nowMs) {
    throw new Error("As datas de início e fim devem ser no futuro.");
  }
  if (endMs <= startMs) {
    throw new Error("O horário de fim deve ser posterior ao início.");
  }
}

export const mockAgendamentos = {
  async listarTodos(): Promise<Agendamento[]> {
    const list = loadList();
    return [...list].sort((a, b) => b.id - a.id);
  },

  async solicitar(body: SolicitacaoAgendamentoRequest): Promise<Agendamento> {
    validarPeriodo(body.titulo, body.inicio, body.fim);
    const list = loadList();

    const existeConflito = list.some(
      (a) =>
        (a.status === "PENDENTE" || a.status === "APROVADO") &&
        horariosColidem(body.inicio, body.fim, a.inicio, a.fim)
    );
    if (existeConflito) {
      throw new Error("Já existe um agendamento pendente ou aprovado nesse horário.");
    }

    const nextId = list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const novo: Agendamento = {
      id: nextId,
      titulo: body.titulo.trim(),
      descricao: body.descricao?.trim() || null,
      inicio: body.inicio,
      fim: body.fim,
      status: "PENDENTE",
      googleEventId: null,
      observacaoAdmin: null,
    };
    list.unshift(novo);
    saveList(list);
    return novo;
  },

  async criarComoAdmin(body: SolicitacaoAgendamentoRequest): Promise<Agendamento> {
    validarPeriodo(body.titulo, body.inicio, body.fim);
    if (!isGoogleConnected()) {
      const err: any = new Error(
        "A conexão com o Google Calendar expirou ou foi revogada. Reconecte sua conta Google."
      );
      err.status = 424;
      throw err;
    }

    const list = loadList();
    const nextId = list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const novo: Agendamento = {
      id: nextId,
      titulo: body.titulo.trim(),
      descricao: body.descricao?.trim() || null,
      inicio: body.inicio,
      fim: body.fim,
      status: "APROVADO",
      googleEventId: `gcal_evt_bw_admin_${nextId}_${Date.now().toString(36)}`,
      observacaoAdmin: "Criado diretamente pelo admin.",
    };
    list.unshift(novo);
    saveList(list);
    return novo;
  },

  async aprovar(id: number, body: DecisaoAgendamentoRequest): Promise<Agendamento> {
    if (!isGoogleConnected()) {
      const err: any = new Error(
        "A conexão com o Google Calendar expirou ou foi revogada. Reconecte sua conta Google."
      );
      err.status = 424;
      throw err;
    }

    const list = loadList();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error("Agendamento não encontrado.");
    }
    if (list[idx].status !== "PENDENTE") {
      throw new Error("Somente agendamentos pendentes podem receber uma decisão.");
    }

    const atualizado: Agendamento = {
      ...list[idx],
      status: "APROVADO",
      observacaoAdmin: body.observacao?.trim() || null,
      googleEventId: `gcal_evt_bw_${id}_${Date.now().toString(36)}`,
    };
    list[idx] = atualizado;
    saveList(list);
    return atualizado;
  },

  async recusar(id: number, body: DecisaoAgendamentoRequest): Promise<Agendamento> {
    const list = loadList();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error("Agendamento não encontrado.");
    }
    if (list[idx].status !== "PENDENTE") {
      throw new Error("Somente agendamentos pendentes podem receber uma decisão.");
    }

    const atualizado: Agendamento = {
      ...list[idx],
      status: "RECUSADO",
      observacaoAdmin: body.observacao?.trim() || null,
    };
    list[idx] = atualizado;
    saveList(list);
    return atualizado;
  },

  async autorizarGoogle(): Promise<GoogleAuthorizationUrlResponse> {
    setGoogleConnected(true);
    return {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?mock=1&login_hint=bwtestes.automacao@gmail.com",
    };
  },

  async listarCalendariosGoogle(): Promise<GoogleCalendarInfo[]> {
    if (!isGoogleConnected()) {
      const err: any = new Error(
        "A conexão com o Google Calendar expirou ou foi revogada. Reconecte em POST /v1/api/admin/google-calendar/autorizar."
      );
      err.status = 424;
      throw err;
    }
    return [
      {
        id: "bwtestes.automacao@gmail.com",
        nome: "BW Arquitetura & Marcenaria (bwtestes.automacao@gmail.com)",
        fusoHorario: "America/Sao_Paulo",
        principal: true,
      },
    ];
  },
};

