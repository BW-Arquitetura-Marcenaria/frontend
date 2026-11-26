import axios from "@/api/axios";

export type AdministradorTipo = "USUARIO" | "CONVITE";
export type AdministradorStatus = "ATIVO" | "DESATIVADO" | "CONVITE_ENVIADO";

export type AdministradorItem = {
  id: number;
  tipo: AdministradorTipo;
  nomeCompleto: string;
  email: string;
  cpf: string;
  status: AdministradorStatus;
};

export type AdministradoresResponse = {
  acessosAtivos: number;
  administradores: AdministradorItem[];
};

export type ConviteAdminPayload = {
  nomeCompleto: string;
  email: string;
  cpf: string;
};

export type ConviteAdminValidacaoResponse = {
  nomeCompleto: string;
  email: string;
  nomeEmpresa: string;
  expiraEm: string;
};

export type ConviteAdminAceitarPayload = {
  token: string;
  senha: string;
  confirmarSenha: string;
};

export type ConviteAdminRecusarPayload = {
  token: string;
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "bw-mock-administradores-v1";

const INITIAL_ADMINS: AdministradorItem[] = [
  { id: 1, tipo: "USUARIO", nomeCompleto: "Bianca Alves", email: "bianca@bwarquitetura.com.br", cpf: "***.482.***-**", status: "ATIVO" },
  { id: 2, tipo: "USUARIO", nomeCompleto: "Walmir Santos", email: "walmir@bwarquitetura.com.br", cpf: "***.715.***-**", status: "ATIVO" },
  { id: 3, tipo: "CONVITE", nomeCompleto: "Lívia Moraes", email: "livia@bwarquitetura.com.br", cpf: "***.039.***-**", status: "CONVITE_ENVIADO" },
];

function lerAdminsMock(): AdministradorItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdministradorItem[];
  } catch {
    // ignore
  }
  return structuredClone(INITIAL_ADMINS);
}

function salvarAdminsMock(lista: AdministradorItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // ignore
  }
}

export async function getAdministradores(): Promise<AdministradoresResponse> {
  if (USE_MOCK) {
    const administradores = lerAdminsMock();
    return {
      acessosAtivos: administradores.filter(a => a.status === "ATIVO").length,
      administradores,
    };
  }
  const { data } = await axios.get<AdministradoresResponse>("/v1/admin/administradores");
  return data;
}

export async function convidarAdministrador(payload: ConviteAdminPayload): Promise<AdministradorItem> {
  if (USE_MOCK) {
    const lista = lerAdminsMock();
    const digits = payload.cpf.replace(/\D/g, "");
    const maskedCpf = digits.length >= 6 ? `***.${digits.slice(3, 6)}.***-**` : "***.000.***-**";
    const novo: AdministradorItem = {
      id: Date.now(),
      tipo: "CONVITE",
      nomeCompleto: payload.nomeCompleto.trim(),
      email: payload.email.trim().toLowerCase(),
      cpf: maskedCpf,
      status: "CONVITE_ENVIADO",
    };
    salvarAdminsMock([...lista, novo]);
    return novo;
  }
  const { data } = await axios.post<AdministradorItem>("/v1/admin/administradores/convites", payload);
  return data;
}

export async function desativarAdministrador(id: number): Promise<void> {
  if (USE_MOCK) {
    const lista = lerAdminsMock().map(a => (a.id === id ? { ...a, status: "DESATIVADO" as const } : a));
    salvarAdminsMock(lista);
    return;
  }
  await axios.put(`/v1/admin/administradores/${id}/desativar`);
}

export async function validarConviteAdmin(token: string): Promise<ConviteAdminValidacaoResponse> {
  if (USE_MOCK) {
    return {
      nomeCompleto: "Novo Administrador BW",
      email: "admin.convite@bwarquitetura.com.br",
      nomeEmpresa: "BW Arquitetura & Marcenaria",
      expiraEm: new Date(Date.now() + 86400000).toISOString(),
    };
  }
  const { data } = await axios.get<ConviteAdminValidacaoResponse>("/v1/api/convite-admin/validar", {
    params: { token },
  });
  return data;
}

export async function aceitarConviteAdmin(payload: ConviteAdminAceitarPayload): Promise<void> {
  if (USE_MOCK) return;
  await axios.post("/v1/api/convite-admin/aceitar", payload);
}

export async function recusarConviteAdmin(payload: ConviteAdminRecusarPayload): Promise<void> {
  if (USE_MOCK) return;
  await axios.post("/v1/api/convite-admin/recusar", payload);
}
