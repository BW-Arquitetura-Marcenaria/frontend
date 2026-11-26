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

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "bw-mock-conta-admin-v1";

const DEFAULT_CONTA_ADMIN: ContaAdmin = {
  empresa: {
    nome: "BW Arquitetura e Marcenaria Ltda.",
    nomeFantasia: "BW Arquitetura & Marcenaria",
    cnpj: "12345678000195",
    telefone: "(11) 98842-1930",
  },
  endereco: {
    cep: "01414001",
    logradouro: "Rua Haddock Lobo",
    numero: "1307",
    complemento: "Conjunto 82",
    bairro: "Cerqueira César",
    cidade: "São Paulo",
    uf: "SP",
  },
};

function lerContaMock(): ContaAdmin {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ContaAdmin;
  } catch {
    // ignore
  }
  return structuredClone(DEFAULT_CONTA_ADMIN);
}

function salvarContaMock(conta: ContaAdmin): ContaAdmin {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conta));
  } catch {
    // ignore
  }
  return conta;
}

export async function getContaAdmin() {
  if (USE_MOCK) return lerContaMock();
  const response = await axios.get<ContaAdmin>("/v1/admin/conta");
  return response.data;
}

export async function putEmpresaAdmin(payload: EmpresaAdminPayload) {
  if (USE_MOCK) {
    const atual = lerContaMock();
    return salvarContaMock({
      ...atual,
      empresa: { ...atual.empresa, ...payload },
    });
  }
  const response = await axios.put<ContaAdmin>("/v1/admin/conta/empresa", payload);
  return response.data;
}

export async function putEnderecoAdmin(payload: EnderecoAdminPayload) {
  if (USE_MOCK) {
    const atual = lerContaMock();
    return salvarContaMock({
      ...atual,
      endereco: { ...payload },
    });
  }
  const response = await axios.put<ContaAdmin>("/v1/admin/conta/endereco", payload);
  return response.data;
}

export async function putSegurancaAdmin(payload: SegurancaAdminPayload) {
  if (USE_MOCK) return;
  await axios.put("/v1/admin/conta/seguranca", payload);
}
