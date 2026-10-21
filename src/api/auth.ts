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
  const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

  if (USE_MOCK) {
    // Return a fake login result for local testing when VITE_USE_MOCK=true
    const now = Math.floor(Date.now() / 1000);
    const perfil: Perfil = email?.toLowerCase().includes("admin") ? "ADMIN" : "CLIENTE";
    const payload = { sub: "mock-user", email, perfil, iat: now, exp: now + 60 * 60 };
    const header = { alg: "none", typ: "JWT" };
    const encode = (o: any) => btoa(JSON.stringify(o)).replace(/=+$/g, "");
    const fakeToken = `${encode(header)}.${encode(payload)}.`; // unsigned

    const data: LoginResponse = {
      token: fakeToken,
      tipo: perfil === "ADMIN" ? "ADMIN" : "CLIENTE",
      expiraEmSegundos: 60 * 60,
      usuarioId: 1,
      nome: email.split("@")[0],
    };

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUsuarioId", String(data.usuarioId));
    localStorage.setItem("authNome", data.nome);

    // ensure a bw-account exists so features that read CEP (mapa) work in mock mode
    try {
      const existing = localStorage.getItem("bw-account");
      if (!existing) {
        const mockAccount = {
          empresa: "BW (Mock)",
          responsavel: data.nome,
          email,
          telefone: "(11) 99999-9999",
          documento: "12.345.678/0001-95",
          cep: "01315010",
          endereco: "Rua (mock via CEP 01315-010)",
          numero: "1000",
          complemento: "",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          estado: "SP",
        };
        localStorage.setItem("bw-account", JSON.stringify(mockAccount));
      }
    } catch (e) {
      // ignore storage errors in mock
    }

    return { ...data, perfil, payload };
  }

  const resp = await axios.post<LoginResponse>("/v1/api/auth/login", { email, senha });
  const data = resp.data;

  localStorage.setItem("authToken", data.token);
  localStorage.setItem("authUsuarioId", String(data.usuarioId));
  localStorage.setItem("authNome", data.nome);

  const payload = decodeJwt(data.token);
  return { ...data, perfil: payload?.perfil ?? null, payload };
}

export function logout(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUsuarioId");
  localStorage.removeItem("authNome");
}

export function getPerfilAtual(): Perfil | null {
  const token = localStorage.getItem("authToken");
  return token ? (decodeJwt(token)?.perfil ?? null) : null;
}
