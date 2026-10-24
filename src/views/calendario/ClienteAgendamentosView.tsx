import React, { useEffect, useState } from "react";
import { useCalendarioViewModel } from "@/viewmodels/calendario/useCalendarioViewModel";
import type { Agendamento, StatusAgendamento } from "@/models/Agendamento";
import {
  buildLocalDateTimeISO,
  extractDateISO,
  extractTimeHHMM,
} from "@/models/Agendamento";

const CLIENTE_HISTORICO_KEY = "bw-cliente-solicitacoes-v1";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getAmanhãISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtDateBR(isoDate: string): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
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

const STATUS_BADGE: Record<StatusAgendamento, { label: string; cls: string }> = {
  PENDENTE: {
    label: "Pendente de aprovação",
    cls: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  APROVADO: {
    label: "Aprovado e Confirmado",
    cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  RECUSADO: {
    label: "Não disponível / Recusado",
    cls: "border-red-400/40 bg-red-400/10 text-red-300",
  },
  CANCELADO: {
    label: "Cancelado",
    cls: "border-white/20 bg-white/5 text-white/50",
  },
};

export default function ClienteAgendamentosView() {
  const { saving, error, clearError, solicitarComoCliente } = useCalendarioViewModel({
    autoFetchAdmin: false,
  });

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(getAmanhãISO);
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFim, setHoraFim] = useState("11:00");
  const [localError, setLocalError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<Agendamento | null>(null);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState<Agendamento[]>(
    loadHistoricoLocal
  );

  // Sincroniza status caso o mock local tenha atualizado alguma solicitação
  useEffect(() => {
    try {
      const mockRaw = localStorage.getItem("bw-agendamentos-mock-v1");
      if (!mockRaw) return;
      const mockList: Agendamento[] = JSON.parse(mockRaw);
      if (!Array.isArray(mockList)) return;

      setMinhasSolicitacoes((prev) => {
        if (prev.length === 0) return prev;
        const updated = prev.map((item) => {
          const found = mockList.find((m) => m.id === item.id);
          return found ? { ...item, ...found } : item;
        });
        saveHistoricoLocal(updated);
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

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
      setMinhasSolicitacoes((prev) => {
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
      className="flex flex-col w-full h-full rounded-sm overflow-y-auto p-6 sm:p-8 gap-8"
      style={{
        background: "rgba(22,19,15,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      }}
    >
      <div className="border-b border-white/10 pb-5">
        <div className="text-[10px] font-mono uppercase tracking-[.2em] text-bw-dourado mb-1">
          Agenda BW Arquitetura
        </div>
        <h2 className="text-2xl sm:text-3xl font-display text-white">
          Solicitar Agendamento
        </h2>
        <p className="text-xs text-white/55 mt-1.5 max-w-2xl leading-relaxed">
          Escolha uma data e horário disponível para reunião de briefing, apresentação de
          projeto ou visita técnica. Sua solicitação será enviada com status{" "}
          <strong className="text-bw-dourado font-mono">PENDENTE</strong> para confirmação da
          nossa equipe.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Formulário de Solicitação */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="lg:col-span-3 flex flex-col gap-5"
        >
          <div>
            <label className={glassLabel}>Assunto / Título da Solicitação *</label>
            <input
              type="text"
              maxLength={150}
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Visita técnica — Medição da sala de estar"
              className={glassInput}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
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
              rows={3}
              maxLength={5000}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informe detalhes do ambiente, endereço ou dúvidas que gostaria de abordar..."
              className={`${glassInput} resize-none`}
            />
          </div>

          {(localError || error) && (
            <div className="border border-red-400/35 bg-red-500/10 px-4 py-3 text-xs font-mono text-red-300">
              {localError ?? error?.message}
            </div>
          )}

          {sucesso && (
            <div className="border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
              <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 mb-1">
                ✓ Solicitação Registrada (#{sucesso.id})
              </div>
              Sua solicitação <strong>"{sucesso.titulo}"</strong> foi criada com status{" "}
              <strong className="font-mono">{sucesso.status}</strong>. Assim que o
              administrador aprovar, o compromisso será confirmado no calendário.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-bw-dourado text-white text-[11px] font-mono uppercase tracking-[.18em] hover:bg-[#c19d65] transition-colors disabled:opacity-50"
            >
              {saving ? "Enviando solicitação..." : "Enviar Solicitação de Agendamento ›"}
            </button>
          </div>
        </form>

        {/* Histórico de Solicitações na Sessão */}
        <div className="lg:col-span-2 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-7">
          <div className="text-[10px] font-mono uppercase tracking-[.18em] text-white/45">
            Suas Solicitações Recentes
          </div>

          {minhasSolicitacoes.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.02] p-5 text-xs text-white/45 leading-relaxed">
              Você ainda não enviou solicitações de agendamento nesta sessão. Preencha os
              dados ao lado para solicitar um horário.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {minhasSolicitacoes.map((item) => {
                const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.PENDENTE;
                return (
                  <div
                    key={item.id}
                    className="border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white">
                        {item.titulo}
                      </span>
                      <span
                        className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-mono uppercase ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-bw-dourado">
                      {fmtDateBR(extractDateISO(item.inicio))} ·{" "}
                      {extractTimeHHMM(item.inicio)} às {extractTimeHHMM(item.fim)}
                    </div>
                    {item.descricao && (
                      <p className="text-xs text-white/55 line-clamp-2">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

