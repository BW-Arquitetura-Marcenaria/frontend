import axios from "@/api/axios";

export type ContaAdmin = {
  empresa: {
    nome: string;
    nomeFantasia: string | null;
    cnpj: string;
    telefone: string;
  };
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  } | null;
};

export type EmpresaAdminPayload = Pick<ContaAdmin["empresa"], "nome" | "nomeFantasia" | "telefone">;
export type EnderecoAdminPayload = NonNullable<ContaAdmin["endereco"]>;
export type SegurancaAdminPayload = {
  cnpj: string;
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
};

export async function getContaAdmin() {
  const response = await axios.get<ContaAdmin>("/v1/admin/conta");
  return response.data;
}

export async function putEmpresaAdmin(payload: EmpresaAdminPayload) {
  const response = await axios.put<ContaAdmin>("/v1/admin/conta/empresa", payload);
  return response.data;
}

export async function putEnderecoAdmin(payload: EnderecoAdminPayload) {
  const response = await axios.put<ContaAdmin>("/v1/admin/conta/endereco", payload);
  return response.data;
}

export async function putSegurancaAdmin(payload: SegurancaAdminPayload) {
  await axios.put("/v1/admin/conta/seguranca", payload);
}
