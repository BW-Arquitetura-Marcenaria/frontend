import { useCallback, useEffect, useState } from "react";
import type {
  Agendamento,
  GoogleCalendarInfo,
  SolicitacaoAgendamentoRequest,
} from "@/models/Agendamento";
import {
  aprovarAgendamento,
  autorizarGoogleCalendar,
  criarAgendamentoAdmin,
  listarAgendamentosAdmin,
  listarCalendariosGoogle,
  recusarAgendamento,
  solicitarAgendamento,
} from "@/api/agendamentos";

function parseApiError(err: unknown): { error: Error; isGoogleDisconnected: boolean } {
  const e = err as any;
  const status: number | undefined = e?.response?.status ?? e?.status;
  const data = e?.response?.data;
  const detalhes: string[] | undefined = Array.isArray(data?.detalhes) ? data.detalhes : undefined;

  if (e?.code === "ERR_NETWORK" || (e?.isAxiosError && !e?.response)) {
    return {
      error: new Error(
        "Não foi possível conectar ao backend (http://localhost:8080). Verifique se a API Spring Boot está em execução."
      ),
      isGoogleDisconnected: false,
    };
  }

  if (status === 401) {
    return {
      error: new Error(
        "Usuário não autenticado (401). Faça login na plataforma para acessar os agendamentos."
      ),
      isGoogleDisconnected: false,
    };
  }

  if (status === 403) {
    return {
      error: new Error(
        "Permissão insuficiente (403). É necessário estar autenticado com perfil ADMIN."
      ),
      isGoogleDisconnected: false,
    };
  }

  const msg: string =
    (detalhes && detalhes.length > 0 ? detalhes.join(" · ") : undefined) ??
    data?.message ??
    e?.message ??
    String(err);

  const isGoogleDisconnected =
    status === 424 ||
    msg.toLowerCase().includes("google calendar expirou") ||
    msg.toLowerCase().includes("google-calendar/autorizar");

  return {
    error: new Error(msg),
    isGoogleDisconnected,
  };
}

export function useCalendarioViewModel(options: { autoFetchAdmin?: boolean } = { autoFetchAdmin: true }) {
  const { autoFetchAdmin = true } = options;

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [calendariosGoogle, setCalendariosGoogle] = useState<GoogleCalendarInfo[]>([]);
  const [googleConectado, setGoogleConectado] = useState<boolean | null>(null);
  const [awaitingOAuthCallback, setAwaitingOAuthCallback] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [googleError, setGoogleError] = useState<Error | null>(null);

  const verificarConexaoGoogle = useCallback(async () => {
    try {
      setGoogleError(null);
      const cals = await listarCalendariosGoogle();
      setCalendariosGoogle(cals);
      setGoogleConectado(true);
      setAwaitingOAuthCallback(false);
      return cals;
    } catch (err) {
      const { error: parsed, isGoogleDisconnected } = parseApiError(err);
      setCalendariosGoogle([]);
      setGoogleConectado(false);
      if (!isGoogleDisconnected) {
        setGoogleError(parsed);
      }
      return null;
    }
  }, []);

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await listarAgendamentosAdmin();
      setAgendamentos(lista);
      return lista;
    } catch (err) {
      const { error: parsed } = parseApiError(err);
      setError(parsed);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAgendamentos(), verificarConexaoGoogle()]);
  }, [fetchAgendamentos, verificarConexaoGoogle]);

  const conectarGoogle = useCallback(async () => {
    setConnectingGoogle(true);
    setGoogleError(null);
    try {
      const { authorizationUrl } = await autorizarGoogleCalendar();
      setAwaitingOAuthCallback(true);

      if (authorizationUrl.includes("mock=1")) {
        await verificarConexaoGoogle();
      } else {
        window.open(authorizationUrl, "_blank", "noopener,noreferrer");
      }
      return authorizationUrl;
    } catch (err) {
      const { error: parsed } = parseApiError(err);
      setGoogleError(parsed);
      return undefined;
    } finally {
      setConnectingGoogle(false);
    }
  }, [verificarConexaoGoogle]);

  const criarComoAdmin = useCallback(
    async (body: SolicitacaoAgendamentoRequest): Promise<Agendamento | undefined> => {
      setSaving(true);
      setError(null);
      try {
        const criado = await criarAgendamentoAdmin(body);
        await fetchAgendamentos();
        return criado;
      } catch (err) {
        const { error: parsed, isGoogleDisconnected } = parseApiError(err);
        if (isGoogleDisconnected) {
          setGoogleConectado(false);
        }
        setError(parsed);
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [fetchAgendamentos]
  );

  const solicitarComoCliente = useCallback(
    async (body: SolicitacaoAgendamentoRequest): Promise<Agendamento | undefined> => {
      setSaving(true);
      setError(null);
      try {
        const criado = await solicitarAgendamento(body);
        return criado;
      } catch (err) {
        const { error: parsed } = parseApiError(err);
        setError(parsed);
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const aprovar = useCallback(
    async (id: number, observacao?: string): Promise<Agendamento | undefined> => {
      setSaving(true);
      setError(null);
      try {
        const atualizado = await aprovarAgendamento(id, { observacao });
        setAgendamentos((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
        return atualizado;
      } catch (err) {
        const { error: parsed, isGoogleDisconnected } = parseApiError(err);
        if (isGoogleDisconnected) {
          setGoogleConectado(false);
        }
        setError(parsed);
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const recusar = useCallback(
    async (id: number, observacao?: string): Promise<Agendamento | undefined> => {
      setSaving(true);
      setError(null);
      try {
        const atualizado = await recusarAgendamento(id, { observacao });
        setAgendamentos((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
        return atualizado;
      } catch (err) {
        const { error: parsed } = parseApiError(err);
        setError(parsed);
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetchAdmin) {
      void refreshAll();
    }
  }, [autoFetchAdmin, refreshAll]);

  useEffect(() => {
    if (!awaitingOAuthCallback) return;
    const onFocus = () => {
      void verificarConexaoGoogle();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [awaitingOAuthCallback, verificarConexaoGoogle]);

  return {
    agendamentos,
    calendariosGoogle,
    googleConectado,
    awaitingOAuthCallback,
    loading,
    saving,
    connectingGoogle,
    error,
    googleError,
    clearError: () => setError(null),
    fetchAgendamentos,
    verificarConexaoGoogle,
    refreshAll,
    conectarGoogle,
    criarComoAdmin,
    solicitarComoCliente,
    aprovar,
    recusar,
  } as const;
}
