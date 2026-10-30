import axios from "@/api/axios";
import type { Page } from "@/models/Referencia";
import type { Rastreabilidade, RastreabilidadeRequest } from "@/models/Rastreabilidade";
import { mockRastreabilidades as mock } from "@/api/mocks/rastreabilidadesMock";

type PageParams = { page?: number; size?: number; sort?: string };

// Defina VITE_USE_MOCK=true no .env.development para usar dados mockados (sem backend).
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function getRastreabilidades(params?: PageParams) {
  if (USE_MOCK) return mock.list(params);
  const resp = await axios.get("/v1/rastreabilidades", { params });
  return resp.data as Page<Rastreabilidade>;
}

export async function getRastreabilidadesByProjeto(projetoId: number, params?: PageParams) {
  if (USE_MOCK) return mock.listByProjeto(projetoId, params);
  const resp = await axios.get(`/v1/rastreabilidades/projeto/${projetoId}`, { params });
  return resp.data as Page<Rastreabilidade>;
}

export async function createRastreabilidade(body: RastreabilidadeRequest) {
  if (USE_MOCK) return mock.create(body);
  const resp = await axios.post("/v1/rastreabilidades", body);
  return resp.data as Rastreabilidade;
}

export async function updateRastreabilidade(id: number, body: RastreabilidadeRequest) {
  if (USE_MOCK) return mock.update(id, body);
  const resp = await axios.put(`/v1/rastreabilidades/${id}`, body);
  return resp.data as Rastreabilidade;
}

export async function deleteRastreabilidade(id: number) {
  if (USE_MOCK) {
    await mock.remove(id);
    return true;
  }
  await axios.delete(`/v1/rastreabilidades/${id}`);
  return true;
}
