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

export async function getAdministradores(): Promise<AdministradoresResponse> {
  const { data } = await axios.get<AdministradoresResponse>("/v1/admin/administradores");
  return data;
}

export async function convidarAdministrador(payload: ConviteAdminPayload): Promise<AdministradorItem> {
  const { data } = await axios.post<AdministradorItem>("/v1/admin/administradores/convites", payload);
  return data;
}

export async function desativarAdministrador(id: number): Promise<void> {
  await axios.put(`/v1/admin/administradores/${id}/desativar`);
}

export async function validarConviteAdmin(token: string): Promise<ConviteAdminValidacaoResponse> {
  const { data } = await axios.get<ConviteAdminValidacaoResponse>("/v1/api/convite-admin/validar", {
    params: { token },
  });
  return data;
}

export async function aceitarConviteAdmin(payload: ConviteAdminAceitarPayload): Promise<void> {
  await axios.post("/v1/api/convite-admin/aceitar", payload);
}

export async function recusarConviteAdmin(payload: ConviteAdminRecusarPayload): Promise<void> {
  await axios.post("/v1/api/convite-admin/recusar", payload);
}

