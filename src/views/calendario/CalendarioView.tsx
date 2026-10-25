import React, { useMemo, useState } from "react";
import { useCalendarioViewModel } from "@/viewmodels/calendario/useCalendarioViewModel";
import type {
  Agendamento,
  SolicitacaoAgendamentoRequest,
  StatusAgendamento,
} from "@/models/Agendamento";
import {
  buildLocalDateTimeISO,
  extractDateISO,
  extractTimeHHMM,
} from "@/models/Agendamento";

export type LeadOption = {
  id: number;
  nome: string;
  etapa?: string;
  score?: number;
};

type FiltroStatus = "ATIVOS" | "TODOS" | StatusAgendamento;

type NovoAgendamentoForm = {
  modo: "ADMIN" | "CLIENTE";
  titulo: string;
  descricao: string;
  date: string;
  horaInicio: string;
  horaFim: string;
  tipo: string;
  leadId: number | "";
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const TIPOS_EVENTO: Record<string, string> = {
  reuniao: "Reunião / Apresentação",
  visita: "Visita Técnica",
  entrega: "Montagem / Entrega",
  outro: "Outro",
};

const STATUS_META: Record<
  StatusAgendamento,
  { label: string; badgeCls: string; cellCls: string }
> = {
  PENDENTE: {
    label: "Pendente",
    badgeCls: "border-amber-500/40 bg-amber-500/15 text-amber-800",
    cellCls:
      "border-amber-500/40 border-l-2 border-l-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-500 hover:text-white",
  },
  APROVADO: {
    label: "Aprovado",
    badgeCls: "border-emerald-600/35 bg-emerald-500/15 text-emerald-800",
    cellCls:
      "border-bw-border border-l-2 border-l-bw-dourado bg-bw-areia text-bw-madeira hover:bg-bw-dourado hover:text-white",
  },
  RECUSADO: {
    label: "Recusado",
    badgeCls: "border-red-500/35 bg-red-500/10 text-red-700",
    cellCls:
      "border-red-300 border-l-2 border-l-red-500 bg-red-50/70 text-red-700 line-through opacity-75 hover:opacity-100",
  },
  CANCELADO: {
    label: "Cancelado (Google)",
    badgeCls: "border-neutral-400/40 bg-neutral-200/70 text-neutral-700",
    cellCls:
      "border-neutral-300 border-l-2 border-l-neutral-500 bg-neutral-100 text-neutral-500 line-through opacity-75 hover:opacity-100",
  },
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getAmanhãISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtLongDate(isoDate: string): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} de ${MESES[m - 1]?.toLowerCase() ?? ""} de ${y}`;
}

export default function CalendarioView({ leads = [] }: { leads?: LeadOption[] }) {
  const {
    agendamentos,
    calendariosGoogle,
    googleConectado,
    awaitingOAuthCallback,
    loading,
    saving,
    connectingGoogle,
    error,
    googleError,
    clearError,
    refreshAll,
    verificarConexaoGoogle,
    conectarGoogle,
    criarComoAdmin,
    solicitarComoCliente,
    aprovar,
    recusar,
  } = useCalendarioViewModel({ autoFetchAdmin: true });

  const now = new Date();
  const hojeISO = toISO(now.getFullYear(), now.getMonth(), now.getDate());

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ATIVOS");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [observacaoDecisao, setObservacaoDecisao] = useState("");
  const [form, setForm] = useState<NovoAgendamentoForm | null>(null);
  const [formLocalError, setFormLocalError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => agendamentos.find((a) => a.id === selectedId) ?? null,
    [agendamentos, selectedId]
  );

  const pendentes = useMemo(
    () =>
      agendamentos
        .filter((a) => a.status === "PENDENTE")
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [agendamentos]
  );

  const contagens = useMemo(() => {
    const counts = { PENDENTE: 0, APROVADO: 0, RECUSADO: 0, CANCELADO: 0 };
    for (const a of agendamentos) {
      if (counts[a.status] !== undefined) counts[a.status]++;
    }
    return counts;
  }, [agendamentos]);

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((a) => {
      if (filtroStatus === "TODOS") return true;
      if (filtroStatus === "ATIVOS") {
        return a.status === "APROVADO" || a.status === "PENDENTE";
      }
      return a.status === filtroStatus;
    });
  }, [agendamentos, filtroStatus]);

  const calendarioPrincipal = useMemo(
    () => calendariosGoogle.find((c) => c.principal) ?? calendariosGoogle[0] ?? null,
    [calendariosGoogle]
  );

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const trailing = (7 - ((firstWeekday + daysInMonth) % 7)) % 7;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const changeMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const openNew = (dateISO?: string, modo: "ADMIN" | "CLIENTE" = "ADMIN") => {
    clearError();
    setFormLocalError(null);
    setSelectedId(null);
    // Datas na API precisam ser @Future
    const defaultDate =
      dateISO && dateISO > hojeISO ? dateISO : getAmanhãISO();
    setForm({
      modo,
      date: defaultDate,
      horaInicio: "10:00",
      horaFim: "11:00",
      titulo: "",
      descricao: "",
      tipo: "",
      leadId: "",
    });
  };

  const openDetails = (ag: Agendamento) => {
    clearError();
    setObservacaoDecisao(ag.observacaoAdmin ?? "");
    setSelectedId(ag.id);
  };

  const handleAprovar = async (ag: Agendamento, obs?: string) => {
    setFeedbackMsg(null);
    const res = await aprovar(ag.id, obs ?? observacaoDecisao);
    if (res) {
      setFeedbackMsg(
        `Agendamento "${res.titulo}" aprovado e enviado para o Google Calendar!`
      );
      setSelectedId(null);
      setObservacaoDecisao("");
    }
  };

  const handleRecusar = async (ag: Agendamento, obs?: string) => {
    setFeedbackMsg(null);
    const res = await recusar(ag.id, obs ?? observacaoDecisao);
    if (res) {
      setFeedbackMsg(`Solicitação "${res.titulo}" marcada como recusada.`);
      setSelectedId(null);
      setObservacaoDecisao("");
    }
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setFormLocalError(null);
    clearError();
    setFeedbackMsg(null);

    const inicioISO = buildLocalDateTimeISO(form.date, form.horaInicio);
    const fimISO = buildLocalDateTimeISO(form.date, form.horaFim);

    const inicioDate = new Date(inicioISO);
    const fimDate = new Date(fimISO);

    if (inicioDate.getTime() <= Date.now()) {
      setFormLocalError("A data e o horário de início devem estar no futuro.");
      return;
    }
    if (fimDate.getTime() <= inicioDate.getTime()) {
      setFormLocalError("O horário de término deve ser posterior ao horário de início.");
      return;
    }

    const partesDescricao: string[] = [];
    if (form.tipo && TIPOS_EVENTO[form.tipo]) {
      partesDescricao.push(`Tipo: ${TIPOS_EVENTO[form.tipo]}`);
    }
    if (form.leadId !== "") {
      const lead = leads.find((l) => l.id === Number(form.leadId));
      if (lead) partesDescricao.push(`Lead/Cliente: ${lead.nome}`);
    }
    if (form.descricao.trim()) {
      partesDescricao.push(form.descricao.trim());
    }

    const payload: SolicitacaoAgendamentoRequest = {
      titulo: form.titulo.trim(),
      descricao: partesDescricao.join(" | ") || undefined,
      inicio: inicioISO,
      fim: fimISO,
    };

    const criado =
      form.modo === "ADMIN"
        ? await criarComoAdmin(payload)
        : await solicitarComoCliente(payload);

    if (criado) {
      if (form.modo === "CLIENTE") {
        await refreshAll();
        setFeedbackMsg(
          `Solicitação "${criado.titulo}" criada com status PENDENTE. Aprove abaixo para enviar ao Google Calendar.`
        );
      } else {
        setFeedbackMsg(
          `Agendamento "${criado.titulo}" criado diretamente como APROVADO e sincronizado com o Google Calendar!`
        );
      }
      const [y, m] = form.date.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
      setForm(null);
    }
  };

  const inputCls =
    "bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors";
  const svgProps = {
    viewBox: "0 0 24 24",
    className: "w-4 h-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-bw-preto font-display">
            Calendário de Entregas e Agendamentos
          </h1>
          <p className="text-[10px] font-mono text-bw-muted">
            Integrado ao Google Calendar — aprove solicitações de clientes ou crie agendamentos diretamente
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={loading}
            className="px-3 py-1.5 border border-bw-border text-bw-madeira rounded-md text-xs hover:bg-bw-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Sincronizando..." : "↻ Atualizar"}
          </button>
          <button
            type="button"
            onClick={() => openNew(undefined, "CLIENTE")}
            className="px-3 py-1.5 border border-bw-dourado/50 text-bw-madeira rounded-md text-xs hover:bg-bw-areia transition-colors"
          >
            + Solicitação de Cliente
          </button>
          <button
            type="button"
            onClick={() => openNew(undefined, "ADMIN")}
            className="px-3 py-1.5 bg-bw-dourado text-white rounded-md text-xs hover:bg-bw-madeira transition-colors"
          >
            + Agendar (Admin)
          </button>
        </div>
      </div>

      {/* Painel de Conexão com Google Calendar */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          googleConectado
            ? "border-emerald-600/30 bg-emerald-50/50"
            : "border-bw-dourado/50 bg-bw-areia/70"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold ${
                googleConectado
                  ? "border-emerald-600/40 bg-emerald-500/15 text-emerald-800"
                  : "border-bw-dourado/50 bg-bw-dourado/15 text-bw-madeira"
              }`}
            >
              G
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-bw-preto">
                  Integração Google Calendar
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${
                    googleConectado === null
                      ? "border-bw-border bg-bw-white text-bw-muted"
                      : googleConectado
                      ? "border-emerald-600/30 bg-emerald-500/15 text-emerald-800"
                      : "border-amber-600/40 bg-amber-500/15 text-amber-900"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      googleConectado ? "bg-emerald-600" : "bg-amber-600"
                    }`}
                  />
                  {googleConectado === null
                    ? "Verificando..."
                    : googleConectado
                    ? "Conectado"
                    : "Autorização Pendente"}
                </span>
              </div>

              {googleConectado && calendarioPrincipal ? (
                <p className="text-[11px] text-bw-madeira mt-1">
                  Agenda vinculada:{" "}
                  <strong className="font-mono">{calendarioPrincipal.nome}</strong>{" "}
                  <span className="text-bw-muted font-mono">
                    ({calendarioPrincipal.id} · {calendarioPrincipal.fusoHorario})
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-bw-madeira mt-1">
                  Conecte a conta Google oficial (
                  <strong className="font-mono">bwtestes.automacao@gmail.com</strong>) para
                  que agendamentos aprovados ou criados pelo admin sejam enviados
                  automaticamente ao Google Calendar.
                </p>
              )}

              {googleError && (
                <p className="text-[11px] text-red-600 mt-1">{googleError.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {awaitingOAuthCallback && (
              <button
                type="button"
                onClick={() => void verificarConexaoGoogle()}
                className="px-3 py-1.5 border border-emerald-600 text-emerald-800 bg-white rounded-md text-xs font-medium hover:bg-emerald-50 transition-colors"
              >
                Já autorizei · Verificar
              </button>
            )}
            <button
              type="button"
              onClick={() => void conectarGoogle()}
              disabled={connectingGoogle}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                googleConectado
                  ? "border border-bw-border bg-bw-white text-bw-madeira hover:bg-bw-hover"
                  : "bg-bw-preto text-bw-white hover:bg-bw-madeira"
              }`}
            >
              {connectingGoogle
                ? "Abrindo Google..."
                : googleConectado
                ? "Reconectar Conta Google"
                : "Autorizar Google Calendar ↗"}
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens de Feedback / Erro */}
      {feedbackMsg && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-500/40 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-[10px] font-mono uppercase text-emerald-700 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          <span>{error.message}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-[10px] font-mono uppercase text-red-700 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Fila de Solicitações Pendentes de Clientes */}
      {pendentes.length > 0 && (
        <section className="rounded-lg border border-amber-500/40 bg-bw-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-500/25 bg-amber-50/80 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-amber-950">
                Solicitações de Clientes Aguardando Aprovação ({pendentes.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-800">
              Ao aceitar, o evento vai para o nosso calendário e para o Google Calendar
            </span>
          </div>
          <div className="divide-y divide-bw-border-sub">
            {pendentes.map((sol) => {
              const dataISO = extractDateISO(sol.inicio);
              const hInicio = extractTimeHHMM(sol.inicio);
              const hFim = extractTimeHHMM(sol.fim);
              return (
                <div
                  key={sol.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 hover:bg-bw-hover/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-bw-preto">
                        {sol.titulo}
                      </span>
                      <span className="rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-mono uppercase text-amber-900">
                        PENDENTE
                      </span>
                    </div>
                    <div className="text-xs font-mono text-bw-madeira mt-0.5">
                      {fmtLongDate(dataISO)} · {hInicio} às {hFim}
                    </div>
                    {sol.descricao && (
                      <p className="text-xs text-bw-muted mt-1 line-clamp-2">
                        {sol.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openDetails(sol)}
                      className="px-2.5 py-1.5 border border-bw-border text-bw-madeira rounded text-[11px] hover:bg-bw-areia transition-colors"
                    >
                      Avaliar / Obs.
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void handleRecusar(sol, "Solicitação recusada pelo administrador.")
                      }
                      className="px-2.5 py-1.5 border border-red-500/40 text-red-700 rounded text-[11px] hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Recusar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void handleAprovar(sol, "Solicitação aprovada pelo administrador.")
                      }
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded text-[11px] font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
                    >
                      ✓ Aceitar e Agendar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Barra de Navegação do Mês e Filtros de Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 border border-bw-border text-bw-madeira rounded-md text-xs hover:bg-bw-hover transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mês anterior"
            className="p-1.5 rounded-md border border-bw-border text-bw-madeira hover:bg-bw-hover transition-colors"
          >
            <svg {...svgProps}>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Próximo mês"
            className="p-1.5 rounded-md border border-bw-border text-bw-madeira hover:bg-bw-hover transition-colors"
          >
            <svg {...svgProps}>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            aria-label="Mês"
            className="bg-transparent border-b border-bw-border-sub text-bw-preto text-sm font-semibold py-1 outline-none focus:border-bw-dourado"
          >
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value) || now.getFullYear())}
            aria-label="Ano"
            className="w-20 bg-transparent border-b border-bw-border-sub text-bw-preto text-sm font-semibold py-1 outline-none focus:border-bw-dourado"
          />
        </div>

        {/* Filtros por Status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              ["ATIVOS", `Calendário (${contagens.APROVADO + contagens.PENDENTE})`],
              ["APROVADO", `Aprovados (${contagens.APROVADO})`],
              ["PENDENTE", `Pendentes (${contagens.PENDENTE})`],
              ["RECUSADO", `Recusados (${contagens.RECUSADO})`],
              ["CANCELADO", `Cancelados (${contagens.CANCELADO})`],
              ["TODOS", `Todos (${agendamentos.length})`],
            ] as [FiltroStatus, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltroStatus(key)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                filtroStatus === key
                  ? "border-bw-dourado bg-bw-dourado text-white"
                  : "border-bw-border bg-bw-white text-bw-madeira hover:bg-bw-hover"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade Mensal do Calendário */}
      <div className="overflow-x-auto rounded-lg border border-bw-border bg-bw-white">
        <div className="min-w-[44rem]">
          <div className="grid grid-cols-7 border-b border-bw-border bg-bw-areia">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-mono text-bw-muted uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {[...Array(firstWeekday)].map((_, i) => (
              <div
                key={`e${i}`}
                className="h-28 border-r border-b border-bw-border-sub bg-bw-areia/15"
              />
            ))}
            {days.map((d) => {
              const iso = toISO(viewYear, viewMonth, d);
              const isHoje = iso === hojeISO;
              const doDia = agendamentosFiltrados
                .filter((ev) => extractDateISO(ev.inicio) === iso)
                .sort((a, b) => a.inicio.localeCompare(b.inicio));

              return (
                <div
                  key={d}
                  onClick={() => openNew(iso, "ADMIN")}
                  className={`h-28 p-1.5 border-r border-b border-bw-border-sub overflow-y-auto cursor-pointer hover:bg-bw-hover transition-colors ${
                    isHoje ? "bg-bw-areia/60" : ""
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono mb-1 flex items-center justify-between ${
                      isHoje ? "font-bold text-bw-preto" : "text-bw-muted"
                    }`}
                  >
                    <span>
                      {d}
                      {isHoje && " · Hoje"}
                    </span>
                    {doDia.length > 0 && (
                      <span className="text-[9px] text-bw-madeira">{doDia.length}</span>
                    )}
                  </div>
                  {doDia.map((ev) => {
                    const meta = STATUS_META[ev.status];
                    const hIni = extractTimeHHMM(ev.inicio);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(ev);
                        }}
                        className={`block w-full text-left text-[9px] rounded px-1.5 py-0.5 truncate font-mono mb-1 border transition-colors ${meta.cellCls}`}
                        title={`${hIni} - ${extractTimeHHMM(ev.fim)} · ${ev.titulo} (${meta.label})`}
                      >
                        {ev.status === "PENDENTE" ? "⏳ " : ev.googleEventId ? "G · " : ""}
                        {hIni} {ev.titulo}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {[...Array(trailing)].map((_, i) => (
              <div
                key={`f${i}`}
                className="h-28 border-r border-b border-bw-border-sub bg-bw-areia/15"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes / Aprovação do Agendamento */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/50 p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-bw-border bg-bw-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-bw-border bg-bw-areia px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-bw-madeira">
                  Agendamento #{selected.id}
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-[9px] font-mono uppercase ${
                    STATUS_META[selected.status].badgeCls
                  }`}
                >
                  {STATUS_META[selected.status].label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                title="Fechar"
                aria-label="Fechar"
                className="p-1 rounded text-bw-muted hover:bg-bw-hover hover:text-bw-preto transition-colors"
              >
                <svg {...svgProps}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3.5 p-5">
              <div>
                <div className="text-lg font-semibold text-bw-preto font-display">
                  {selected.titulo}
                </div>
                <div className="text-xs text-bw-madeira font-mono mt-1">
                  {fmtLongDate(extractDateISO(selected.inicio))} ·{" "}
                  {extractTimeHHMM(selected.inicio)} às {extractTimeHHMM(selected.fim)}
                </div>
              </div>

              {selected.descricao && (
                <div className="rounded border border-bw-border-sub bg-bw-areia/35 p-3 text-xs text-bw-preto leading-relaxed">
                  {selected.descricao}
                </div>
              )}

              <div className="flex flex-col gap-1 text-[11px] font-mono text-bw-muted border-t border-bw-border-sub pt-3">
                <div>
                  Google Calendar:{" "}
                  {selected.googleEventId ? (
                    <span className="text-emerald-700 font-semibold">
                      Sincronizado ({selected.googleEventId})
                    </span>
                  ) : selected.status === "PENDENTE" ? (
                    <span className="text-amber-700">
                      Aguardando aprovação para criar evento no Google
                    </span>
                  ) : (
                    <span>Não vinculado</span>
                  )}
                </div>
                {selected.observacaoAdmin && (
                  <div>
                    Observação:{" "}
                    <span className="text-bw-preto">{selected.observacaoAdmin}</span>
                  </div>
                )}
              </div>

              {selected.status === "PENDENTE" && (
                <div className="border-t border-bw-border pt-4 mt-1 flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-bw-madeira">
                      Observação da Decisão (Opcional)
                    </span>
                    <textarea
                      rows={2}
                      maxLength={5000}
                      value={observacaoDecisao}
                      onChange={(e) => setObservacaoDecisao(e.target.value)}
                      placeholder="Ex: Confirmado com o arquiteto responsável..."
                      className="w-full rounded border border-bw-border bg-bw-areia/20 p-2 text-xs text-bw-preto outline-none focus:border-bw-dourado"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleRecusar(selected)}
                      className="flex-1 border border-red-500/50 text-red-700 py-2.5 rounded text-xs font-medium uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Processando..." : "Recusar"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleAprovar(selected)}
                      className="flex-1 bg-emerald-700 text-white py-2.5 rounded text-xs font-medium uppercase tracking-wider hover:bg-emerald-800 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Sincronizando..." : "Aceitar e Agendar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Agendamento (Admin Direto ou Solicitação de Cliente) */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/95 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-6">
              <h2 className="font-display text-2xl text-bw-white">
                {form.modo === "ADMIN"
                  ? "Novo Agendamento (Admin)"
                  : "Nova Solicitação de Cliente"}
              </h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">
                {form.modo === "ADMIN"
                  ? "Criado como APROVADO e sincronizado direto no Google Calendar"
                  : "Criado como PENDENTE (valida conflito de horário)"}
              </p>
            </div>

            {/* Seletor de Modo: Admin vs Solicitação Cliente */}
            <div className="grid grid-cols-2 gap-1 mb-6 p-1 border border-white/10 bg-white/5">
              <button
                type="button"
                onClick={() => setForm({ ...form, modo: "ADMIN" })}
                className={`py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  form.modo === "ADMIN"
                    ? "bg-bw-dourado text-bw-preto font-semibold"
                    : "text-bw-areia/70 hover:text-white"
                }`}
              >
                Direto (Admin)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, modo: "CLIENTE" })}
                className={`py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  form.modo === "CLIENTE"
                    ? "bg-bw-dourado text-bw-preto font-semibold"
                    : "text-bw-areia/70 hover:text-white"
                }`}
              >
                Solicitação (Cliente)
              </button>
            </div>

            <form className="flex flex-col gap-5" onSubmit={(e) => void handleSalvarNovo(e)}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                  Título do Agendamento *
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className={inputCls}
                  required
                  placeholder="Ex: Visita técnica — Apartamento Jardins"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                    Tipo de Evento (Opcional)
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className={`${inputCls} appearance-none rounded-none`}
                  >
                    <option value="" className="bg-bw-preto text-bw-white">
                      Selecione...
                    </option>
                    {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                      <option key={k} value={k} className="bg-bw-preto text-bw-white">
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                    Vincular Lead (Opcional)
                  </label>
                  <select
                    value={form.leadId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        leadId: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className={`${inputCls} appearance-none rounded-none`}
                  >
                    <option value="" className="bg-bw-preto text-bw-white">
                      Nenhum (Evento interno)
                    </option>
                    {leads.map((lead) => (
                      <option
                        key={lead.id}
                        value={lead.id}
                        className="bg-bw-preto text-bw-white"
                      >
                        {lead.nome}
                        {lead.etapa ? ` — ${lead.etapa}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={`${inputCls} [color-scheme:dark]`}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                    Início *
                  </label>
                  <input
                    type="time"
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                    className={`${inputCls} [color-scheme:dark]`}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                    Término *
                  </label>
                  <input
                    type="time"
                    value={form.horaFim}
                    onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                    className={`${inputCls} [color-scheme:dark]`}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">
                  Descrição / Observações
                </label>
                <textarea
                  rows={2}
                  maxLength={5000}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Detalhes do agendamento, endereço ou pauta..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {(formLocalError || error) && (
                <div className="border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
                  {formLocalError ?? error?.message}
                </div>
              )}

              <div className="mt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Salvando..."
                    : form.modo === "ADMIN"
                    ? "Criar e Enviar ao Google Calendar"
                    : "Enviar Solicitação (Pendente)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

