import axios from "@/api/axios";
import type { Referencia, Page } from "@/models/Referencia";

export async function getReferencias(params?: { page?: number; size?: number; sort?: string }) {
  const resp = await axios.get('/v1/referencias', { params });
  return resp.data as Page<Referencia>;
}

export async function getReferenciaById(id: number) {
  const resp = await axios.get(`/v1/referencias/${id}`);
  return resp.data as Referencia;
}
