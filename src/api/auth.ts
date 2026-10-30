import axios from "@/api/axios";

export type Perfil = "ADMIN" | "CLIENTE";

export interface LoginResponse {
  token: string;
  tipo: string; 
  expiraEmSegundos: number;
  usuarioId: number;
  nome: string;
}

export interface TokenPayload {
  sub: string; 
  email: string;
  perfil: Perfil; 
  iat: number;
  exp: number;
}

export function decodeJwt(token: string): TokenPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

export interface LoginResult extends LoginResponse {
  perfil: Perfil | null;
  payload: TokenPayload | null;
}

export async function login(email: string, senha: string): Promise<LoginResult> {
  const resp = await axios.post<LoginResponse>("/v1/api/auth/login", { email, senha });
  const data = resp.data;

  const payload = decodeJwt(data.token);
  if (!payload || (payload.perfil !== "ADMIN" && payload.perfil !== "CLIENTE") || payload.exp * 1000 <= Date.now()) {
    throw new Error("A sessão recebida é inválida. Tente entrar novamente.");
  }
  localStorage.setItem("authToken", data.token);
  localStorage.setItem("authUsuarioId", String(data.usuarioId));
  localStorage.setItem("authNome", data.nome);
  return { ...data, perfil: payload.perfil, payload };
}

export function logout(): void {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem("authToken");
    storage.removeItem("authUsuarioId");
    storage.removeItem("authNome");
  }
  sessionStorage.removeItem("authClienteTipo");
}

export function getPerfilAtual(): Perfil | null {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || payload.exp * 1000 <= Date.now() || (payload.perfil !== "ADMIN" && payload.perfil !== "CLIENTE")) {
    logout();
    return null;
  }
  return payload.perfil;
}
