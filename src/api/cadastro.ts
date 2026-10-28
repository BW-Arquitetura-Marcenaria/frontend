import axios from "@/api/axios";

export type CadastroPayload = {
  token: string;
  tipoCliente: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  nome: string;
  sobrenome: string;
  cpf: string;
  dataNascimento: string | null;
  email: string;
  telefone: string;
  origemContato: string;
  senha: string;
  cnpj: string | null;
  razaoSocial: string | null;
  nomeFantasia: string | null;
};

export async function validarLinkCadastro(token: string) {
  const { data } = await axios.get<{ nome: string }>("/v1/api/cadastro/validar", { params: { token } });
  return data;
}

export async function cadastrarCliente(payload: CadastroPayload) {
  const { data } = await axios.post<{ id: number; email: string }>("/v1/api/cadastro", payload);
  return data;
}
