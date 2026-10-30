import axios from "@/api/axios";

export async function getMinhaConta() {
  const resp = await axios.get('/v1/minha-conta');
  return resp.data;
}

export async function putMinhaConta(payload: any) {
  const resp = await axios.put('/v1/minha-conta', payload);
  return resp.data;
}
