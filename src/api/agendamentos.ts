import axios from "@/api/axios";
import type {
  Agendamento,
  DecisaoAgendamentoRequest,
  GoogleAuthorizationUrlResponse,
  GoogleCalendarInfo,
  SolicitacaoAgendamentoRequest,
} from "@/models/Agendamento";
import { mockAgendamentos as mock } from "@/api/mocks/agendamentosMock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Cliente solicita agendamento (cria com status = PENDENTE, valida conflito de horário).
 * Endpoint: POST /v1/agendamentos
 */
export async function solicitarAgendamento(
  body: SolicitacaoAgendamentoRequest
): Promise<Agendamento> {
  if (USE_MOCK) return mock.solicitar(body);
  const resp = await axios.post<Agendamento>("/v1/agendamentos", body);
  return resp.data;
}

/**
 * Admin cria agendamento diretamente já aprovado e integrado ao Google Calendar.
 * Endpoint: POST /v1/agendamentos/admin
 */
export async function criarAgendamentoAdmin(
  body: SolicitacaoAgendamentoRequest
): Promise<Agendamento> {
  if (USE_MOCK) return mock.criarComoAdmin(body);
  const resp = await axios.post<Agendamento>("/v1/agendamentos/admin", body);
  return resp.data;
}

/**
 * Admin lista todos os agendamentos (ordenados por criadoEm desc).
 * Endpoint: GET /v1/agendamentos/admin
 */
export async function listarAgendamentosAdmin(): Promise<Agendamento[]> {
  if (USE_MOCK) return mock.listarTodos();
  const resp = await axios.get<Agendamento[]>("/v1/agendamentos/admin");
  return resp.data;
}

/**
 * Admin aprova solicitação pendente (UPDATE atômico + cria evento no Google Calendar).
 * Endpoint: PATCH /v1/agendamentos/{id}/aprovado
 */
export async function aprovarAgendamento(
  id: number,
  body: DecisaoAgendamentoRequest = {}
): Promise<Agendamento> {
  if (USE_MOCK) return mock.aprovar(id, body);
  const resp = await axios.patch<Agendamento>(`/v1/agendamentos/${id}/aprovado`, {
    observacao: body.observacao ?? "",
  });
  return resp.data;
}

/**
 * Admin recusa solicitação pendente (UPDATE atômico, não cria evento no Google Calendar).
 * Endpoint: PATCH /v1/agendamentos/{id}/recusado
 */
export async function recusarAgendamento(
  id: number,
  body: DecisaoAgendamentoRequest = {}
): Promise<Agendamento> {
  if (USE_MOCK) return mock.recusar(id, body);
  const resp = await axios.patch<Agendamento>(`/v1/agendamentos/${id}/recusado`, {
    observacao: body.observacao ?? "",
  });
  return resp.data;
}

/**
 * Admin inicia fluxo OAuth2 do Google Calendar (retorna authorizationUrl e seta cookie google_oauth_browser).
 * Endpoint: POST /v1/api/admin/google-calendar/autorizar
 */
export async function autorizarGoogleCalendar(): Promise<GoogleAuthorizationUrlResponse> {
  if (USE_MOCK) return mock.autorizarGoogle();
  const resp = await axios.post<GoogleAuthorizationUrlResponse>(
    "/v1/api/admin/google-calendar/autorizar"
  );
  return resp.data;
}

/**
 * Admin lista calendários da conta Google conectada (valida se o refresh_token está ativo).
 * Endpoint: GET /v1/api/admin/google-calendar/calendarios
 */
export async function listarCalendariosGoogle(): Promise<GoogleCalendarInfo[]> {
  if (USE_MOCK) return mock.listarCalendariosGoogle();
  const resp = await axios.get<GoogleCalendarInfo[]>(
    "/v1/api/admin/google-calendar/calendarios"
  );
  return resp.data;
}

