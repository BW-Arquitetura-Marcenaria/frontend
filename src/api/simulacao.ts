import axios from "axios";
import type { SimulacaoFluxRequest, SimulacaoFluxResponse } from "@/models/SimulacaoIa";

/**
 * Gera uma imagem do ambiente redesenhado com IA (FLUX.2 [flex]).
 *
 * A chamada sai do browser para um endpoint relativo do app; o proxy de
 * desenvolvimento (ou o backend) encaminha para a Flux mantendo a chave de API
 * fora do cliente.
 */
export async function gerarSimulacaoFlux(
  payload: SimulacaoFluxRequest
): Promise<SimulacaoFluxResponse> {
  const resp = await axios.post<SimulacaoFluxResponse>("/v1/simulacao/flux", payload, {
    timeout: 120000,
  });
  return resp.data;
}