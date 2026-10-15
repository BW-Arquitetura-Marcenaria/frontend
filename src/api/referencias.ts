import axios from "@/api/axios";

export type Referencia = {
  id: number;
  categoria: string;
  precoReferencia: string; // BigDecimal serialized as string
  descricao: string;
  materialBase: string;
  unidade: string;
  dataAtualizacao: string; // ISO datetime
};

export type Page<T> = {
  content: T[];
  pageable?: any;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export async function getReferencias(params?: { page?: number; size?: number; sort?: string }) {
  const resp = await axios.get('/v1/referencias', { params });
  return resp.data as Page<Referencia>;
}

export async function getReferenciaById(id: number) {
  const resp = await axios.get(`/v1/referencias/${id}`);
  return resp.data as Referencia;
}
