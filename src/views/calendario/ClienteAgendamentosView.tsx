import React, { useEffect, useMemo, useState } from "react";
import { useCalendarioViewModel } from "@/viewmodels/calendario/useCalendarioViewModel";
import type { Agendamento, StatusAgendamento } from "@/models/Agendamento";
import {
  buildLocalDateTimeISO,
  extractDateISO,
  extractTimeHHMM,
} from "@/models/Agendamento";

const CLIENTE_MEUS_IDS_KEY = "bw-cliente-meus-ids-v1";
const CLIENTE_HISTORICO_KEY = "bw-cliente-solicitacoes-v2";

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

function fmtDateBR(isoDate: string): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function loadMeusIds(): number[] {
  try {
    const raw = localStorage.getItem(CLIENTE_MEUS_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

function saveMeusIds(ids: number[]): void {
  try {
    localStorage.setItem(CLIENTE_MEUS_IDS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function loadHistoricoLocal(): Agendamento[] {
  try {
    const raw = localStorage.getItem(CLIENTE_HISTORICO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistoricoLocal(items: Agendamento[]): void {
  try {
    localStorage.setItem(CLIENTE_HISTORICO_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const STATUS_BADGE: Record<
  StatusAgendamento,
  { label: string; cls: string; pillCls: string }
> = {
  PENDENTE: {
    label: "Pendente",
    cls: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    pillCls: "border-amber-400/50 bg-amber-500/20 text-amber-200",
  },
  APROVADO: {
    label: "Aprovado",
    cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    pillCls: "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
  },
  RECUSADO: {
    label: "Recusado",
    cls: "border-red-400/40 bg-red-400/10 text-red-300",
    pillCls: "border-red-400/40 bg-red-500/15 text-red-300 line-through opacity-70",
  },
  CANCELADO: {
    label: "Cancelado",
    cls: "border-white/20 bg-white/5 text-white/50",
    pillCls: "border-white/20 bg-white/10 text-white/50 line-through opacity-70",
  },
};

export default function ClienteAgendamentosView() {
  const { saving, error, clearError, solicitarComoCliente } = useCalendarioViewModel({
    autoFetchAdmin: false,
  });

  const now = new Date();
  const hojeISO = toISO(now.getFullYear(), now.getMonth(), now.getDate());

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<{
    agendamento: Agendamento;
    isMeu: boolean;
  } | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(getAmanhãISO);
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFim, setHoraFim] = useState("11:00");
  const [localError, setLocalError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<Agendamento | null>(null);

  const [meusIds, setMeusIds] = useState<number[]>(loadMeusIds);
  const [todosAgendamentos, setTodosAgendamentos] = useState<Agendamento[]>(
    loadHistoricoLocal
  );

  // Carrega a agenda geral (apenas para exibir blocos "Ocupado" nos horários de terceiros e sincronizar status dos meus)
  useEffect(() => {
    try {
      const mockRaw = localStorage.getItem("bw-agendamentos-mock-v1");
      if (!mockRaw) return;
      const mockList: Agendamento[] = JSON.parse(mockRaw);
      if (!Array.isArray(mockList)) return;

      setTodosAgendamentos((prev) => {
        const map = new Map<number, Agendamento>();
        for (const item of prev) map.set(item.id, item);
        for (const m of mockList) map.set(m.id, m);
        const merged = Array.from(map.values()).sort((a, b) => b.id - a.id);
        saveHistoricoLocal(merged);
        return merged;
      });
    } catch {
      // ignore
    }
  }, []);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const trailing = (7 - ((firstWeekday + daysInMonth) % 7)) % 7;
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // Horários ocupados no dia selecionado no modal
  const ocupadosNoDiaModal = useMemo(() => {
    return todosAgendamentos
      .filter(
        (ev) =>
          extractDateISO(ev.inicio) === data &&
          (ev.status === "PENDENTE" || ev.status === "APROVADO")
      )
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [todosAgendamentos, data]);

  const changeMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const openDayModal = (dateISO?: string) => {
    clearError();
    setLocalError(null);
    setSelectedAgendamento(null);
    const chosen = dateISO && dateISO > hojeISO ? dateISO : getAmanhãISO();
    setData(chosen);
    setHoraInicio("10:00");
    setHoraFim("11:00");
    setTitulo("");
    setDescricao("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSucesso(null);
    clearError();

    if (!titulo.trim()) {
      setLocalError("Informe o título ou assunto do agendamento.");
      return;
    }

    const inicioISO = buildLocalDateTimeISO(data, horaInicio);
    const fimISO = buildLocalDateTimeISO(data, horaFim);

    const inicioMs = new Date(inicioISO).getTime();
    const fimMs = new Date(fimISO).getTime();

    if (Number.isNaN(inicioMs) || Number.isNaN(fimMs)) {
      setLocalError("Data ou horário inválido.");
      return;
    }
    if (inicioMs <= Date.now()) {
      setLocalError("A data e o horário de início devem estar no futuro.");
      return;
    }
    if (fimMs <= inicioMs) {
      setLocalError("O horário de término deve ser posterior ao início.");
      return;
    }

    const criado = await solicitarComoCliente({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      inicio: inicioISO,
      fim: fimISO,
    });

    if (criado) {
      setSucesso(criado);
      setTitulo("");
      setDescricao("");
      setModalOpen(false);
      const [y, m] = data.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
      setMeusIds((prev) => {
        const nextIds = Array.from(new Set([criado.id, ...prev]));
        saveMeusIds(nextIds);
        return nextIds;
      });
      setTodosAgendamentos((prev) => {
        const next = [criado, ...prev.filter((i) => i.id !== criado.id)];
        saveHistoricoLocal(next);
        return next;
      });
    }
  };

  const glassInput =
    "w-full bg-transparent border-0 border-b border-white/20 py-2.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-bw-dourado transition-colors";
  const glassLabel =
    "block text-[10px] font-mono uppercase tracking-[.18em] text-white/45 mb-1";

  return (
    <div
      className="flex flex-col w-full h-full rounded-sm overflow-y-auto p-5 sm:p-7 gap-6"
      style={{
        background: "rgba(22,19,15,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[.2em] text-bw-dourado mb-1">
            Agenda Online · Portal do Cliente
          </div>
          <h2 className="text-2xl sm:text-3xl font-display text-white">
            Calendário de Agendamentos
          </h2>
          <p className="text-xs text-white/55 mt-1">
            Clique em um dia disponível para solicitar um horário. Sua solicitação nasce com
            status <strong className="text-bw-dourado font-mono">PENDENTE</strong> até a
            confirmação da equipe BW.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openDayModal()}
          className="shrink-0 px-5 py-2.5 bg-bw-dourado text-white text-[11px] font-mono uppercase tracking-[.16em] hover:bg-[#c19d65] transition-colors"
        >
          + Solicitar Agendamento
        </button>
      </div>

      {sucesso && (
        <div className="flex items-center justify-between gap-3 border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 mr-2">
              ✓ Solicitação Enviada:
            </span>
            <strong>"{sucesso.titulo}"</strong> registrada com status{" "}
            <strong className="font-mono">{sucesso.status}</strong> para{" "}
            {fmtDateBR(extractDateISO(sucesso.inicio))} às {extractTimeHHMM(sucesso.inicio)}.
          </div>
          <button
            type="button"
            onClick={() => setSucesso(null)}
            className="text-[10px] font-mono uppercase text-emerald-300 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Controles do Mês */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewYear(now.getFullYear());
              setViewMonth(now.getMonth());
            }}
            className="px-3 py-1.5 border border-white/15 text-white/80 text-xs font-mono hover:border-bw-dourado hover:text-bw-dourado transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mês anterior"
            className="px-2.5 py-1.5 border border-white/15 text-white/80 text-xs hover:border-bw-dourado hover:text-bw-dourado transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Próximo mês"
            className="px-2.5 py-1.5 border border-white/15 text-white/80 text-xs hover:border-bw-dourado hover:text-bw-dourado transition-colors"
          >
            ›
          </button>
          <span className="ml-2 font-display text-xl text-white">
            {MESES[viewMonth]} {viewYear}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/35" /> Horário Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Minha Solicitação (Pendente)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Meu Agendamento (Aprovado)
          </span>
        </div>
      </div>

      {/* Grade Mensal do Calendário do Cliente */}
      <div className="overflow-x-auto border border-white/10 bg-black/25">
        <div className="min-w-[38rem]">
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.04]">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-mono uppercase tracking-wider text-white/50"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {[...Array(firstWeekday)].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-24 border-r border-b border-white/10 bg-white/[0.01]"
              />
            ))}
            {days.map((d) => {
              const iso = toISO(viewYear, viewMonth, d);
              const isHoje = iso === hojeISO;
              const doDia = todosAgendamentos
                .filter((ev) => {
                  if (extractDateISO(ev.inicio) !== iso) return false;
                  const isMeu = meusIds.includes(ev.id);
                  // De terceiros, exibe apenas se estiver ocupando a agenda (PENDENTE ou APROVADO)
                  return isMeu || ev.status === "PENDENTE" || ev.status === "APROVADO";
                })
                .sort((a, b) => a.inicio.localeCompare(b.inicio));

              return (
                <div
                  key={d}
                  onClick={() => openDayModal(iso)}
                  className={`h-24 p-1.5 border-r border-b border-white/10 overflow-y-auto cursor-pointer hover:bg-bw-dourado/10 transition-colors ${
                    isHoje ? "bg-bw-dourado/15" : ""
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono mb-1 flex items-center justify-between ${
                      isHoje ? "font-bold text-bw-dourado" : "text-white/50"
                    }`}
                  >
                    <span>
                      {d}
                      {isHoje && " · Hoje"}
                    </span>
                    <span className="text-[9px] text-white/25 hover:text-bw-dourado">+</span>
                  </div>
                  {doDia.map((ev) => {
                    const isMeu = meusIds.includes(ev.id);
                    const hIni = extractTimeHHMM(ev.inicio);
                    const hFim = extractTimeHHMM(ev.fim);

                    if (!isMeu) {
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgendamento({ agendamento: ev, isMeu: false });
                          }}
                          className="block w-full text-left text-[9px] rounded px-1.5 py-0.5 truncate font-mono mb-1 border border-white/15 bg-white/10 text-white/60 hover:bg-white/15"
                          title={`${hIni} às ${hFim} · Ocupado`}
                        >
                          {hIni}–{hFim} · Ocupado
                        </button>
                      );
                    }

                    const meta = STATUS_BADGE[ev.status] ?? STATUS_BADGE.PENDENTE;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgendamento({ agendamento: ev, isMeu: true });
                        }}
                        className={`block w-full text-left text-[9px] rounded px-1.5 py-0.5 truncate font-mono mb-1 border ${meta.pillCls}`}
                      >
                        {hIni} {ev.titulo}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {[...Array(trailing)].map((_, i) => (
              <div
                key={`trail-${i}`}
                className="h-24 border-r border-b border-white/10 bg-white/[0.01]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes de um Item no Calendário */}
      {selectedAgendamento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedAgendamento(null)}
        >
          <div
            className="w-full max-w-md border border-bw-dourado/30 bg-bw-preto p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              {selectedAgendamento.isMeu ? (
                <span
                  className={`rounded border px-2 py-0.5 text-[9px] font-mono uppercase ${
                    (
                      STATUS_BADGE[selectedAgendamento.agendamento.status] ??
                      STATUS_BADGE.PENDENTE
                    ).cls
                  }`}
                >
                  {
                    (
                      STATUS_BADGE[selectedAgendamento.agendamento.status] ??
                      STATUS_BADGE.PENDENTE
                    ).label
                  }
                </span>
              ) : (
                <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-mono uppercase text-white/70">
                  Horário Indisponível
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedAgendamento(null)}
                className="text-[10px] font-mono uppercase text-white/50 hover:text-white"
              >
                Fechar
              </button>
            </div>

            {selectedAgendamento.isMeu ? (
              <>
                <h3 className="font-display text-2xl text-white">
                  {selectedAgendamento.agendamento.titulo}
                </h3>
                <div className="text-xs font-mono text-bw-dourado mt-1">
                  {fmtDateBR(extractDateISO(selectedAgendamento.agendamento.inicio))} ·{" "}
                  {extractTimeHHMM(selectedAgendamento.agendamento.inicio)} às{" "}
                  {extractTimeHHMM(selectedAgendamento.agendamento.fim)}
                </div>
                {selectedAgendamento.agendamento.descricao && (
                  <p className="text-xs text-white/70 mt-3 leading-relaxed border-t border-white/10 pt-3">
                    {selectedAgendamento.agendamento.descricao}
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="font-display text-2xl text-white">Horário Ocupado</h3>
                <div className="text-xs font-mono text-bw-dourado mt-1">
                  {fmtDateBR(extractDateISO(selectedAgendamento.agendamento.inicio))} ·{" "}
                  {extractTimeHHMM(selectedAgendamento.agendamento.inicio)} às{" "}
                  {extractTimeHHMM(selectedAgendamento.agendamento.fim)}
                </div>
                <p className="text-xs text-white/60 mt-3 leading-relaxed border-t border-white/10 pt-3">
                  Este intervalo já está reservado na agenda da equipe BW. Você pode escolher
                  outro horário livre neste mesmo dia ou em outra data.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openDayModal(extractDateISO(selectedAgendamento.agendamento.inicio))
                  }
                  className="mt-4 w-full py-2.5 border border-bw-dourado/50 text-bw-dourado text-[10px] font-mono uppercase tracking-wider hover:bg-bw-dourado/15 transition-colors"
                >
                  Escolher outro horário neste dia
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal para Solicitar Novo Agendamento */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md border border-bw-dourado/30 bg-bw-preto/95 p-6 sm:p-8 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-5 text-[10px] font-mono uppercase tracking-wider text-bw-areia hover:text-white"
            >
              Fechar
            </button>

            <div className="mb-5">
              <div className="text-[9px] font-mono uppercase tracking-[.2em] text-bw-dourado">
                Nova Solicitação
              </div>
              <h3 className="font-display text-2xl text-white mt-1">
                Agendar Horário
              </h3>
              <p className="text-[11px] text-white/50 mt-1">
                Será criada com status <strong className="text-bw-dourado">PENDENTE</strong>{" "}
                para aprovação da equipe BW.
              </p>
            </div>

            {ocupadosNoDiaModal.length > 0 && (
              <div className="mb-5 border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-[11px] font-mono text-white/70">
                <div className="text-[9px] uppercase tracking-wider text-bw-dourado mb-1">
                  Horários já ocupados em {fmtDateBR(data)}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {ocupadosNoDiaModal.map((oc) => (
                    <span
                      key={oc.id}
                      className="rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] text-white/80"
                    >
                      {extractTimeHHMM(oc.inicio)} às {extractTimeHHMM(oc.fim)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
              <div>
                <label className={glassLabel}>Assunto / Título *</label>
                <input
                  type="text"
                  maxLength={150}
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Visita técnica — Medição da sala"
                  className={glassInput}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={glassLabel}>Data *</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className={`${glassInput} [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label className={glassLabel}>Início *</label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className={`${glassInput} [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label className={glassLabel}>Término *</label>
                  <input
                    type="time"
                    required
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className={`${glassInput} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label className={glassLabel}>Descrição / Observações (Opcional)</label>
                <textarea
                  rows={2}
                  maxLength={5000}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes do ambiente, endereço ou dúvidas..."
                  className={`${glassInput} resize-none`}
                />
              </div>

              {(localError || error) && (
                <div className="border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-300">
                  {localError ?? error?.message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 w-full py-3 bg-bw-dourado text-white text-[11px] font-mono uppercase tracking-[.18em] hover:bg-[#c19d65] transition-colors disabled:opacity-50"
              >
                {saving ? "Enviando..." : "Confirmar Solicitação"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
