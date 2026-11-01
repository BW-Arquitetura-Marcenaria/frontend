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

export type CadastroValidacao = {
  nome: string;
  ambiente: string | null;
  movel: string | null;
  cor: string | null;
  material: string | null;
  orcamento: number | string | null;
  situacaoProjeto: string | null;
  precisaVisitaTecnica: boolean | null;
};

export type CadastroResponse = {
  id: number;
  tipoCliente: CadastroPayload["tipoCliente"];
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string | null;
  etapaFunil: string;
  dataCadastro: string;
};

export async function validarLinkCadastro(token: string): Promise<CadastroValidacao> {
  const { data } = await axios.get<CadastroValidacao>("/v1/api/cadastro/validar", { params: { token } });
  return data;
}

export async function cadastrarCliente(payload: CadastroPayload): Promise<CadastroResponse> {
  const { data } = await axios.post<CadastroResponse>("/v1/api/cadastro", payload);
  return data;
}
