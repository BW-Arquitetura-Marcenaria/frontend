import React, { useCallback, useEffect, useRef, useState } from "react";
import { decodeJwt } from "@/api/auth";
import {
  convidarAdministrador,
  desativarAdministrador,
  getAdministradores,
  type AdministradorItem,
  type AdministradorStatus,
} from "@/api/administradores";

function getCurrentAdminIdentity(): { id: number | null; email: string | null } {
  try {
    const rawId = localStorage.getItem("authUsuarioId") || sessionStorage.getItem("authUsuarioId");
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const payload = token ? decodeJwt(token) : null;
    const parsedId = Number(rawId || payload?.sub);
    return {
      id: Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null,
      email: payload?.email ? payload.email.toLowerCase() : null,
    };
  } catch {
    return { id: null, email: null };
  }
}

function extrairMensagemErro(error: unknown, fallback: string): string {
  const response = (error as { response?: { status?: number; data?: { message?: string; detalhes?: string[] } } })?.response;
  if (response?.status === 401 || response?.status === 403) {
    return "Acesso administrativo necessário. Entre com uma conta de administrador.";
  }
  if (response?.data?.detalhes && response.data.detalhes.length > 0) {
    return response.data.detalhes.join(" · ");
  }
  return response?.data?.message || fallback;
}

const statusLabel: Record<AdministradorStatus, string> = {
  ATIVO: "Ativo",
  CONVITE_ENVIADO: "Convite enviado",
  DESATIVADO: "Desativado",
};

export default function UsuariosAdminView() {
  const requestVersion = useRef(0);
  const [users, setUsers] = useState<AdministradorItem[]>([]);
  const [acessosAtivos, setAcessosAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<AdministradorItem | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", cpf: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const cpfDigits = form.cpf.replace(/\D/g, "");

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
      .replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3")
      .replace(/^(\d{3})(\d{3})$/, "$1.$2")
      .replace(/^(\d{3})$/, "$1");
  };

  const maskCpf = (value: string) => {
    const digits = (value ?? "").replace(/\D/g, "");
    return digits.length === 11 ? `***.${digits.slice(3, 6)}.***-**` : value;
  };

  const getInitials = (nomeCompleto: string) =>
    nomeCompleto
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? "")
      .join("");

  const carregarAdministradores = useCallback(async (silent = false) => {
    const version = ++requestVersion.current;
    if (!silent) {
      setLoading(true);
    }
    setLoadError("");
    try {
      const data = await getAdministradores();
      if (version !== requestVersion.current) return;
      setUsers(data.administradores);
      setAcessosAtivos(data.acessosAtivos);
    } catch (err) {
      if (version === requestVersion.current && !silent) {
        setLoadError(extrairMensagemErro(err, "Não foi possível carregar os administradores. Verifique a conexão e tente novamente."));
      }
    } finally {
      if (version === requestVersion.current && !silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void carregarAdministradores();
    return () => {
      requestVersion.current++;
    };
  }, [carregarAdministradores]);

  const addUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inviting) return;
    setMessage(null);
    setActionError("");

    const nomeCompleto = form.nome.trim().replace(/\s+/g, " ");
    const email = form.email.trim().toLowerCase();

    if (!nomeCompleto || !email || cpfDigits.length !== 11) {
      setMessage({
        type: "error",
        text: "Preencha nome completo, e-mail e um CPF válido com 11 dígitos.",
      });
      return;
    }

    if (!nomeCompleto.includes(" ")) {
      setMessage({
        type: "error",
        text: "Informe nome e sobrenome.",
      });
      return;
    }

    setInviting(true);
    try {
      const novoItem = await convidarAdministrador({
        nomeCompleto,
        email,
        cpf: cpfDigits,
      });
      setUsers(current => [...current, novoItem]);
      setForm({ nome: "", email: "", cpf: "" });
      setMessage({
        type: "success",
        text: "Convite enviado. A pessoa receberá um e-mail para confirmar ou recusar o acesso.",
      });
      void carregarAdministradores(true);
    } catch (err) {
      setMessage({
        type: "error",
        text: extrairMensagemErro(err, "Não foi possível enviar o convite. Tente novamente."),
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async (user: AdministradorItem) => {
    if (user.tipo !== "USUARIO" || user.status !== "ATIVO" || deactivatingId !== null) return;
    setActionError("");
    setDeactivatingId(user.id);
    try {
      await desativarAdministrador(user.id);
      setUserToDeactivate(null);
      await carregarAdministradores(true);
    } catch (err) {
      setActionError(extrairMensagemErro(err, "Não foi possível desativar o administrador."));
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-5 border-b border-bw-border pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Acesso interno</div>
          <h1 className="font-display text-4xl leading-none tracking-[-.04em] text-bw-preto">Administradores</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bw-muted">
            Gerencie quem pode acessar a operação BW. Cada acesso administrativo é pessoal e identificado por CPF.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-bw-dourado/25 bg-bw-dourado/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[.12em] text-bw-madeira">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          {acessosAtivos} acessos ativos
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden border border-bw-border bg-bw-white bw-panel">
          <div className="flex items-center justify-between gap-4 border-b border-bw-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-2xl text-bw-preto">Equipe com acesso</h2>
              <p className="mt-1 text-xs text-bw-muted">
                Acesso é liberado individualmente por convite no e-mail e pode ser desativado a qualquer momento.
              </p>
            </div>
          </div>

          {loadError && (
            <div role="alert" className="m-5 border border-red-300 bg-red-50 p-3 text-xs text-red-800 sm:mx-6">
              {loadError}
              <button type="button" onClick={() => void carregarAdministradores()} className="ml-3 underline">
                Tentar novamente
              </button>
            </div>
          )}

          {actionError && (
            <div role="alert" className="m-5 border border-red-300 bg-red-50 p-3 text-xs text-red-800 sm:mx-6">
              {actionError}
            </div>
          )}

          {loading ? (
            <div className="px-5 py-8 text-sm text-bw-muted sm:px-6" role="status">
              Carregando administradores...
            </div>
          ) : !loadError && users.length === 0 ? (
            <div className="px-5 py-8 text-sm text-bw-muted sm:px-6">
              Nenhum administrador encontrado.
            </div>
          ) : (
            <div className="divide-y divide-bw-border-sub">
              {users.map(user => {
                const currentAdmin = getCurrentAdminIdentity();
                const isCurrentUser =
                  user.tipo === "USUARIO" &&
                  ((currentAdmin.id !== null && user.id === currentAdmin.id) ||
                    (currentAdmin.email !== null && user.email.toLowerCase() === currentAdmin.email));
                const isAtivo = user.status === "ATIVO";
                const canDeactivate = user.tipo === "USUARIO" && isAtivo && !isCurrentUser;
                return (
                  <article
                    key={`${user.tipo}-${user.id}`}
                    className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-bw-dourado/30 bg-bw-areia font-mono text-[10px] font-medium text-bw-madeira">
                        {getInitials(user.nomeCompleto)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-bw-preto">{user.nomeCompleto}</span>
                          {isCurrentUser && (
                            <span className="shrink-0 border border-bw-dourado/40 bg-bw-dourado/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-bw-dourado">
                              (Você)
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-bw-muted">{user.email}</div>
                        <div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-bw-madeira">
                          CPF {maskCpf(user.cpf)}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[.1em] ${
                          isAtivo ? "text-bw-dourado" : "text-bw-muted"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isAtivo ? "bg-bw-dourado" : "bg-bw-muted"}`} />
                        {statusLabel[user.status] ?? user.status}
                      </span>
                      {canDeactivate && (
                        <button
                          type="button"
                          disabled={deactivatingId === user.id}
                          onClick={() => {
                            setActionError("");
                            setUserToDeactivate(user);
                          }}
                          className="border border-bw-border px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-bw-madeira transition-colors hover:border-bw-dourado hover:bg-bw-hover disabled:opacity-50"
                        >
                          {deactivatingId === user.id ? "Desativando..." : "Desativar"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="self-start border border-bw-dourado/25 bg-bw-preto p-5 text-bw-white shadow-xl">
          <div className="mb-6 border-b border-white/10 pb-5">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Novo acesso</div>
            <h2 className="font-display text-2xl">Adicionar administrador</h2>
            <p className="mt-2 text-xs leading-relaxed text-bw-areia/60">
              O cadastro administrativo aceita somente CPF. Um e-mail será enviado para a pessoa aceitar ou recusar o convite.
            </p>
          </div>
          <form onSubmit={addUser} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">Nome completo</span>
              <input
                value={form.nome}
                onChange={event => {
                  setForm(current => ({ ...current, nome: event.target.value }));
                  setMessage(null);
                }}
                placeholder="Nome e sobrenome"
                className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-bw-dourado"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">E-mail profissional</span>
              <input
                type="email"
                value={form.email}
                onChange={event => {
                  setForm(current => ({ ...current, email: event.target.value }));
                  setMessage(null);
                }}
                placeholder="nome@empresa.com"
                className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-bw-dourado"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">CPF</span>
              <input
                inputMode="numeric"
                value={form.cpf}
                onChange={event => {
                  setForm(current => ({ ...current, cpf: formatCpf(event.target.value) }));
                  setMessage(null);
                }}
                placeholder="000.000.000-00"
                className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-bw-dourado"
              />
              <span className="text-[9px] leading-relaxed text-bw-areia/45">
                CPF é obrigatório para vincular uma pessoa ao acesso interno.
              </span>
            </label>

            {message && (
              <div
                role="status"
                className={`flex items-start gap-2 border px-3 py-2.5 text-[10px] leading-relaxed ${
                  message.type === "success"
                    ? "border-bw-dourado/40 bg-bw-dourado/10 text-bw-areia"
                    : "border-red-400/30 bg-red-400/10 text-red-200"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {message.type === "success" ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={inviting}
              className="mt-1 bg-bw-dourado px-4 py-3 text-[10px] font-medium uppercase tracking-[.16em] text-white transition-colors hover:bg-[#c19d65] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviting ? "Enviando convite..." : "Enviar convite ↗"}
            </button>
          </form>
        </aside>
      </div>

      {userToDeactivate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-desativar-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md border border-bw-dourado/20 bg-bw-preto/95 p-6 text-bw-white shadow-2xl backdrop-blur-md sm:p-8">
            <button
              type="button"
              disabled={deactivatingId !== null}
              onClick={() => {
                setUserToDeactivate(null);
                setActionError("");
              }}
              className="absolute right-5 top-4 text-bw-areia transition-colors hover:text-white disabled:opacity-50"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-5">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">
                Confirmação de segurança
              </div>
              <h2 id="modal-desativar-titulo" className="font-display text-2xl text-bw-white">
                Desativar administrador
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-bw-areia/70">
                Tem certeza que deseja desativar o acesso administrativo abaixo? Essa pessoa perderá o acesso ao painel imediatamente.
              </p>
            </div>

            <div className="mb-6 border border-white/10 bg-white/5 p-3.5">
              <div className="text-sm font-medium text-white">{userToDeactivate.nomeCompleto}</div>
              <div className="mt-0.5 text-xs text-bw-areia/65">{userToDeactivate.email}</div>
              <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-bw-dourado">
                CPF {maskCpf(userToDeactivate.cpf)}
              </div>
            </div>

            {actionError && (
              <div
                role="alert"
                className="mb-5 border border-red-400/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300"
              >
                {actionError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={deactivatingId !== null}
                onClick={() => {
                  setUserToDeactivate(null);
                  setActionError("");
                }}
                className="flex-1 border border-white/15 py-2.5 font-mono text-[10px] uppercase tracking-[.16em] text-bw-areia transition-colors hover:border-white/35 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deactivatingId !== null}
                onClick={() => void handleDeactivate(userToDeactivate)}
                className="flex-1 bg-bw-dourado py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-bw-preto transition-colors hover:bg-bw-areia disabled:opacity-50"
              >
                {deactivatingId === userToDeactivate.id ? "Desativando..." : "Confirmar desativação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

