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

export async function deleteReferencia(id: number) {
  await axios.delete(`/v1/referencias/${id}`);
  return true;
}

export async function createReferencia(body: {
  categoria: string;
  precoReferencia: number | string;
  descricao: string;
  materialBase: string;
  unidade: string;
}) {
  const resp = await axios.post('/v1/referencias', body);
  return resp.data as Referencia;
}

export async function updateReferencia(id: number, body: {
  categoria: string;
  precoReferencia: number | string;
  descricao: string;
  materialBase: string;
  unidade: string;
}) {
  const resp = await axios.put(`/v1/referencias/${id}`, body);
  return resp.data as Referencia;
}

export async function exportReferencias(format: 'pdf' | 'excel') {
  const resp = await axios.get(`/v1/referencias/export/${format}`, { responseType: 'blob' });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const url = URL.createObjectURL(resp.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tabela-precos-referencia.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
