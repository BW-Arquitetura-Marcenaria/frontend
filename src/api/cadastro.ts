import axios from "@/api/axios";

export type CadastroPayload = {
  token?: string;
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
  email: string | null;
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

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function validarLinkCadastro(token: string): Promise<CadastroValidacao> {
  if (USE_MOCK) {
    return {
      nome: "Maria Souza",
      email: token.includes("admin") ? "maria.souza@email.com" : null,
      ambiente: "Cozinha Gourmet",
      movel: "Cozinha planejada",
      cor: "Nogueira & Off-white",
      material: "MDF Folheado Freijó",
      orcamento: 25000,
      situacaoProjeto: "Imóvel pronto para medição",
      precisaVisitaTecnica: true,
    };
  }
  const { data } = await axios.get<CadastroValidacao>("/v1/api/cadastro/validar", { params: { token } });
  return data;
}

export async function cadastrarCliente(payload: CadastroPayload): Promise<CadastroResponse> {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      tipoCliente: payload.tipoCliente,
      nome: payload.nome,
      sobrenome: payload.sobrenome,
      email: payload.email,
      telefone: payload.telefone,
      etapaFunil: "NOVO_LEAD",
      dataCadastro: new Date().toISOString(),
    };
  }
  const { data } = await axios.post<CadastroResponse>("/v1/api/cadastro", payload);
  return data;
}

export async function cadastrarClienteDireto(payload: Omit<CadastroPayload, "token">): Promise<CadastroResponse> {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      tipoCliente: payload.tipoCliente,
      nome: payload.nome,
      sobrenome: payload.sobrenome,
      email: payload.email,
      telefone: payload.telefone,
      etapaFunil: "NOVO_LEAD",
      dataCadastro: new Date().toISOString(),
    };
  }
  const { data } = await axios.post<CadastroResponse>("/v1/api/cadastro/direto", payload);
  return data;
}
