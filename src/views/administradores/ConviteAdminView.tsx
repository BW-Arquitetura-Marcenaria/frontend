import React, { useEffect, useState } from "react";
import bwLogo from "@/assets/brand/logo-bw-arquitetura-marcenaria.png";
import bwLoginBg from "@/assets/backgrounds/login-estante-plantas.png";
import { login as apiLogin } from "@/api/auth";
import {
  aceitarConviteAdmin,
  recusarConviteAdmin,
  validarConviteAdmin,
  type ConviteAdminValidacaoResponse,
} from "@/api/administradores";

type Props = {
  onGoLogin: () => void;
  onGoHome: () => void;
  onAdminAuthenticated: () => void;
};

function parseTokenInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("token=")) {
    try {
      const idx = trimmed.indexOf("?");
      const search = idx >= 0 ? trimmed.slice(idx) : trimmed;
      const params = new URLSearchParams(search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        return tokenParam.trim();
      }
    } catch {
      // fallback to raw
    }
  }
  return trimmed;
}

function extrairErro(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string; detalhes?: string[] } } })?.response;
  if (response?.data?.detalhes && response.data.detalhes.length > 0) {
    return response.data.detalhes.join(" · ");
  }
  return response?.data?.message || fallback;
}

function formatarExpiracao(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function PasswordField({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex w-full items-center">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-10`} />
      <button
        type="button"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(v => !v)}
        className="password-toggle absolute right-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-8 w-8 items-center justify-center rounded p-1.5 text-white transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {visible ? (
          <svg width="18" height="18" className="w-[18px] h-[18px] shrink-0 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
          </svg>
        ) : (
          <svg width="18" height="18" className="w-[18px] h-[18px] shrink-0 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ConviteAdminView({ onGoLogin, onGoHome, onAdminAuthenticated }: Props) {
  const initialParams = new URLSearchParams(window.location.search);
  const urlToken = (initialParams.get("token") ?? "").trim();
  const isRecusaFromEmail = initialParams.get("acao") === "recusar" && Boolean(urlToken);

  const [token, setToken] = useState(urlToken);
  const [dadosConvite, setDadosConvite] = useState<ConviteAdminValidacaoResponse | null>(null);
  const [validando, setValidando] = useState(Boolean(urlToken));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [resultado, setResultado] = useState<"aceito" | "recusado" | null>(null);

  useEffect(() => {
    if (!urlToken) return;
    let ativo = true;
    setValidando(true);
    setErro("");

    if (isRecusaFromEmail) {
      recusarConviteAdmin({ token: urlToken })
        .then(() => {
          if (ativo) {
            window.history.replaceState(null, "", "/");
            setResultado("recusado");
          }
        })
        .catch(err => {
          if (ativo) {
            setErro(extrairErro(err, "Este convite é inválido, já foi respondido ou expirou."));
          }
        })
        .finally(() => {
          if (ativo) setValidando(false);
        });
    } else {
      validarConviteAdmin(urlToken)
        .then(dados => {
          if (ativo) setDadosConvite(dados);
        })
        .catch(err => {
          if (ativo) {
            setErro(extrairErro(err, "Este convite é inválido, já foi respondido ou expirou."));
          }
        })
        .finally(() => {
          if (ativo) setValidando(false);
        });
    }

    return () => {
      ativo = false;
    };
  }, [urlToken, isRecusaFromEmail]);

  const [tokenValidado, setTokenValidado] = useState(urlToken);

  const handleChangeToken = (value: string) => {
    const parsed = parseTokenInput(value);
    setToken(parsed);
    setErro("");
    if (dadosConvite && parsed !== tokenValidado) {
      setDadosConvite(null);
    }
  };

  const handleBlurToken = async () => {
    const t = token.trim();
    if (!t || (dadosConvite && t === tokenValidado)) return;
    setValidando(true);
    setErro("");
    try {
      const dados = await validarConviteAdmin(t);
      setDadosConvite(dados);
      setTokenValidado(t);
    } catch (err) {
      setDadosConvite(null);
      setErro(extrairErro(err, "Este convite é inválido, já foi respondido ou expirou."));
    } finally {
      setValidando(false);
    }
  };

  const handleAceitar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (enviando) return;
    const t = token.trim();
    if (!t) {
      setErro("Informe o token recebido no e-mail.");
      return;
    }
    if (senha.length < 8 || senha.length > 72) {
      setErro("A senha deve ter entre 8 e 72 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    setErro("");
    try {
      let info = dadosConvite;
      if (!info) {
        try {
          info = await validarConviteAdmin(t);
          setDadosConvite(info);
        } catch {
          // Segue para o POST /aceitar retornar a mensagem de validação do backend
        }
      }

      await aceitarConviteAdmin({
        token: t,
        senha,
        confirmarSenha,
      });

      window.history.replaceState(null, "", "/");

      if (info?.email) {
        try {
          const { perfil } = await apiLogin(info.email, senha);
          if (perfil === "ADMIN") {
            onAdminAuthenticated();
            return;
          }
        } catch {
          // Caso o login automático não ocorra, exibe confirmação para entrar manualmente
        }
      }

      setResultado("aceito");
    } catch (err) {
      setErro(extrairErro(err, "Não foi possível confirmar o convite. Verifique o token e tente novamente."));
    } finally {
      setEnviando(false);
    }
  };

  const glassInput =
    "w-full bg-transparent border-0 border-b border-white/20 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-bw-dourado transition-colors";
  const glassLabel = "block text-[10px] font-mono uppercase tracking-[.18em] text-white/40 mb-1";

  return (
    <div className="relative min-h-full flex overflow-hidden bg-bw-preto">
      <img
        src={bwLoginBg}
        alt="Projeto de marcenaria BW"
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        style={{ filter: "blur(2px)" }}
      />
      <div className="absolute inset-0 bg-bw-preto/60" />

      {/* Left panel */}
      <div className="relative z-10 hidden lg:flex flex-col justify-center px-16 xl:px-24 w-1/2">
        <button
          onClick={onGoHome}
          className="mb-16 text-[10px] font-mono uppercase tracking-[.18em] text-white/40 hover:text-bw-dourado transition-colors flex items-center gap-2"
        >
          <span>←</span> Voltar ao site
        </button>
        <div className="mb-6 font-mono text-[10px] uppercase tracking-[.22em] text-bw-dourado flex items-center gap-3">
          <span className="h-px w-6 bg-bw-dourado" /> Equipe administrativa
        </div>
        <h1 className="font-display text-[clamp(3rem,5vw,5.5rem)] font-medium leading-[.85] tracking-[-.04em] text-white mb-8">
          Convite de<br />
          <em className="font-normal text-white/50">administrador.</em>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-white/55">
          Informe o token recebido por e-mail e defina sua senha pessoal para acessar o painel administrativo da BW.
        </p>
      </div>

      {/* Right panel */}
      <div className="relative z-10 flex items-start lg:items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto">
        <div
          className="w-full max-w-[440px]"
          style={{
            background: "rgba(22,19,15,0.55)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "2px",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            padding: "40px 40px 36px",
          }}
        >
          <div className="mb-8">
            <img
              src={bwLogo}
              alt="BW Arquitetura e Marcenaria"
              style={{ height: "60px", width: "auto", mixBlendMode: "screen" }}
            />
            <div className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-[.18em]">
              Acesso administrativo
            </div>
          </div>

          {resultado === "aceito" ? (
            <div className="flex flex-col gap-5">
              <div className="border border-bw-dourado/40 bg-bw-dourado/10 p-4 text-sm text-bw-areia">
                <div className="font-mono text-[10px] uppercase tracking-[.16em] text-bw-dourado mb-1">
                  Convite confirmado
                </div>
                Seu acesso de administrador foi ativado com sucesso. Entre com seu e-mail e a senha que você definiu.
              </div>
              <button
                type="button"
                onClick={onGoLogin}
                className="w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3"
              >
                Ir para o login <span className="text-base leading-none">›</span>
              </button>
            </div>
          ) : resultado === "recusado" ? (
            <div className="flex flex-col gap-5">
              <div className="border border-white/15 bg-white/5 p-4 text-sm text-white/80">
                <div className="font-mono text-[10px] uppercase tracking-[.16em] text-white/50 mb-1">
                  Convite recusado
                </div>
                O convite de administrador foi recusado e nenhuma conta foi criada.
              </div>
              <button
                type="button"
                onClick={onGoHome}
                className="w-full py-3 border border-white/20 text-white/70 text-[11px] font-mono uppercase tracking-[.18em] hover:border-bw-dourado hover:text-bw-dourado transition-colors"
              >
                Voltar ao site
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="font-display text-3xl text-white leading-tight">Confirmar acesso</h2>
                <p className="text-[11px] font-mono text-white/35 mt-1">
                  Informe o token recebido no e-mail e defina sua senha
                </p>
              </div>

              {validando && (
                <p role="status" className="mb-5 text-xs font-mono text-bw-areia">
                  Validando convite...
                </p>
              )}

              {erro && (
                <p
                  role="alert"
                  className="mb-5 border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200"
                >
                  {erro}
                </p>
              )}

              {dadosConvite && (
                <div className="mb-6 border border-bw-dourado/30 bg-bw-dourado/10 p-3.5 text-xs text-bw-areia">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-bw-dourado mb-2">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Convite validado · {dadosConvite.nomeEmpresa}
                  </div>
                  <div className="font-medium text-white">{dadosConvite.nomeCompleto}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">{dadosConvite.email}</div>
                  {dadosConvite.expiraEm && (
                    <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-white/40">
                      Válido até {formatarExpiracao(dadosConvite.expiraEm)}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleAceitar} className="flex flex-col gap-5">
                <div>
                  <label className={glassLabel}>Token do convite</label>
                  <input
                    type="text"
                    value={token}
                    readOnly={Boolean(urlToken && dadosConvite)}
                    onChange={e => handleChangeToken(e.target.value)}
                    onBlur={() => void handleBlurToken()}
                    placeholder="Informe o token recebido no e-mail"
                    className={`${glassInput} font-mono text-xs read-only:cursor-default read-only:opacity-70`}
                    required
                  />
                </div>

                <div>
                  <label className={glassLabel}>Senha</label>
                  <PasswordField
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={e => {
                      setSenha(e.target.value);
                      setErro("");
                    }}
                    autoComplete="new-password"
                    className={glassInput}
                    required
                  />
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                    {[
                      ["8 a 72 caracteres", senha.length >= 8 && senha.length <= 72],
                      ["Senhas conferem", senha.length >= 8 && senha === confirmarSenha],
                    ].map(([label, ok]) => (
                      <div key={label as string} className="flex items-center gap-1.5 text-[9px] font-mono text-white/30">
                        <span className={ok ? "text-bw-dourado" : ""}>{ok ? "✓" : "–"}</span>
                        {label as string}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={glassLabel}>Confirmar senha</label>
                  <PasswordField
                    placeholder="Repita a senha"
                    value={confirmarSenha}
                    onChange={e => {
                      setConfirmarSenha(e.target.value);
                      setErro("");
                    }}
                    autoComplete="new-password"
                    className={glassInput}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-2 w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {enviando ? "Confirmando acesso..." : "Confirmar e criar acesso"}
                  <span className="text-base leading-none">›</span>
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between">
            <p className="text-[10px] font-mono text-white/25">
              Já possui acesso?{" "}
              <button onClick={onGoLogin} className="text-white/50 hover:text-bw-dourado transition-colors underline">
                Entrar
              </button>
            </p>
            <button
              onClick={onGoHome}
              className="text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors lg:hidden"
            >
              ← Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
