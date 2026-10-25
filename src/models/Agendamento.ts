export type StatusAgendamento = "PENDENTE" | "APROVADO" | "RECUSADO" | "CANCELADO";

export interface Agendamento {
  id: number;
  titulo: string;
  descricao: string | null;
  inicio: string; // ISO LocalDateTime: "YYYY-MM-DDTHH:mm:ss"
  fim: string;    // ISO LocalDateTime: "YYYY-MM-DDTHH:mm:ss"
  status: StatusAgendamento;
  googleEventId: string | null;
  observacaoAdmin?: string | null;
}

export interface SolicitacaoAgendamentoRequest {
  titulo: string;
  descricao?: string;
  inicio: string; // "YYYY-MM-DDTHH:mm:ss"
  fim: string;    // "YYYY-MM-DDTHH:mm:ss"
}

export interface DecisaoAgendamentoRequest {
  observacao?: string;
}

export interface GoogleAuthorizationUrlResponse {
  authorizationUrl: string;
}

export interface GoogleCalendarInfo {
  id: string;
  nome: string;
  fusoHorario: string;
  principal: boolean;
}

/** Extrai "YYYY-MM-DD" de um ISO LocalDateTime ("YYYY-MM-DDTHH:mm:ss"). */
export function extractDateISO(localDateTime: string): string {
  if (!localDateTime) return "";
  return localDateTime.slice(0, 10);
}

/** Extrai "HH:mm" de um ISO LocalDateTime ("YYYY-MM-DDTHH:mm:ss"). */
export function extractTimeHHMM(localDateTime: string): string {
  if (!localDateTime || localDateTime.length < 16) return "00:00";
  return localDateTime.slice(11, 16);
}

/** Monta "YYYY-MM-DDTHH:mm:00" a partir de data ("YYYY-MM-DD") e hora ("HH:mm"). */
export function buildLocalDateTimeISO(dateISO: string, timeHHMM: string): string {
  const cleanTime = timeHHMM.length === 5 ? `${timeHHMM}:00` : timeHHMM;
  return `${dateISO}T${cleanTime}`;
}

/** Verifica se dois intervalos [inicioA, fimA) e [inicioB, fimB) colidem. */
export function horariosColidem(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string
): boolean {
  const aStart = new Date(inicioA).getTime();
  const aEnd = new Date(fimA).getTime();
  const bStart = new Date(inicioB).getTime();
  const bEnd = new Date(fimB).getTime();
  if (Number.isNaN(aStart) || Number.isNaN(aEnd) || Number.isNaN(bStart) || Number.isNaN(bEnd)) {
    return false;
  }
  return aStart < bEnd && aEnd > bStart;
}

