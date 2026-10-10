import React, { useState, useRef, useEffect, type DragEvent } from "react";
import bwLogo from "@/assets/brand/logo-bw-arquitetura-marcenaria.png";
import sobrePhoto from "@/assets/team/fundadores-bianca-walmir.jpeg";
import bwProject1 from "@/assets/portfolio/casa-aroeira-estante-residencial.png";
import bwProject2 from "@/assets/portfolio/apartamento-jardins-estante-adega.png";
import bwProject3 from "@/assets/portfolio/estudio-oliva-estante-comercial.png";
import bwLoginBg from "@/assets/backgrounds/login-estante-plantas.png";

// ─── types ────────────────────────────────────────────────────────────────────
type Screen =
  | "institucional"
  | "login"
  | "cadastro"
  | "portal-cliente"
  | "funil"
  | "financeiro"
  | "calendario"
  | "chatbot"
  | "simulacao"
  | "tabela-precos"
  | "rastreabilidade"
  | "descarte"
  | "usuarios-admin"
  | "configuracoes";

type ClienteTipo = "pf" | "pj";

// ─── wireframe tokens ─────────────────────────────────────────────────────────
// bg:     #fff  surface: #f5f5f5  border: #d4d4d4  muted: #a3a3a3
// text:   #111  secondary: #555   placeholder: #bbb
// accent: #111 (black fills for CTAs)

const W = {
  surface: "bg-bw-areia",
  border: "border border-bw-border",
  input: "w-full px-3 py-2.5 text-sm border border-bw-border rounded-md bg-bw-white focus:outline-none focus:border-bw-dourado focus:ring-1 focus:ring-bw-dourado placeholder-bw-ph",
  label: "block text-xs font-medium text-bw-preto mb-1.5 font-mono uppercase tracking-wider",
  btnPrimary: "w-full py-2.5 bg-bw-dourado text-white text-sm font-medium rounded-md hover:bg-bw-madeira transition-colors",
  btnSecondary: "w-full py-2.5 border border-bw-border text-bw-preto text-sm font-medium rounded-md hover:bg-bw-hover transition-colors",
  btnOutline: "px-4 py-2 border border-bw-border text-bw-preto text-sm rounded-md hover:bg-bw-hover transition-colors",
  link: "text-bw-preto underline underline-offset-2 text-sm hover:text-bw-madeira transition-colors",
  muted: "text-bw-muted",
  secondary: "text-bw-madeira",
  tag: "inline-flex items-center px-2 py-0.5 rounded border border-bw-border text-xs font-mono text-bw-madeira bg-bw-areia",
};

// ─── wireframe icons (minimal strokes) ───────────────────────────────────────
const Icon = {
  Home: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" /></svg>,
  Users: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  Dollar: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  Cal: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Bot: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M8 8V5a4 4 0 018 0v3M12 2v2M8 16h.01M16 16h.01" /></svg>,
  Layers: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  Tag: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  Map: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Phone: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.24 12 19.79 19.79 0 011.17 3.4 2 2 0 013.14 1.25h3a2 2 0 012 1.72c.127.96.36 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.68a16 16 0 006.29 6.29l.8-.8a2 2 0 012.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  Trend: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  Chevron: () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>,
  Send: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  Menu: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  X: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Check: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>,
  Mail: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" /></svg>,
  Building: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="3" width="20" height="18" rx="1" /><path d="M8 21V12h8v9M9 7h2M13 7h2M9 11h2M13 11h2" /></svg>,
  Eye: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  EyeOff: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>,
  AlertCircle: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Settings: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1.1V21a2 2 0 01-4 0v-.09A1.7 1.7 0 008.6 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.6-1 1.7 1.7 0 00-1.1-.4H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 8.6a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.6 1.7 1.7 0 00.4-1.1V3a2 2 0 014 0v.09A1.7 1.7 0 0015.4 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.12.38.33.72.6 1 .3.28.68.42 1.1.4h.09a2 2 0 010 4h-.09a1.7 1.7 0 00-1.7.6z" /></svg>,
};

// ─── Shared primitives ────────────────────────────────────────────────────────
function WireTag({ children, status }: { children: React.ReactNode; status?: "ok" | "warn" | "error" | "info" }) {
  const st = {
    ok: "border-bw-dourado bg-bw-dourado text-white",
    warn: "border-bw-madeira bg-bw-madeira text-white",
    error: "border-[#888] bg-bw-areia text-bw-preto line-through",
    info: "border-bw-border bg-bw-white text-bw-madeira",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${st[status ?? "info"]}`}>{children}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-bw-border rounded-lg p-4 bg-bw-white">
      <div className="text-[10px] font-mono uppercase tracking-widest text-bw-muted mb-1">{label}</div>
      <div className="text-2xl font-bold text-bw-preto tracking-tight">{value}</div>
      {sub && <div className="text-xs text-bw-muted mt-1 font-mono">{sub}</div>}
    </div>
  );
}

// ─── SCREEN: Site Institucional ───────────────────────────────────────────────
const depoimentos = [
  { nome: "Erick Sampaio", sub: "Projeto de cozinha planejada", texto: "Recebi o contrato e fiquei impressionado com o nível de detalhamento. Todo o atendimento foi incrível  nos sentimos muito acolhidos desde o primeiro contato. Escolhemos a BW por grande culpa do atendimento da equipe. Continue assim!" },
  { nome: "Verônica Lima", sub: "Dormitório e closet sob medida", texto: "Buscando uma empresa séria e com facilidade no pagamento, achei a BW no Instagram. Logo entrei em contato, marquei minha visita, fiquei muito satisfeita com o projeto — material de ótima qualidade e atendimento muito atencioso." },
  { nome: "Rafael Mendes", sub: "Escritório planejado", texto: "Projeto entregue no prazo e dentro do orçamento combinado. A equipe da BW acompanhou cada detalhe da instalação. O resultado ficou muito acima do esperado. Recomendo sem hesitar para quem busca qualidade de verdade." },
  { nome: "Juliana Costa", sub: "Sala de estar e home office", texto: "Tudo que foi prometido foi cumprido. Fiquei surpresa com a atenção ao detalhe na marcenaria. A Bianca e o Walmir são muito presentes durante todo o processo — isso faz toda a diferença na hora de confiar o seu projeto." },
];

function StarRow() {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#B08D57"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
      ))}
    </div>
  );
}

function SiteInstitucional({ onNav }: { onNav: (s: Screen) => void }) {
  const [dep, setDep] = useState(0);
  return (
    <div className="min-h-full bg-bw-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-bw-preto border-b border-bw-sidebar-b w-full">
        <div className="w-full px-8 flex items-center justify-between h-[72px]">
          <div className="font-semibold text-bw-white tracking-tight text-2xl font-display">BW Arquitetura</div>
          <div className="hidden md:flex items-center gap-10 text-base font-medium text-bw-areia">
            {["Início","Sobre","Serviços","Portfólio","Contato"].map(l => <a key={l} href="#" className="hover:text-bw-white transition-colors">{l}</a>)}
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNav("login")} className="px-5 py-2.5 border border-bw-border text-bw-areia text-sm font-medium rounded-md hover:bg-bw-white/10 transition-colors">Entrar</button>
            <button onClick={() => onNav("cadastro")} className="px-5 py-2.5 bg-bw-dourado text-white text-sm font-medium rounded-md hover:bg-bw-madeira transition-colors">Cadastrar</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="w-full border-b border-bw-border">
        <div className="w-full px-8 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-bw-muted mb-5">Arquitetura & Marcenaria</div>
            <h1 className="text-5xl md:text-6xl font-semibold text-bw-preto leading-tight tracking-tight mb-6 font-display">
              Ambientes que contam<br />a sua história
            </h1>
            <p className="text-bw-madeira leading-relaxed mb-8 max-w-lg text-base font-medium">
              Transformamos madeira e espaço em experiências únicas. Projetos personalizados de marcenaria e arquitetura de interiores.
            </p>
            <div className="flex gap-3">
              <button className="px-7 py-3 bg-bw-dourado text-white text-sm font-medium rounded-md hover:bg-bw-madeira transition-colors">Solicitar orçamento</button>
              <button className="px-7 py-3 border border-bw-border text-bw-preto text-sm font-medium rounded-md hover:bg-bw-hover transition-colors">Ver portfólio</button>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-4 max-w-md">
            <div className="border border-bw-border rounded-xl p-6 bg-bw-white shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-bw-areia border border-bw-border flex items-center justify-center text-sm font-semibold text-bw-madeira flex-shrink-0">
                  {depoimentos[dep].nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="text-base font-semibold text-bw-preto">{depoimentos[dep].nome}</div>
                  <div className="text-xs text-bw-muted">{depoimentos[dep].sub}</div>
                  <StarRow />
                </div>
              </div>
              <p className="text-sm text-bw-madeira leading-relaxed font-medium">"{depoimentos[dep].texto}"</p>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex gap-2">
                {depoimentos.map((_, i) => (
                  <button key={i} onClick={() => setDep(i)} className={`h-1.5 rounded-full transition-all ${dep === i ? "bg-bw-dourado w-8" : "bg-bw-border w-5 hover:bg-bw-muted"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDep(d => (d - 1 + depoimentos.length) % depoimentos.length)} className="w-8 h-8 rounded-full border border-bw-border flex items-center justify-center text-bw-muted hover:border-bw-dourado hover:text-bw-dourado transition-colors">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button onClick={() => setDep(d => (d + 1) % depoimentos.length)} className="w-8 h-8 rounded-full border border-bw-border flex items-center justify-center text-bw-muted hover:border-bw-dourado hover:text-bw-dourado transition-colors">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="w-full border-b border-bw-border">
        <div className="w-full px-8 py-20 grid md:grid-cols-2 gap-16 items-start">
          <div className="border border-bw-border rounded-lg aspect-[4/3] bg-bw-areia flex items-center justify-center">
            <div className="text-sm font-mono text-bw-ph">[ Foto do casal / equipe ]</div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-bw-muted mb-3">Sobre nós</div>
            <h2 className="text-3xl font-semibold text-bw-preto mb-5 tracking-tight font-display">Uma parceria que vai além do projeto</h2>
            <p className="text-bw-madeira text-base leading-relaxed mb-4 font-medium">Somos Bianca e Walmir, arquitetos e marceneiros apaixonados por criar ambientes que refletem a personalidade de cada cliente. Mais de 12 anos de mercado combinando técnica artesanal com design contemporâneo.</p>
            <p className="text-bw-madeira text-base leading-relaxed mb-6 font-medium">Cada projeto é único: acompanhamos da concepção à montagem, garantindo que cada detalhe esteja perfeito.</p>
            <div className="flex gap-10 pt-5 border-t border-bw-border">
              {[["100%","Madeira certificada"],["Sob medida","Todo projeto"],["12 anos","De mercado"]].map(([v,l]) => (
                <div key={l}><div className="text-lg font-bold text-bw-preto font-display">{v}</div><div className="text-xs text-bw-muted mt-0.5">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="w-full border-b border-bw-border bg-bw-areia">
        <div className="w-full px-8 py-20">
          <div className="mb-10">
            <div className="text-xs font-mono uppercase tracking-widest text-bw-muted mb-2">O que fazemos</div>
            <h2 className="text-3xl font-semibold text-bw-preto font-display">Serviços</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[["Marcenaria Planejada","Cozinhas, dormitórios, escritórios e closets sob medida com madeira de alta qualidade."],["Arquitetura de Interiores","Projetos completos de ambientes residenciais e comerciais com assinatura exclusiva."],["Consultoria de Espaço","Análise e otimização de ambientes com simulação 3D e referências de estilo."]].map(([t,d]) => (
              <div key={t} className="border border-bw-border rounded-xl p-7 bg-bw-white">
                <h3 className="font-semibold text-bw-preto mb-3 text-base">{t}</h3>
                <p className="text-bw-madeira text-sm leading-relaxed font-medium">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFÓLIO */}
      <section className="w-full border-b border-bw-border">
        <div className="w-full px-8 py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-bw-muted mb-2">Nosso trabalho</div>
              <h2 className="text-3xl font-semibold text-bw-preto font-display">Portfólio</h2>
            </div>
            <a href="#" className="text-sm font-mono text-bw-madeira flex items-center gap-1 hover:text-bw-preto">Ver todos <Icon.Chevron /></a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {["Cozinha Residencial","Dormitório Casal","Sala de Estar","Escritório","Closet Planejado","Lavabo"].map(l => (
              <div key={l} className="border border-bw-border rounded-xl aspect-square bg-bw-areia flex items-center justify-center group cursor-pointer hover:bg-bw-hover transition-colors">
                <div className="text-xs font-mono text-bw-ph group-hover:text-bw-muted transition-colors">[ {l} ]</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-bw-preto">
        <div className="w-full px-8 py-20 text-center">
          <h2 className="text-3xl font-semibold text-bw-white mb-3 font-display">Pronto para transformar seu espaço?</h2>
          <p className="text-bw-areia text-base mb-8 font-medium">Agende uma visita. Primeiro orçamento sem compromisso.</p>
          <button className="px-10 py-3.5 bg-bw-dourado text-white rounded-md text-sm font-medium hover:bg-bw-madeira transition-colors">Falar com a equipe</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-bw-preto w-full" style={{ borderTop: "1px solid #2C2218" }}>
        <div className="w-full px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-bw-ph">
          <div className="font-semibold text-bw-areia text-base font-display">BW Arquitetura e Marcenaria</div>
          <div>© 2024 BW Arquitetura e Marcenaria. Todos os direitos reservados.</div>
          <div className="flex gap-6">
            {["Instagram","Houzz","WhatsApp"].map(l => <a key={l} href="#" className="hover:text-bw-areia transition-colors">{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── SCREEN: Institutional refresh ────────────────────────────────────────────
function SiteInstitucionalPremium({ onNav }: { onNav: (s: Screen) => void }) {
  const [dep, setDep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const projects = [
    { title: "Casa Aroeira", type: "Estante residencial", image: bwProject1 },
    { title: "Apartamento Jardins", type: "Estante com adega", image: bwProject2 },
    { title: "Estúdio Oliva", type: "Estante comercial", image: bwProject3 },
  ];
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return <div className="min-h-full bg-bw-white selection:bg-bw-dourado selection:text-bw-white">
    <section id="inicio" className="relative min-h-[100svh] overflow-hidden bg-bw-preto text-bw-white">
      <img src={bwProject3} alt="Projeto de marcenaria BW — estante comercial" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-bw-preto via-bw-preto/70 to-bw-preto/15" />
      {/* NAV integrada ao hero */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-bw-preto/75 to-transparent">
        <div className="mx-auto flex h-[74px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button onClick={() => scrollTo("inicio")} className="text-left leading-none group flex flex-col items-start"><img src={bwLogo} alt="BW" className="object-contain" style={{height:"44px",width:"auto",mixBlendMode:"screen"}} /><span className="mt-[3px] block font-mono text-[8px] uppercase tracking-[.22em] text-bw-areia/60 group-hover:text-bw-dourado transition-colors">Arquitetura & Marcenaria</span></button>
          <div className="hidden lg:flex items-center gap-9 text-[12px] font-medium uppercase tracking-wider text-bw-areia">{[["SOBRE", "sobre"], ["MÉTODO", "metodo"], ["PROJETOS", "projetos"], ["CONTATO", "contato"]].map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="hover:text-bw-dourado transition-colors">{label}</button>)}</div>
          <div className="flex items-center gap-2 sm:gap-4"><button onClick={() => onNav("login")} className="hidden sm:block px-4 py-2.5 text-sm font-medium text-bw-areia hover:text-bw-white transition-colors">Área do cliente</button><button onClick={() => scrollTo("contato")} className="hidden bg-bw-dourado px-5 py-3 text-[12px] font-medium uppercase tracking-wider text-white hover:bg-[#c19d65] transition-colors sm:block sm:px-6">Começar projeto</button><button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} className="grid h-10 w-10 place-items-center border border-bw-white/30 bg-bw-preto/20 text-bw-areia lg:hidden">{menuOpen ? <Icon.X /> : <Icon.Menu />}</button></div>
        </div>
        {menuOpen && <div className="grid gap-5 border-t border-bw-white/10 bg-bw-preto/80 backdrop-blur-md px-5 py-6 font-mono text-[13px] uppercase tracking-widest text-bw-areia lg:hidden">{[["Sobre", "sobre"], ["Método", "metodo"], ["Projetos", "projetos"], ["Contato", "contato"]].map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="text-left hover:text-bw-dourado transition-colors">{label}</button>)}</div>}
      </nav>
      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1600px] items-end gap-10 px-5 pb-10 pt-28 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:px-12">
        <div className="max-w-4xl lg:pb-5"><h1 className="font-display text-[clamp(2.65rem,12vw,8.6rem)] font-medium leading-[.86] tracking-[-.045em] text-bw-white sm:leading-[.78] sm:tracking-[-.055em]">Transformamos ideias<br /><span className="font-normal text-bw-areia fg-inline-italic">em ambientes que</span><br />inspiram.</h1><div className="mt-8 flex flex-col gap-5 sm:mt-10 sm:flex-row sm:items-center sm:gap-6"><button onClick={() => scrollTo("contato")} className="w-full bg-bw-dourado px-7 py-3.5 text-[11px] font-medium uppercase tracking-[.14em] text-white hover:bg-[#c19d65] transition-colors sm:w-fit">Agendar conversa <span className="ml-4">↗</span></button><p className="max-w-xs text-sm leading-relaxed text-bw-areia/80">Projetamos espaços singulares, feitos para viver bem hoje e continuar fazendo sentido amanhã.</p></div></div>
        <div className="hidden w-full border border-bw-white/20 bg-bw-preto/35 p-6 backdrop-blur-sm sm:block sm:p-7 lg:max-w-md lg:justify-self-end"><div className="mb-9 flex items-start justify-between gap-5"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-bw-dourado">Palavras de quem vive BW</div><StarRow /></div><p className="font-display text-[25px] leading-[1.08] text-bw-white sm:text-[29px]">“{depoimentos[dep].texto}”</p><div className="mt-8 flex items-center justify-between gap-4 border-t border-bw-white/20 pt-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-bw-dourado/50 bg-bw-areia/10 text-[10px] font-semibold text-bw-areia">{depoimentos[dep].nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}</div><div><div className="text-xs font-medium text-bw-white">{depoimentos[dep].nome}</div><div className="mt-0.5 text-[10px] text-bw-areia/60">{depoimentos[dep].sub}</div></div></div><div className="flex gap-2">{depoimentos.map((_, i) => <button aria-label={`Depoimento ${i + 1}`} key={i} onClick={() => setDep(i)} className={`h-px transition-all ${dep === i ? "w-8 bg-bw-dourado" : "w-3 bg-bw-white/40 hover:bg-bw-white"}`} />)}</div></div></div>
      </div>
    </section>

    <section id="sobre" className="bg-bw-white"><div className="mx-auto grid max-w-[1600px] items-start gap-y-12 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:py-36"><div className="lg:sticky lg:top-28 lg:col-span-5"><div className="mb-6 font-mono text-[10px] uppercase tracking-[.2em] text-bw-dourado">01 — Nossa assinatura</div><h2 className="font-display text-5xl leading-[.87] tracking-[-.045em] sm:text-6xl lg:text-7xl">A beleza mora na forma como um espaço acolhe.</h2></div><div className="lg:col-span-6 lg:col-start-7"><img src={sobrePhoto} alt="Bianca e Walmir, fundadores da BW" className="w-full max-w-[500px] h-auto mx-auto" /><div className="mt-4 mb-8 font-mono text-[10px] uppercase leading-relaxed tracking-[.16em] text-bw-muted">Bianca & Walmir<br />Fundadores da BW</div><div><p className="text-[17px] leading-relaxed text-bw-madeira">A BW nasce do encontro entre olhar arquitetônico e ofício. Somos Bianca e Walmir, parceiros na vida e na criação de interiores que têm presença, propósito e permanência.</p><p className="mt-5 text-[15px] leading-relaxed text-bw-madeira">Do desenho à última regulagem da porta, cada decisão é nossa. É assim que o projeto ganha verdade — e vira parte da sua história.</p></div></div></div></section>

    <section id="metodo" className="border-y border-bw-border-sub bg-bw-areia"><div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"><div className="mb-16 grid gap-10 lg:grid-cols-12"><div className="lg:col-span-4"><div className="mb-5 font-mono text-[10px] uppercase tracking-[.2em] text-bw-dourado">02 — Da conversa à casa</div><h2 className="font-display text-5xl leading-[.88] tracking-[-.04em]">Um processo<br />sem ruído.</h2></div><p className="self-end text-[15px] leading-relaxed text-bw-madeira lg:col-span-4 lg:col-start-8">Clareza, proximidade e domínio técnico em cada etapa. Você acompanha o que importa — sem precisar administrar a obra.</p></div><div className="grid border-t border-bw-border md:grid-cols-3">{[["01", "Escuta e estratégia", "Começamos pela sua rotina, referências e desejos. O briefing vira direção, não formulário."], ["02", "Projeto com matéria", "Arquitetura, detalhamento e escolha de materiais em um só desenho, pensado até o milímetro."], ["03", "Execução presente", "Produção, entrega e montagem com equipe própria acompanhando cada acabamento."]].map(([n, t, d]) => <div key={n} className="border-b border-bw-border py-12 md:border-b-0 md:border-r md:py-14 md:px-12 last:border-0"><div className="mb-12 font-mono text-[22px] font-medium text-bw-dourado">{n}</div><h3 className="mb-4 font-display text-3xl leading-none">{t}</h3><p className="max-w-xs text-sm leading-relaxed text-bw-madeira">{d}</p></div>)}</div></div></section>

    <section id="projetos" className="bg-bw-white"><div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36"><div className="mb-12 flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><div className="mb-5 font-mono text-[10px] uppercase tracking-[.2em] text-bw-dourado">03 — Projetos selecionados</div><h2 className="font-display text-5xl leading-none tracking-[-.045em] sm:text-6xl">Espaços que pedem<br /><em className="font-normal">para ser vividos.</em></h2></div><button onClick={() => scrollTo("contato")} className="w-fit border-b border-bw-dourado pb-2 text-left font-mono text-[11px] uppercase tracking-[.14em] text-bw-madeira hover:text-bw-preto">Ver portfólio completo ↗</button></div><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-12">{projects.map((p, i) => <article key={p.title} className={`${i === 0 ? "col-span-2 lg:col-span-6" : "lg:col-span-3"} group cursor-pointer`}><div className={`${i === 0 ? "aspect-[16/10]" : "aspect-[3/4]"} overflow-hidden bg-bw-areia`}><img src={p.image} alt={`${p.title}, ${p.type}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div><div className="flex justify-between gap-3 pt-3"><div><h3 className="font-display text-2xl leading-none">{p.title}</h3><p className="mt-2 font-mono text-[10px] uppercase tracking-[.12em] text-bw-muted">{p.type}</p></div><span className="text-xl text-bw-dourado opacity-0 transition-opacity group-hover:opacity-100">↗</span></div></article>)}</div></div></section>

    <section id="contato" className="relative overflow-hidden bg-bw-preto text-bw-white"><div className="pointer-events-none absolute -right-20 -top-24 select-none opacity-[.06]"><img src={bwLogo} alt="" className="w-[520px] object-contain" /></div><div className="relative mx-auto grid max-w-[1600px] items-end gap-12 px-5 py-28 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-40"><div className="lg:col-span-8"><div className="mb-7 font-mono text-[10px] uppercase tracking-[.2em] text-bw-dourado">Vamos conversar</div><h2 className="font-display text-5xl leading-[.82] tracking-[-.05em] sm:text-7xl lg:text-8xl">Seu próximo<br /><em className="font-normal text-bw-areia">ambiente começa</em><br />aqui.</h2></div><div className="lg:col-span-3 lg:col-start-10"><p className="mb-7 text-sm leading-relaxed text-bw-areia/75">Conte um pouco sobre o que você imagina. Nós cuidamos do primeiro traço.</p><button onClick={() => onNav("cadastro")} className="w-full bg-bw-dourado py-4 text-[11px] font-medium uppercase tracking-[.14em] text-white hover:bg-[#c19d65] transition-colors">Iniciar projeto ↗</button></div></div></section>
    <footer className="border-t border-bw-sidebar-b bg-bw-preto"><div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-5 px-5 py-8 font-mono text-[10px] uppercase tracking-[.1em] text-bw-muted sm:flex-row sm:items-center sm:px-8 lg:px-12"><div><div>© 2026 · São Paulo, Brasil</div></div><div className="flex flex-col items-center"><img src={bwLogo} alt="BW" className="object-contain" style={{height:"44px",width:"auto",mixBlendMode:"screen"}} /><span className="mt-[3px] block font-mono text-[8px] uppercase tracking-[.22em] text-bw-muted">Arquitetura & Marcenaria</span></div><div className="flex gap-6"><a href="#" className="hover:text-bw-areia transition-colors">Instagram</a><a href="#" className="hover:text-bw-areia transition-colors">Pinterest</a></div></div></footer>
  </div>;
}

// ─── SCREEN: Login ────────────────────────────────────────────────────────────
type LoginTab = "pf" | "pj";
type LoginStep = "form" | "verify";

const BW_PROTOTYPE_LOGIN = {
  cnpj: "00000000000000",
  email: "bw.arquiteturaemarcenaria@gmail.com",
  password: "123",
};

function Login({ onNav, onClientLogin }: { onNav: (s: Screen) => void; onClientLogin: (tipo: ClienteTipo) => void }) {
  const [tab, setTab] = useState<LoginTab>("pf");
  const [step, setStep] = useState<LoginStep>("form");
  const [showPass, setShowPass] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [pjEmail, setPjEmail] = useState("");
  const [pjPassword, setPjPassword] = useState("");

  function formatCNPJ(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 14);
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
            .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "$1.$2.$3/$4")
            .replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3")
            .replace(/^(\d{2})(\d{3})$/, "$1.$2")
            .replace(/^(\d{2})$/, "$1");
  }

  function handleBwLogin() {
    const credentialsAreValid =
      cnpj.replace(/\D/g, "") === BW_PROTOTYPE_LOGIN.cnpj &&
      pjEmail.trim().toLowerCase() === BW_PROTOTYPE_LOGIN.email &&
      pjPassword === BW_PROTOTYPE_LOGIN.password;

    if (credentialsAreValid) {
      onNav("funil");
      return;
    }

    onClientLogin("pj");
  }

  const glassInput = "w-full bg-transparent border-0 border-b border-white/20 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-bw-dourado transition-colors pr-8";
  const glassLabel = "block text-[10px] font-mono uppercase tracking-[.18em] text-white/40 mb-1";

  return (
    <div className="relative min-h-full flex overflow-hidden bg-bw-preto">
      {/* Full-bleed background */}
      <img
        src={bwLoginBg}
        alt="Projeto de marcenaria BW"
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        style={{ filter: "blur(2px)" }}
      />
      <div className="absolute inset-0 bg-bw-preto/60" />

      {/* Left: editorial copy */}
      <div className="relative z-10 hidden lg:flex flex-col justify-center px-16 xl:px-24 w-1/2">
        <button onClick={() => onNav("institucional")} className="mb-16 text-[10px] font-mono uppercase tracking-[.18em] text-white/40 hover:text-bw-dourado transition-colors flex items-center gap-2">
          <span>←</span> Voltar ao site
        </button>
        <div className="mb-6 font-mono text-[10px] uppercase tracking-[.22em] text-bw-dourado flex items-center gap-3">
          <span className="h-px w-6 bg-bw-dourado" /> Área do cliente
        </div>
        <h1 className="font-display text-[clamp(3rem,5vw,5.5rem)] font-medium leading-[.85] tracking-[-.04em] text-white mb-8">
          Bem-vindo<br /><em className="font-normal text-white/50">de volta.</em>
        </h1>
      </div>

      {/* Right: glass panel */}
      <div className="relative z-10 flex items-center justify-center w-full lg:w-1/2 px-6 py-12">
        <div className="w-full max-w-[400px]" style={{ background: "rgba(22,19,15,0.55)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", padding: "40px 40px 36px" }}>

          {/* Logo */}
          <div className="mb-10">
            <img src={bwLogo} alt="BW Arquitetura e Marcenaria" style={{ height: "60px", width: "auto", mixBlendMode: "screen" }} />
            <div className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-[.18em]">Portal do cliente</div>
          </div>

          {step === "form" ? (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl text-white leading-tight">Entrar</h2>
                <p className="text-[11px] font-mono text-white/35 mt-1">Selecione o tipo de cadastro</p>
              </div>

              {/* Tabs PF / PJ */}
              <div className="flex mb-8 border-b border-white/10">
                {(["pf","pj"] as LoginTab[]).map((t, i) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 pb-2.5 text-[10px] font-mono uppercase tracking-[.14em] transition-colors flex items-center justify-center gap-1.5 ${tab === t ? "text-bw-dourado border-b border-bw-dourado -mb-px" : "text-white/30 hover:text-white/60"}`}>
                    {i === 0 ? "Pessoa Física" : "Pessoa Jurídica"}
                  </button>
                ))}
              </div>

              {tab === "pf" ? (
                <div key="pf" className="flex flex-col gap-6">
                  <div>
                    <label className={glassLabel}>E-mail</label>
                    <input type="email" placeholder="seu@email.com" className={glassInput} />
                  </div>
                  <div>
                    <label className={glassLabel}>Senha</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="••••••••" className={glassInput} />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                        {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
                      </button>
                    </div>
                    <div className="text-right mt-2">
                      <a href="#" className="text-[10px] font-mono text-white/30 hover:text-bw-dourado transition-colors">Esqueci minha senha</a>
                    </div>
                  </div>
                  <button onClick={() => onClientLogin("pf")} className="mt-2 w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3">
                    Entrar <span className="text-base leading-none">›</span>
                  </button>
                </div>
              ) : (
                <div key="pj" className="flex flex-col gap-6">
                  <div>
                    <label className={glassLabel}>CNPJ</label>
                    <input type="text" placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} className={glassInput + " font-mono"} />
                    <p className="text-[9px] font-mono text-white/25 mt-1.5 flex items-center gap-1"><Icon.AlertCircle /> Validado na Receita Federal</p>
                  </div>
                  <div>
                    <label className={glassLabel}>E-mail corporativo</label>
                    <input type="email" placeholder="contato@empresa.com.br" value={pjEmail} onChange={e => setPjEmail(e.target.value)} className={glassInput} />
                  </div>
                  <div>
                    <label className={glassLabel}>Senha</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="••••••••" value={pjPassword} onChange={e => setPjPassword(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleBwLogin(); }} className={glassInput} />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                        {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
                      </button>
                    </div>
                    <div className="text-right mt-2">
                      <a href="#" className="text-[10px] font-mono text-white/30 hover:text-bw-dourado transition-colors">Esqueci minha senha</a>
                    </div>
                  </div>
                  <button onClick={handleBwLogin} className="mt-2 w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3">
                    Entrar <span className="text-base leading-none">›</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-bw-dourado/40 flex items-center justify-center mx-auto mb-6 text-bw-dourado">
                <Icon.Mail />
              </div>
              <h2 className="font-display text-2xl text-white mb-2">Verifique seu e-mail</h2>
              <p className="text-[11px] font-mono text-white/35 mb-7 leading-relaxed">Código enviado para <span className="text-white/60">seu@email.com</span></p>
              <div className="flex gap-2 justify-center mb-7">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input key={i} type="text" maxLength={1} className="w-10 h-12 bg-transparent border-b border-white/20 text-center text-lg font-mono text-white focus:outline-none focus:border-bw-dourado transition-colors" />
                ))}
              </div>
              <button onClick={() => onClientLogin(tab)} className="w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3 mb-4">
                Verificar código <span className="text-base leading-none">›</span>
              </button>
              <p className="text-[10px] font-mono text-white/30">Não recebeu? <button className="text-white/50 hover:text-bw-dourado transition-colors underline">Reenviar</button></p>
              <button onClick={() => setStep("form")} className="mt-5 text-[10px] font-mono text-white/25 hover:text-white/50 transition-colors">← Voltar</button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between">
            <p className="text-[10px] font-mono text-white/25">
              Sem conta? <button onClick={() => onNav("cadastro")} className="text-white/50 hover:text-bw-dourado transition-colors underline">Criar agora</button>
            </p>
            <button onClick={() => onNav("institucional")} className="text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors lg:hidden">← Site</button>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => onNav("funil")} className="text-[9px] font-mono text-white/15 hover:text-white/30 transition-colors">Acesso interno — Equipe BW ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: Cadastro ─────────────────────────────────────────────────────────
type CadTab = "pf" | "pj";
type CadStep = "dados" | "verificacao" | "confirmacao";

const COMO_CONHECEU_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação de conhecido" },
  { value: "google", label: "Google / pesquisa" },
  { value: "houzz", label: "Houzz" },
  { value: "evento", label: "Evento ou feira" },
  { value: "outro", label: "Outro" },
];

function ComoConheceuFields({ comoConheceu, setComoConheceu, instagramUser, setInstagramUser, glassInput, glassLabel }: {
  comoConheceu: string; setComoConheceu: (v: string) => void;
  instagramUser: string; setInstagramUser: (v: string) => void;
  glassInput: string; glassLabel: string;
}) {
  return (
    <div className="pt-2 flex flex-col gap-5">
      <div className="border-t border-white/8 pt-4">
        <div className="text-[9px] font-mono uppercase tracking-[.18em] text-white/25 mb-3">Origem do contato</div>
        <div>
          <label className={glassLabel}>Como nos conheceu?</label>
          <select
            value={comoConheceu}
            onChange={e => { setComoConheceu(e.target.value); if (e.target.value !== "instagram") setInstagramUser(""); }}
            className={glassInput + " cursor-pointer bg-transparent appearance-none"}
            style={{ backgroundImage: "none" }}
          >
            <option value="" disabled style={{ background: "#16130f", color: "#fff" }}>Selecione uma opção</option>
            {COMO_CONHECEU_OPTIONS.map(o => (
              <option key={o.value} value={o.value} style={{ background: "#16130f", color: "#fff" }}>{o.label}</option>
            ))}
          </select>
        </div>
        {comoConheceu === "instagram" && (
          <div className="mt-4">
            <label className={glassLabel}>Seu perfil no Instagram</label>
            <div className="relative">
              <span className="absolute left-0 bottom-3 text-white/30 text-sm font-mono select-none">@</span>
              <input
                type="text"
                placeholder="seuperfil"
                value={instagramUser}
                onChange={e => setInstagramUser(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                className={glassInput + " pl-4"}
              />
            </div>
            <p className="text-[9px] font-mono text-white/25 mt-1.5">Opcional — nos ajuda a entender como chegou até nós</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Cadastro({ onNav, onClientLogin }: { onNav: (s: Screen) => void; onClientLogin: (tipo: ClienteTipo) => void }) {
  const [tab, setTab] = useState<CadTab>("pf");
  const [step, setStep] = useState<CadStep>("dados");
  const [showPass, setShowPass] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [comoConheceu, setComoConheceu] = useState("");
  const [instagramUser, setInstagramUser] = useState("");

  function formatCNPJ(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 14);
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "$1.$2.$3/$4").replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3").replace(/^(\d{2})(\d{3})$/, "$1.$2").replace(/^(\d{2})$/, "$1");
  }
  function formatCPF(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4").replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3").replace(/^(\d{3})(\d{3})$/, "$1.$2").replace(/^(\d{3})$/, "$1");
  }
  function formatPhone(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3").replace(/^(\d{2})(\d{5})$/, "($1) $2").replace(/^(\d{2})$/, "($1");
  }

  const stepLabel = { dados: "1. Dados", verificacao: "2. Verificação", confirmacao: "3. Acesso" };
  const steps: CadStep[] = ["dados", "verificacao", "confirmacao"];

  const glassInput = "w-full bg-transparent border-0 border-b border-white/20 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-bw-dourado transition-colors pr-8";
  const glassLabel = "block text-[10px] font-mono uppercase tracking-[.18em] text-white/40 mb-1";
  const stepIdx = steps.indexOf(step);

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
        <button onClick={() => onNav("institucional")} className="mb-16 text-[10px] font-mono uppercase tracking-[.18em] text-white/40 hover:text-bw-dourado transition-colors flex items-center gap-2">
          <span>←</span> Voltar ao site
        </button>
        <div className="mb-6 font-mono text-[10px] uppercase tracking-[.22em] text-bw-dourado flex items-center gap-3">
          <span className="h-px w-6 bg-bw-dourado" /> Nova conta
        </div>
        <h1 className="font-display text-[clamp(3rem,5vw,5.5rem)] font-medium leading-[.85] tracking-[-.04em] text-white mb-8">
          Crie seu<br /><em className="font-normal text-white/50">espaço.</em>
        </h1>

      </div>

      {/* Right: form panel — scrollable on small screens */}
      <div className="relative z-10 flex items-start lg:items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[420px]" style={{ background: "rgba(22,19,15,0.55)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", padding: "40px 40px 36px" }}>

          {/* Logo */}
          <div className="mb-8">
            <img src={bwLogo} alt="BW Arquitetura e Marcenaria" style={{ height: "60px", width: "auto", mixBlendMode: "screen" }} />
            <div className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-[.18em]">Criar nova conta</div>
          </div>

          {/* Mobile step indicator */}
          <div className="flex items-center gap-1.5 mb-8 lg:hidden">
            {steps.map((s, i) => (
              <div key={s} className={`h-px flex-1 transition-colors ${stepIdx >= i ? "bg-bw-dourado" : "bg-white/15"}`} />
            ))}
          </div>

          {/* STEP 1: Dados */}
          {step === "dados" && (
            <>
              <div className="mb-7">
                <h2 className="font-display text-3xl text-white leading-tight">Seus dados</h2>
                <p className="text-[11px] font-mono text-white/35 mt-1">Escolha o tipo de conta</p>
              </div>

              {/* PF / PJ tabs */}
              <div className="flex mb-7 border-b border-white/10">
                {(["pf","pj"] as CadTab[]).map((t, i) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 pb-2.5 text-[10px] font-mono uppercase tracking-[.14em] transition-colors flex items-center justify-center gap-1.5 ${tab === t ? "text-bw-dourado border-b border-bw-dourado -mb-px" : "text-white/30 hover:text-white/60"}`}>
                    {i === 0 ? "Pessoa Física" : "Pessoa Jurídica"}
                  </button>
                ))}
              </div>

              {tab === "pf" ? (
                <div key="pf" className="flex flex-col gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={glassLabel}>Nome</label>
                      <input type="text" placeholder="Nome" className={glassInput} />
                    </div>
                    <div>
                      <label className={glassLabel}>Sobrenome</label>
                      <input type="text" placeholder="Sobrenome" className={glassInput} />
                    </div>
                  </div>
                  <div>
                    <label className={glassLabel}>CPF</label>
                    <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className={glassInput + " font-mono"} />
                  </div>
                  <div>
                    <label className={glassLabel}>Data de nascimento</label>
                    <input type="date" className={glassInput + " font-mono"} />
                  </div>
                  <div>
                    <label className={glassLabel}>E-mail</label>
                    <input type="email" placeholder="seu@email.com" className={glassInput} />
                    <p className="text-[9px] font-mono text-white/25 mt-1.5 flex items-center gap-1"><Icon.AlertCircle /> Verificado por código no próximo passo</p>
                  </div>
                  <div>
                    <label className={glassLabel}>Celular / WhatsApp</label>
                    <input type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} className={glassInput + " font-mono"} />
                  </div>
                  <ComoConheceuFields comoConheceu={comoConheceu} setComoConheceu={setComoConheceu} instagramUser={instagramUser} setInstagramUser={setInstagramUser} glassInput={glassInput} glassLabel={glassLabel} />
                </div>
              ) : (
                <div key="pj" className="flex flex-col gap-5">
                  <div>
                    <label className={glassLabel}>CNPJ</label>
                    <input type="text" placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} className={glassInput + " font-mono"} />
                    <p className="text-[9px] font-mono text-white/25 mt-1.5 flex items-center gap-1"><Icon.AlertCircle /> Validado automaticamente na Receita Federal</p>
                  </div>
                  <div>
                    <label className={glassLabel}>Razão social</label>
                    <input type="text" placeholder="Nome da empresa Ltda." className={glassInput} />
                  </div>
                  <div>
                    <label className={glassLabel}>Nome fantasia</label>
                    <input type="text" placeholder="BW Arquitetura" className={glassInput} />
                  </div>
                  <div>
                    <label className={glassLabel}>E-mail corporativo</label>
                    <input type="email" placeholder="contato@empresa.com.br" className={glassInput} />
                    <p className="text-[9px] font-mono text-white/25 mt-1.5 flex items-center gap-1"><Icon.AlertCircle /> Verificado por código no próximo passo</p>
                  </div>
                  <div>
                    <label className={glassLabel}>Telefone comercial</label>
                    <input type="tel" placeholder="(11) 3000-0000" className={glassInput + " font-mono"} />
                  </div>
                  <div>
                    <label className={glassLabel}>Nome do responsável</label>
                    <input type="text" placeholder="Nome completo" className={glassInput} />
                  </div>
                  <div>
                    <label className={glassLabel}>CPF do responsável</label>
                    <input type="text" placeholder="000.000.000-00" className={glassInput + " font-mono"} />
                  </div>
                  <ComoConheceuFields comoConheceu={comoConheceu} setComoConheceu={setComoConheceu} instagramUser={instagramUser} setInstagramUser={setInstagramUser} glassInput={glassInput} glassLabel={glassLabel} />
                </div>
              )}

              <button onClick={() => setStep("verificacao")} className="mt-8 w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3">
                Continuar <span className="text-base leading-none">›</span>
              </button>
            </>
          )}

          {/* STEP 2: Verificação */}
          {step === "verificacao" && (
            <div>
              <div className="mb-7">
                <h2 className="font-display text-3xl text-white leading-tight">Verificação</h2>
                <p className="text-[11px] font-mono text-white/35 mt-1">Confirme o endereço de e-mail</p>
              </div>

              {!emailSent ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                    <span className="text-white/30"><Icon.Mail /></span>
                    <div>
                      <div className="text-xs font-mono text-white/70">seu@email.com</div>
                      <div className="text-[9px] font-mono text-white/30">{tab === "pj" ? "E-mail corporativo" : "E-mail pessoal"}</div>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-white/35 leading-relaxed">Enviaremos um código de 6 dígitos. Expira em 15 minutos.</p>
                  <button onClick={() => setEmailSent(true)} className="w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3">
                    Enviar código <span className="text-base leading-none">›</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <p className="text-[11px] font-mono text-white/35">Código enviado para <span className="text-white/60">seu@email.com</span></p>
                  <div>
                    <label className={glassLabel}>Código de 6 dígitos</label>
                    <div className="flex gap-2 mt-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <input key={i} type="text" maxLength={1} className="w-full bg-transparent border-b border-white/20 py-3 text-center text-lg font-mono text-white focus:outline-none focus:border-bw-dourado transition-colors" />
                      ))}
                    </div>
                    <p className="text-[9px] font-mono text-white/25 text-right mt-2">Expira em <span className="text-white/50">14:32</span></p>
                  </div>
                  <button onClick={() => setStep("confirmacao")} className="w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3">
                    Verificar e-mail <span className="text-base leading-none">›</span>
                  </button>
                  <button onClick={() => {}} className="text-[10px] font-mono text-white/25 hover:text-bw-dourado transition-colors text-center underline">Reenviar código</button>
                </div>
              )}
              <button onClick={() => setStep("dados")} className="mt-6 text-[10px] font-mono text-white/25 hover:text-white/50 transition-colors block">← Voltar</button>
            </div>
          )}

          {/* STEP 3: Senha */}
          {step === "confirmacao" && (
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-bw-dourado/70 border-b border-white/10 pb-4 mb-2">
                  <Icon.Check /> E-mail verificado com sucesso
                </div>
                <h2 className="font-display text-3xl text-white leading-tight mt-4">Definir senha</h2>
                <p className="text-[11px] font-mono text-white/35 mt-1">Mínimo 8 caracteres</p>
              </div>
              <div>
                <label className={glassLabel}>Senha</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} placeholder="Mínimo 8 caracteres" className={glassInput} />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
                  </button>
                </div>
                <div className="flex gap-1 mt-3">
                  {["","","",""].map((_, i) => (
                    <div key={i} className="flex-1 h-px bg-white/10" />
                  ))}
                </div>
                <div className="mt-2.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {[["Mín. 8 caracteres",false],["Letra maiúscula",false],["Número",false],["Caractere especial",false]].map(([r, ok]) => (
                    <div key={r as string} className="flex items-center gap-1.5 text-[9px] font-mono text-white/25">
                      <span>{ok ? "✓" : "–"}</span>{r as string}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={glassLabel}>Confirmar senha</label>
                <input type="password" placeholder="Repita a senha" className={glassInput} />
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" className="mt-0.5 accent-bw-dourado" />
                <label className="text-[10px] font-mono text-white/35 leading-relaxed">Li e aceito os <a href="#" className="text-white/60 hover:text-bw-dourado transition-colors underline">Termos de Uso</a> e a <a href="#" className="text-white/60 hover:text-bw-dourado transition-colors underline">Política de Privacidade</a></label>
              </div>
              <button onClick={() => onClientLogin(tab)} className="w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-3">
                Criar conta e entrar <span className="text-base leading-none">›</span>
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between">
            <p className="text-[10px] font-mono text-white/25">
              Já tem conta? <button onClick={() => onNav("login")} className="text-white/50 hover:text-bw-dourado transition-colors underline">Entrar</button>
            </p>
            <button onClick={() => onNav("institucional")} className="text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors lg:hidden">← Site</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PORTAL DO CLIENTE ────────────────────────────────────────────────────────
type PortalTab = "mensagens" | "conta";

const clienteMsgsPF = [
  { from: "bw", text: "Olá, Juliana! Como posso ajudar com seu projeto hoje?" },
  { from: "cliente", text: "Oi! Queria saber como está o andamento da minha cozinha planejada." },
  { from: "bw", text: "Seu projeto está em fase de produção. O gabinete superior foi cortado e está em pintura. Prazo estimado de entrega: 12 dias úteis. 🎉" },
  { from: "cliente", text: "Que ótimo! E sobre as ferragens — confirmaram o modelo escolhido?" },
  { from: "bw", text: "Sim! As ferragens Blum com amortecedor foram confirmadas. Caso queira alterar, precisa ser até amanhã para não impactar o prazo." },
];

const clienteMsgsPJ = [
  { from: "bw", text: "Bom dia! Aqui é a equipe BW. Em que posso ajudar a sua empresa?" },
  { from: "cliente", text: "Precisamos de uma atualização sobre o cronograma do escritório." },
  { from: "bw", text: "O projeto do escritório está 70% concluído. Ambientes restantes: sala de reunião e recepção. Entrega prevista: 18/10." },
  { from: "cliente", text: "Perfeito. O pagamento da segunda parcela foi confirmado?" },
  { from: "bw", text: "Confirmado! Recebemos R$ 24.000 em 15/09. Próxima parcela: R$ 12.000 no ato da entrega." },
];

function ClienteChatbot({ tipo }: { tipo: ClienteTipo }) {
  const initMsgs = tipo === "pf" ? clienteMsgsPF : clienteMsgsPJ;
  const [messages, setMessages] = useState(initMsgs);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { from: "cliente", text }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { from: "bw", text: "Mensagem recebida! Nossa equipe responderá em instantes." }]);
    }, 900);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col w-full h-full rounded-sm" style={{ background: "rgba(22,19,15,0.45)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-10 h-10 rounded-full bg-bw-dourado/10 border border-bw-dourado/30 flex items-center justify-center text-bw-dourado flex-shrink-0">
          <Icon.Bot />
        </div>
        <div>
          <div className="text-base font-display tracking-wide text-white">Equipe BW Arquitetura</div>
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-[.18em] mt-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500/80 animate-pulse"></span> Online — Responde em até 2h</div>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "cliente" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-5 py-3.5 text-[13px] leading-relaxed rounded-sm ${
              m.from === "cliente"
                ? "bg-bw-dourado text-white"
                : "text-white/90"
            }`} style={m.from === "bw" ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" } : {}}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="px-5 py-5 flex gap-3 items-end" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Escreva sua mensagem…"
          className="flex-1 bg-transparent border-0 border-b border-white/20 py-2.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-bw-dourado transition-colors"
        />
        <button onClick={send} className="w-10 h-10 flex items-center justify-center bg-bw-dourado/10 border border-bw-dourado/40 text-bw-dourado hover:bg-bw-dourado hover:text-white transition-colors flex-shrink-0">
          <Icon.Send />
        </button>
      </div>
    </div>
  );
}

function ClienteConta({ tipo }: { tipo: ClienteTipo }) {
  const glassInput = "w-full bg-transparent border-0 border-b border-white/20 py-3 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-bw-dourado transition-colors";
  const glassLabel = "block text-[10px] font-mono uppercase tracking-[.18em] text-white/40 mb-1.5";
  const readOnly = "w-full bg-transparent border-0 border-b border-white/10 py-3 text-[13px] text-white/40 font-mono cursor-not-allowed select-none";
  const [comoConheceu, setComoConheceu] = useState("instagram");
  const [instagramUser, setInstagramUser] = useState("juliana.costa");
  const [saved, setSaved] = useState(false);

  return (
    <div className="w-full h-full overflow-y-auto rounded-sm" style={{ background: "rgba(22,19,15,0.45)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
      <div className="sticky top-0 z-10 px-5 py-6 sm:px-8 sm:py-7" style={{ background: "rgba(22,19,15,0.85)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-bw-dourado uppercase tracking-[.22em] flex items-center gap-2"><span className="h-px w-4 bg-bw-dourado" /> {tipo === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</div>
        </div>
        <div className="font-display text-3xl tracking-tight text-white mt-3">Minha Conta</div>
      </div>

      <div className="flex flex-col gap-10 px-5 py-6 sm:px-8 sm:py-8">
        {tipo === "pf" ? (
          <>
            {/* Dados pessoais */}
            <section className="flex flex-col gap-5">
              <div className="text-[9px] font-mono uppercase tracking-[.2em] text-white/25">Dados pessoais</div>
              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <label className={glassLabel}>Nome</label>
                  <input type="text" defaultValue="Juliana" className={glassInput} />
                </div>
                <div>
                  <label className={glassLabel}>Sobrenome</label>
                  <input type="text" defaultValue="Costa" className={glassInput} />
                </div>
                <div>
                  <label className={glassLabel}>CPF</label>
                  <input type="text" value="***.***.***-05" readOnly className={readOnly} />
                  <div className="text-[9px] font-mono text-white/20 mt-1">Não editável</div>
                </div>
                <div>
                  <label className={glassLabel}>Data de nascimento</label>
                  <input type="date" defaultValue="1988-07-14" className={glassInput} />
                </div>
                <div className="col-span-2">
                  <label className={glassLabel}>E-mail</label>
                  <input type="email" defaultValue="juliana.costa@email.com" className={glassInput} />
                </div>
                <div className="col-span-2">
                  <label className={glassLabel}>Celular / WhatsApp</label>
                  <input type="tel" defaultValue="(11) 98765-4321" className={glassInput} />
                </div>
              </div>
            </section>
            {/* Origem */}
            <section className="flex flex-col gap-4">
              <div className="text-[9px] font-mono uppercase tracking-[.2em] text-white/25">Origem do contato</div>
              <div>
                <label className={glassLabel}>Como nos conheceu?</label>
                <select value={comoConheceu} onChange={e => { setComoConheceu(e.target.value); if (e.target.value !== "instagram") setInstagramUser(""); }}
                  className={glassInput + " cursor-pointer appearance-none bg-transparent"} style={{ backgroundImage: "none" }}>
                  {COMO_CONHECEU_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#16130f", color: "#fff" }}>{o.label}</option>)}
                </select>
              </div>
              {comoConheceu === "instagram" && (
                <div>
                  <label className={glassLabel}>Perfil no Instagram</label>
                  <div className="relative">
                    <span className="absolute left-0 bottom-2.5 text-white/30 text-sm font-mono select-none">@</span>
                    <input type="text" value={instagramUser} onChange={e => setInstagramUser(e.target.value.replace(/^@/, "").replace(/\s/g, ""))} className={glassInput + " pl-4"} />
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* Dados da empresa */}
            <section className="flex flex-col gap-5">
              <div className="text-[9px] font-mono uppercase tracking-[.2em] text-white/25">Dados da empresa</div>
              <div>
                <label className={glassLabel}>CNPJ</label>
                <input type="text" value="12.***.***/**00-95" readOnly className={readOnly} />
                <div className="text-[9px] font-mono text-white/20 mt-1">Não editável</div>
              </div>
              <div>
                <label className={glassLabel}>Razão social</label>
                <input type="text" value="Costa Empreendimentos Ltda." readOnly className={readOnly} />
                <div className="text-[9px] font-mono text-white/20 mt-1">Validado na Receita Federal</div>
              </div>
              <div>
                <label className={glassLabel}>Nome fantasia</label>
                <input type="text" defaultValue="Costa Design" className={glassInput} />
              </div>
              <div>
                <label className={glassLabel}>E-mail corporativo</label>
                <input type="email" defaultValue="contato@costadesign.com.br" className={glassInput} />
              </div>
              <div>
                <label className={glassLabel}>Telefone comercial</label>
                <input type="tel" defaultValue="(11) 3044-8800" className={glassInput} />
              </div>
            </section>
            {/* Responsável */}
            <section className="flex flex-col gap-5">
              <div className="text-[9px] font-mono uppercase tracking-[.2em] text-white/25">Responsável legal</div>
              <div>
                <label className={glassLabel}>Nome completo</label>
                <input type="text" defaultValue="Priscila Costa" className={glassInput} />
              </div>
              <div>
                <label className={glassLabel}>CPF do responsável</label>
                <input type="text" value="***.***.***-22" readOnly className={readOnly} />
                <div className="text-[9px] font-mono text-white/20 mt-1">Não editável</div>
              </div>
            </section>
            {/* Origem */}
            <section className="flex flex-col gap-4">
              <div className="text-[9px] font-mono uppercase tracking-[.2em] text-white/25">Origem do contato</div>
              <div>
                <label className={glassLabel}>Como nos conheceu?</label>
                <select value={comoConheceu} onChange={e => { setComoConheceu(e.target.value); if (e.target.value !== "instagram") setInstagramUser(""); }}
                  className={glassInput + " cursor-pointer appearance-none bg-transparent"} style={{ backgroundImage: "none" }}>
                  {COMO_CONHECEU_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#16130f", color: "#fff" }}>{o.label}</option>)}
                </select>
              </div>
              {comoConheceu === "instagram" && (
                <div>
                  <label className={glassLabel}>Perfil no Instagram</label>
                  <div className="relative">
                    <span className="absolute left-0 bottom-2.5 text-white/30 text-sm font-mono select-none">@</span>
                    <input type="text" value={instagramUser} onChange={e => setInstagramUser(e.target.value.replace(/^@/, "").replace(/\s/g, ""))} className={glassInput + " pl-4"} />
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* Segurança */}
        <section className="flex flex-col gap-4">
          <div className="text-[9px] font-mono uppercase tracking-[.2em] text-white/25">Segurança</div>
          <div>
            <label className={glassLabel}>Senha atual</label>
            <input type="password" placeholder="••••••••" className={glassInput} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={glassLabel}>Nova senha</label>
              <input type="password" placeholder="Mínimo 8 caracteres" className={glassInput} />
            </div>
            <div>
              <label className={glassLabel}>Confirmar nova senha</label>
              <input type="password" placeholder="Repita" className={glassInput} />
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="pb-4">
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
            className="w-full py-3 border border-bw-dourado/60 bg-bw-dourado/10 text-bw-dourado text-[11px] font-mono uppercase tracking-[.18em] hover:bg-bw-dourado/20 transition-colors flex items-center justify-center gap-2">
            {saved ? <><Icon.Check /> Salvo</> : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PortalCliente({ tipo, onNav }: { tipo: ClienteTipo; onNav: (s: Screen) => void }) {
  const [tab, setTab] = useState<PortalTab>("mensagens");

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-bw-preto">
      <img src={bwLoginBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" style={{ filter: "blur(3px)" }} />
      <div className="absolute inset-0 bg-bw-preto/75" />

      {/* Top bar */}
      <header className="relative z-10 flex h-[74px] flex-shrink-0 items-center justify-between gap-1 px-3 sm:gap-3 sm:px-8 lg:px-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-4">
          <img src={bwLogo} alt="BW Arquitetura" style={{ height: "40px", width: "auto", mixBlendMode: "screen" }} />
          <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[.22em] text-bw-areia/60">Portal do Cliente</span>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center h-full">
          {([["mensagens","Mensagens"],["conta","Minha Conta"]] as [PortalTab,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex h-full items-center px-2.5 font-mono text-[9px] uppercase tracking-[.1em] transition-colors sm:px-8 sm:text-[10px] sm:tracking-[.18em] ${tab === t ? "text-bw-dourado border-b-2 border-bw-dourado" : "text-white/40 hover:text-white/80"}`}>
              {label}
            </button>
          ))}
        </nav>

        {/* Sair */}
        <button onClick={() => onNav("institucional")} className="text-[10px] font-mono text-white/40 hover:text-bw-dourado transition-colors uppercase tracking-[.18em] flex items-center gap-2">
          Sair <span className="text-sm leading-none hidden sm:block">›</span>
        </button>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-stretch justify-center overflow-hidden px-3 py-4 sm:px-4 sm:py-8 lg:px-12 lg:py-12">
        <div className="w-full max-w-4xl xl:max-w-5xl">
          {tab === "mensagens" ? <ClienteChatbot tipo={tipo} /> : <ClienteConta tipo={tipo} />}
        </div>
      </div>
    </div>
  );
}

// ─── PLATFORM SHELL ───────────────────────────────────────────────────────────
const navItems: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: "funil", label: "Funil de Clientes", icon: <Icon.Users /> },
  { id: "financeiro", label: "Financeiro", icon: <Icon.Dollar /> },
  { id: "calendario", label: "Calendário", icon: <Icon.Cal /> },
  { id: "chatbot", label: "Chatbot IA", icon: <Icon.Bot /> },
  { id: "simulacao", label: "Simulação de Ambiente", icon: <Icon.Layers /> },
  { id: "tabela-precos", label: "Tabela de Preços", icon: <Icon.Tag /> },
  { id: "rastreabilidade", label: "Rastreabilidade", icon: <Icon.Trend /> },
  { id: "descarte", label: "Mapa de Descarte", icon: <Icon.Map /> },
  { id: "usuarios-admin", label: "Administradores", icon: <Icon.Users /> },
  { id: "configuracoes", label: "Configurações da Conta", icon: <Icon.Settings /> },
];

function PlatformShell({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderScreen = () => {
    switch (screen) {
      case "funil": return <Funil />;
      case "financeiro": return <Financeiro />;
      case "calendario": return <Calendario />;
      case "chatbot": return <Chatbot />;
      case "simulacao": return <Simulacao />;
      case "tabela-precos": return <TabelaPrecos />;
      case "rastreabilidade": return <Rastreabilidade />;
      case "descarte": return <MapaDescarte />;
      case "usuarios-admin": return <UsuariosAdmin />;
      case "configuracoes": return <ConfiguracoesConta />;
      default: return <Funil />;
    }
  };

  return (
    <div className="h-full flex bw-admin-ground">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed md:static z-40 m-0 h-full w-[17rem] bg-bw-preto/95 flex flex-col border-r border-white/5 shadow-[16px_0_50px_rgba(22,19,15,.16)] backdrop-blur-xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex h-[88px] items-center justify-between px-5" style={{ borderBottom: "1px solid #2C2218" }}>
          <img src={bwLogo} alt="BW Arquitetura e Marcenaria" className="h-14 w-auto object-contain" />
          <button className="md:hidden text-bw-ph" onClick={() => setSidebarOpen(false)}><Icon.X /></button>
        </div>
        <div className="px-5 pt-6 pb-2 font-mono text-[9px] uppercase tracking-[.22em] text-bw-dourado/80">Estúdio BW</div>
        <nav aria-label="Navegação da equipe" className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNav(item.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-md text-[12px] font-medium w-full text-left transition-all duration-200 ${screen === item.id ? "bg-bw-dourado text-white shadow-[0_8px_18px_rgba(176,141,87,.18)]" : "text-bw-ph hover:bg-white/8 hover:text-bw-areia"}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="m-3 rounded-md border border-white/10 bg-white/[.035] p-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full border border-bw-dourado/40 bg-bw-dourado/10 font-mono text-[9px] text-bw-dourado">BW</div>
            <div className="min-w-0"><div className="truncate text-xs font-medium text-bw-areia">Equipe BW</div><div className="mt-0.5 text-[9px] font-mono uppercase tracking-wider text-bw-ph">Administrador</div></div>
          </div>
          <button onClick={() => onNav("institucional")} className="mt-3 text-[10px] font-mono uppercase tracking-[.14em] text-bw-ph transition-colors hover:text-bw-dourado">Sair da plataforma ↗</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[72px] border-b border-bw-border-sub flex items-center justify-between px-5 sm:px-7 gap-3 flex-shrink-0 bg-bw-white/70 backdrop-blur-xl">
          <button className="md:hidden text-bw-madeira" onClick={() => setSidebarOpen(true)}><Icon.Menu /></button>
          <div className="flex items-center gap-3"><span className="hidden h-2 w-2 rounded-full bg-bw-dourado shadow-[0_0_0_4px_rgba(176,141,87,.12)] sm:block" /><span className="text-[10px] font-mono uppercase tracking-[.18em] text-bw-muted">{navItems.find(n => n.id === screen)?.label}</span></div>
          <div className="hidden items-center gap-2 text-[10px] font-mono text-bw-muted sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-bw-dourado" /> Operação em dia</div>
        </header>
        <main className={`flex-1 min-h-0 px-3 sm:px-6 lg:px-8 ${screen === "funil" ? "overflow-y-auto py-4 sm:overflow-hidden sm:py-5" : "overflow-y-auto py-5 sm:py-8"}`}>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

// ─── SCREEN: Funil ────────────────────────────────────────────────────────────
type Lead = { id:number; nome:string; ini:string; score:number; fonte:string; tempo:string; tipo:string; faixa:string; urgencia:string; etapa:string };

const leadsData: Lead[] = [
  { id:1, nome:"Rafael Mendes", ini:"RM", score:94, fonte:"Indicação", tempo:"há 12 min", tipo:"Móveis planejados", faixa:"R$ 28–35k", urgencia:"urgente", etapa:"Novo lead" },
  { id:2, nome:"Camila Furtado", ini:"CF", score:88, fonte:"Indicação", tempo:"há 34 min", tipo:"Projeto arq.", faixa:"R$ 80–120k", urgencia:"1–2 meses", etapa:"Novo lead" },
  { id:3, nome:"Bruno Lacerda", ini:"BL", score:72, fonte:"Indicação", tempo:"há 1h", tipo:"Móveis planejados", faixa:"R$ 12–18k", urgencia:"urgente", etapa:"Em qualificação" },
  { id:4, nome:"Juliana Rocha", ini:"JR", score:55, fonte:"Instagram", tempo:"ontem", tipo:"Móveis planejados", faixa:"R$ 22–30k", urgencia:"sem urgência", etapa:"Em qualificação" },
  { id:5, nome:"Thiago Cavalcanti", ini:"TC", score:91, fonte:"Indicação", tempo:"há 2h", tipo:"Móveis planejados", faixa:"R$ 35–55k", urgencia:"urgente", etapa:"Qualificado" },
  { id:6, nome:"Priscila Andrade", ini:"PA", score:76, fonte:"Instagram", tempo:"ontem", tipo:"Reforma", faixa:"R$ 45–60k", urgencia:"1–2 meses", etapa:"Qualificado" },
  { id:7, nome:"Fernanda Braga", ini:"FB", score:97, fonte:"Indicação", tempo:"4 dias", tipo:"Projeto arq.", faixa:"R$ 150–200k", urgencia:"1–2 meses", etapa:"Orçamento enviado" },
  { id:8, nome:"Eduardo Siqueira", ini:"ES", score:83, fonte:"Instagram", tempo:"4 dias", tipo:"Projeto arq.", faixa:"R$ 90–130k", urgencia:"1–2 meses", etapa:"Orçamento enviado" },
  { id:9, nome:"André Fonseca", ini:"AF", score:89, fonte:"Indicação", tempo:"1 semana", tipo:"Reforma", faixa:"R$ 65–90k", urgencia:"urgente", etapa:"Em negociação" },
  { id:10, nome:"Natália Guimarães", ini:"NG", score:72, fonte:"Indicação", tempo:"1 semana", tipo:"Móveis planejados", faixa:"R$ 40–55k", urgencia:"1–2 meses", etapa:"Em negociação" },
  { id:11, nome:"Gustavo Melo", ini:"GM", score:98, fonte:"Indicação", tempo:"2 semanas", tipo:"Projeto arq.", faixa:"R$ 200k+", urgencia:"urgente", etapa:"Fechado" },
  { id:12, nome:"Isabela Torres", ini:"IT", score:81, fonte:"Instagram", tempo:"3 semanas", tipo:"Reforma", faixa:"R$ 55–70k", urgencia:"1–2 meses", etapa:"Fechado" },
];

const colunas = ["Novo lead","Em qualificação","Qualificado","Orçamento enviado","Em negociação","Fechado"];

function LeadCard({ lead, onSelect, onDragStart, onDragEnd }: { lead: Lead; onSelect: () => void; onDragStart: (event: DragEvent<HTMLButtonElement>) => void; onDragEnd: () => void }) {
  const scoreStyle = lead.score >= 90 ? "bg-bw-dourado text-white" : lead.score >= 75 ? "bg-bw-madeira text-white" : "bg-bw-areia text-bw-madeira";
  const urgStyle = lead.urgencia === "urgente" ? "!" : lead.urgencia === "1–2 meses" ? "~" : "–";

  return (
    <button
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group w-full cursor-grab bg-bw-white border border-bw-border p-2.5 text-left hover:border-bw-dourado hover:shadow-[0_5px_16px_rgba(111,78,55,0.08)] transition-all focus:outline-none focus:ring-2 focus:ring-bw-dourado/40 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="w-6 h-6 shrink-0 bg-bw-areia border border-bw-border flex items-center justify-center text-[9px] font-mono font-medium text-bw-madeira">{lead.ini}</div>
          <span className="truncate text-[11px] font-semibold text-bw-preto leading-tight">{lead.nome}</span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${scoreStyle}`}>{lead.score}</span>
      </div>
      <div className="text-[9px] font-mono text-bw-muted mb-1 uppercase tracking-wide">{lead.fonte} · {lead.tempo}</div>
      <div className="truncate text-[10px] text-bw-madeira mb-1.5">{lead.tipo}</div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-bw-preto">{lead.faixa}</span>
        <span className="text-[9px] font-mono text-bw-madeira">{urgStyle} {lead.urgencia}</span>
      </div>
    </button>
  );
}

function Funil() {
  const [filtro, setFiltro] = useState("todos");
  const [leads, setLeads] = useState(leadsData);
  const [selectedLeadId, setSelectedLeadId] = useState(leadsData[0].id);
  const [detailsLeadId, setDetailsLeadId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const filtered = filtro === "todos" ? leads : leads.filter(l => l.fonte.toLowerCase() === filtro);
  const selectedLead = leads.find(lead => lead.id === selectedLeadId) ?? leads[0];
  const detailsLead = leads.find(lead => lead.id === detailsLeadId);
  const scoreMedio = Math.round(filtered.reduce((s, l) => s + l.score, 0) / filtered.length);
  const pipelineValue = filtered.reduce((total, lead) => total + (lead.faixa.includes("200") ? 200 : Number(lead.faixa.match(/\d+/)?.[0] ?? 0)), 0);
  const moveLead = (leadId: number, etapa: string) => {
    setLeads(current => current.map(lead => lead.id === leadId ? { ...lead, etapa } : lead));
    setSelectedLeadId(leadId);
  };
  const openLeadDetails = (leadId: number) => {
    setSelectedLeadId(leadId);
    setDetailsLeadId(leadId);
  };

  return (
    <div className="mx-auto flex min-h-[42rem] w-full max-w-[1480px] flex-col overflow-hidden sm:h-full sm:min-h-0">
      <div className="flex shrink-0 flex-col gap-4 border-b border-bw-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex items-end gap-5">
          <div>
            <div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Relacionamento comercial</div>
            <h1 className="font-display text-4xl leading-none tracking-[-.04em] text-bw-preto">Funil de clientes</h1>
          </div>
          <p className="hidden max-w-[250px] border-l border-bw-border pl-5 text-[11px] leading-relaxed text-bw-muted xl:block">Priorize conversas que aproximam o projeto da decisão.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">
          <div className="hidden items-baseline gap-5 border-r border-bw-border pr-5 sm:flex">
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted">Pipeline</span>
              <span className="text-lg font-semibold leading-none tabular-nums text-bw-preto">R$ {pipelineValue}k</span>
            </div>
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted">Score médio</span>
              <span className="text-lg font-semibold leading-none tabular-nums text-bw-preto">{scoreMedio}</span>
            </div>
          </div>
          <div className="flex border border-bw-border bg-bw-white text-[10px]">
            {[["todos","Todos"],["instagram","Instagram"],["indicação","Indicação"]].map(([k,l]) => (
              <button key={k} onClick={() => setFiltro(k)} className={`px-2.5 py-2 transition-colors border-l border-bw-border first:border-l-0 ${filtro === k ? "bg-bw-preto text-bw-white" : "text-bw-madeira hover:bg-bw-hover"}`}>{l}</button>
            ))}
          </div>
          <button onClick={() => setIsNewLeadModalOpen(true)} className="bg-bw-dourado px-3 py-2 text-[10px] font-medium text-white hover:bg-bw-madeira transition-colors">+ Novo lead</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 pt-4">
        <div className="mb-3 flex items-center justify-between rounded-sm border border-bw-border-sub bg-bw-white/50 px-3 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[.16em] text-bw-muted">{filtered.length} oportunidades ativas</span>
          <span className="text-[10px] text-bw-madeira">Em foco: <button onClick={() => setDetailsLeadId(selectedLead.id)} className="font-semibold underline decoration-bw-dourado underline-offset-4">{selectedLead.nome}</button></span>
        </div>
      <div className="grid h-[32rem] grid-cols-[repeat(6,minmax(15rem,1fr))] gap-2.5 overflow-x-auto pb-2 sm:h-[calc(100%-38px)]">
        {colunas.map(col => {
          const cards = filtered.filter(l => l.etapa === col);
          return (
            <section
              key={col}
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverColumn(col);
              }}
              onDrop={event => {
                event.preventDefault();
                if (draggedLeadId !== null) moveLead(draggedLeadId, col);
                setDraggedLeadId(null);
                setDragOverColumn(null);
              }}
              className={`flex min-w-0 flex-col border transition-colors ${dragOverColumn === col ? "border-bw-dourado bg-bw-dourado/10" : "border-transparent bg-bw-white/30"}`}
            >
              <div className="flex min-h-10 items-center justify-between border-y border-bw-border px-2">
                <span className="text-[9px] font-mono uppercase tracking-[.09em] text-bw-madeira">{col}</span>
                <span className="flex h-4 min-w-4 items-center justify-center bg-bw-areia px-1 font-mono text-[9px] text-bw-madeira">{cards.length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {cards.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelect={() => openLeadDetails(lead.id)}
                    onDragStart={event => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(lead.id));
                      setDraggedLeadId(lead.id);
                      setSelectedLeadId(lead.id);
                    }}
                    onDragEnd={() => {
                      setDraggedLeadId(null);
                      setDragOverColumn(null);
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      </div>

      {detailsLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4" onClick={() => setDetailsLeadId(null)}>
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8" onClick={event => event.stopPropagation()}>
            <button onClick={() => setDetailsLeadId(null)} className="absolute right-5 top-4 text-bw-areia transition-colors hover:text-white">
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-7 flex items-center gap-4 border-b border-bw-dourado/20 pb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-bw-dourado/40 bg-bw-areia/10 font-mono text-sm text-bw-areia">{detailsLead.ini}</div>
              <div>
                <div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Detalhes da oportunidade</div>
                <h2 className="font-display text-3xl leading-none text-bw-white">{detailsLead.nome}</h2>
              </div>
            </div>

            <div className="mb-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                ["Tipo de projeto", detailsLead.tipo],
                ["Faixa de valor", detailsLead.faixa],
                ["Origem", detailsLead.fonte],
                ["Recebido", detailsLead.tempo],
                ["Urgência", detailsLead.urgencia],
                ["Score", String(detailsLead.score)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-bw-areia/60">{label}</div>
                  <div className="text-sm text-bw-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-bw-dourado/20 pt-6">
              <label className="mb-2 block font-mono text-[9px] uppercase tracking-wider text-bw-areia">Etapa do funil</label>
              <select
                value={detailsLead.etapa}
                onChange={event => moveLead(detailsLead.id, event.target.value)}
                className="w-full border-b border-bw-dourado/40 bg-transparent py-2 text-sm text-bw-white outline-none transition-colors focus:border-bw-dourado"
              >
                {colunas.map(coluna => <option key={coluna} value={coluna} className="bg-bw-preto text-bw-white">{coluna}</option>)}
              </select>
              <p className="mt-3 text-[10px] leading-relaxed text-bw-areia/60">Altere a etapa aqui ou arraste o card diretamente entre as colunas do funil.</p>
            </div>
          </div>
        </div>
      )}

      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsNewLeadModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Novo Lead</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Cadastro de oportunidade</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setIsNewLeadModalOpen(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Nome do cliente</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Contato (Telefone/Email)</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Tipo de projeto</label>
                  <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                    <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                    <option value="Móveis planejados" className="bg-bw-preto text-bw-white">Móveis planejados</option>
                    <option value="Projeto arq." className="bg-bw-preto text-bw-white">Projeto arq.</option>
                    <option value="Reforma" className="bg-bw-preto text-bw-white">Reforma</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Faixa de valor</label>
                  <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                    <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                    <option value="R$ 10–20k" className="bg-bw-preto text-bw-white">R$ 10–20k</option>
                    <option value="R$ 20–50k" className="bg-bw-preto text-bw-white">R$ 20–50k</option>
                    <option value="R$ 50–100k" className="bg-bw-preto text-bw-white">R$ 50–100k</option>
                    <option value="R$ 100k+" className="bg-bw-preto text-bw-white">R$ 100k+</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Origem</label>
                <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                  <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                  <option value="Indicação" className="bg-bw-preto text-bw-white">Indicação</option>
                  <option value="Instagram" className="bg-bw-preto text-bw-white">Instagram</option>
                  <option value="Outro" className="bg-bw-preto text-bw-white">Outro</option>
                </select>
              </div>

              <div className="mt-4">
                <button type="submit" className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Adicionar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: Financeiro ───────────────────────────────────────────────────────
function Financeiro() {
  const [tab, setTab] = useState<"resumo"|"lancamentos"|"metricas">("resumo");
  const [showLancamentoMenu, setShowLancamentoMenu] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const lancamentos = [
    { desc:"Sinal — Projeto Oliveira", tipo:"entrada", valor:8400, data:"14 ago", cat:"Projeto" },
    { desc:"Madeira MDF — Pinheiro", tipo:"saida", valor:3200, data:"13 ago", cat:"Material" },
    { desc:"Parcela final — Mendes", tipo:"entrada", valor:12600, data:"12 ago", cat:"Projeto" },
    { desc:"Mão de obra — Montagem", tipo:"saida", valor:4800, data:"10 ago", cat:"Pessoal" },
    { desc:"Ferragens e acabamentos", tipo:"saida", valor:1100, data:"09 ago", cat:"Material" },
    { desc:"Consultoria — Lima", tipo:"entrada", valor:2500, data:"08 ago", cat:"Consultoria" },
  ];
  const meses = ["Fev","Mar","Abr","Mai","Jun","Jul","Ago"];
  const rec = [42,38,55,48,62,71,87];
  const des = [28,24,35,31,40,45,52];

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-semibold text-bw-preto font-display">Controle Financeiro</h1><p className="text-[10px] font-mono text-bw-muted">Agosto 2024</p></div>
        <div className="relative">
          <button 
            onClick={() => setShowLancamentoMenu(!showLancamentoMenu)}
            className="px-3 py-1.5 bg-bw-dourado text-white rounded-md text-xs hover:bg-bw-madeira transition-colors"
          >
            + Lançamento
          </button>
          
          {showLancamentoMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLancamentoMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-bw-preto/95 backdrop-blur-md border border-bw-dourado/20 shadow-xl z-50 rounded flex flex-col py-1 overflow-hidden">
                <button 
                  onClick={() => { setShowLancamentoMenu(false); setIsManualModalOpen(true); }}
                  className="px-4 py-2.5 text-left text-[11px] font-mono text-bw-white hover:bg-bw-dourado/20 transition-colors"
                >
                  Adicionar Manualmente
                </button>
                <button 
                  onClick={() => { setShowLancamentoMenu(false); setIsImportModalOpen(true); }}
                  className="px-4 py-2.5 text-left text-[11px] font-mono text-bw-white hover:bg-bw-dourado/20 transition-colors"
                >
                  Importar Planilha
                </button>
                <div className="h-[1px] w-full bg-bw-dourado/20 my-1"></div>
                <button 
                  onClick={() => setShowLancamentoMenu(false)}
                  className="px-4 py-2.5 text-left text-[11px] font-mono text-bw-areia hover:bg-bw-dourado/20 transition-colors"
                >
                  Exportar Relatório (.csv)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Receitas (mês)" value="R$ 87.400" sub="+12% vs jul" />
        <StatCard label="Despesas (mês)" value="R$ 52.000" sub="+5% vs jul" />
        <StatCard label="Resultado líquido" value="R$ 35.400" sub="Margem 40,5%" />
      </div>
      <div className="flex gap-2">
        {(["resumo","lancamentos","metricas"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs transition-colors border ${tab===t?"bg-bw-dourado text-white border-bw-dourado":"border-bw-border text-bw-madeira hover:bg-bw-white"}`}>
            {t==="lancamentos"?"Lançamentos":t==="metricas"?"Métricas":"Resumo"}
          </button>
        ))}
      </div>
      {tab==="resumo" && (
        <div className="bg-bw-white border border-bw-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-bw-preto mb-5">Receitas vs Despesas</h3>
          <div className="flex items-end gap-4 h-40">
            {meses.map((m,i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-32">
                  <div className="flex-1 rounded-t-sm bg-bw-dourado" style={{height:`${rec[i]}%`}} />
                  <div className="flex-1 rounded-t-sm bg-bw-border" style={{height:`${des[i]}%`}} />
                </div>
                <span className="text-[9px] font-mono text-bw-muted">{m}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-5 mt-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-bw-dourado" /><span className="text-bw-madeira">Receitas</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-bw-border" /><span className="text-bw-madeira">Despesas</span></div>
          </div>
        </div>
      )}
      {tab==="lancamentos" && (
        <div className="overflow-x-auto rounded-lg border border-bw-border bg-bw-white">
          <table className="w-full min-w-[38rem] text-xs">
            <thead className="border-b border-bw-border bg-bw-areia">
              <tr>{["Descrição","Categoria","Data","Valor"].map(h=><th key={h} className="text-left px-4 py-3 font-mono text-bw-muted uppercase tracking-wider text-[10px]">{h}</th>)}</tr>
            </thead>
            <tbody>
              {lancamentos.map((l,i)=>(
                <tr key={i} className="border-b border-bw-border-sub hover:bg-bw-hover">
                  <td className="px-4 py-3 text-bw-preto">{l.desc}</td>
                  <td className="px-4 py-3"><WireTag>{l.cat}</WireTag></td>
                  <td className="px-4 py-3 font-mono text-bw-muted">{l.data}</td>
                  <td className={`px-4 py-3 font-mono font-semibold ${l.tipo==="entrada"?"text-bw-preto":"text-bw-muted"}`}>{l.tipo==="entrada"?"+":"−"} R$ {l.valor.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab==="metricas" && (
        <div className="grid md:grid-cols-2 gap-4">
          {[["Ticket médio por projeto","R$ 31.200","últimos 12 meses"],["Taxa de conversão","34%","leads → fechamentos"],["Tempo médio de venda","18 dias","lead até fechamento"],["Receita recorrente","R$ 12k/mês","clientes em manutenção"]].map(([l,v,s])=>(
            <div key={l} className="bg-bw-white border border-bw-border rounded-lg p-5">
              <div className="text-[10px] font-mono text-bw-muted uppercase tracking-wider mb-2">{l}</div>
              <div className="text-2xl font-bold text-bw-preto">{v}</div>
              <div className="text-xs text-bw-muted mt-1">{s}</div>
            </div>
          ))}
        </div>
      )}

      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Novo Lançamento</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Entrada manual</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setIsManualModalOpen(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Descrição</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: Pagamento Projeto Silva" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Valor (R$)</label>
                  <input type="number" step="0.01" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="0,00" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Data</label>
                  <input type="date" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors [color-scheme:dark]" required />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Tipo</label>
                  <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                    <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                    <option value="entrada" className="bg-bw-preto text-bw-white">Entrada</option>
                    <option value="saida" className="bg-bw-preto text-bw-white">Saída</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Categoria</label>
                  <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                    <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                    <option value="Projeto" className="bg-bw-preto text-bw-white">Projeto</option>
                    <option value="Material" className="bg-bw-preto text-bw-white">Material</option>
                    <option value="Pessoal" className="bg-bw-preto text-bw-white">Pessoal</option>
                    <option value="Consultoria" className="bg-bw-preto text-bw-white">Consultoria</option>
                    <option value="Outro" className="bg-bw-preto text-bw-white">Outro</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <button type="submit" className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Importar Planilha</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Carregar arquivo .CSV ou .XLSX</p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={e => { e.preventDefault(); setIsImportModalOpen(false); }}>
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-bw-dourado/30 rounded-lg p-8 text-center hover:border-bw-dourado/60 transition-colors cursor-pointer bg-bw-preto/50">
                <span className="text-2xl mb-3 text-bw-areia">📁</span>
                <p className="text-sm text-bw-white font-medium mb-1">Arraste e solte o arquivo aqui</p>
                <p className="text-[10px] font-mono text-bw-muted">Ou clique para procurar em seu computador</p>
                <input type="file" accept=".csv, .xlsx" className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="mt-4 bg-bw-areia text-bw-preto font-semibold py-2 px-4 text-[10px] uppercase tracking-wider cursor-pointer hover:bg-bw-white transition-colors">
                  Selecionar Arquivo
                </label>
              </div>

              <div className="flex flex-col gap-2 bg-bw-preto/50 border border-bw-dourado/10 p-4">
                <h4 className="font-mono text-[9px] uppercase tracking-wider text-bw-dourado mb-1">Como importar</h4>
                <p className="text-[10px] text-bw-muted">O arquivo deve conter as colunas: Data, Descrição, Categoria, Tipo (Entrada/Saída) e Valor.</p>
                <button type="button" className="text-[10px] text-bw-areia underline decoration-bw-dourado/50 text-left w-fit hover:text-white">Baixar modelo de exemplo</button>
              </div>

              <div className="mt-2">
                <button type="submit" className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Iniciar Importação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: Calendário ───────────────────────────────────────────────────────
function Calendario() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const events: Record<number, string[]> = { 16:["Oliveira — Montagem"],19:["Silva — Entrega"],21:["Visita Costa"],23:["Carvalho — Instalação"],26:["Reunião fornecedor"],28:["Entrega Lima"],14:["Hoje"] };
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-semibold text-bw-preto font-display">Calendário de Entregas</h1><p className="text-[10px] font-mono text-bw-muted">Agosto 2024 — Compartilhado com a equipe</p></div>
        <button onClick={() => setIsAgendarModalOpen(true)} className="px-3 py-1.5 bg-bw-dourado text-white rounded-md text-xs hover:bg-bw-madeira transition-colors">+ Agendar</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-bw-border bg-bw-white">
        <div className="min-w-[42rem]">
        <div className="grid grid-cols-7 border-b border-bw-border bg-bw-areia">
          {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d=><div key={d} className="py-2 text-center text-[10px] font-mono text-bw-muted uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {[...Array(3)].map((_,i)=><div key={`e${i}`} className="h-16 border-r border-b border-bw-border-sub" />)}
          {days.map(d=>(
            <div key={d} className={`h-16 p-1.5 border-r border-b border-bw-border-sub ${d===14?"bg-bw-areia":""}`}>
              <div className={`text-[10px] font-mono mb-1 ${d===14?"font-bold text-bw-preto":"text-bw-muted"}`}>{d}</div>
              {events[d]?.map((e,i)=><div key={i} className={`text-[9px] rounded px-1 py-0.5 truncate font-mono mb-0.5 ${d===14?"bg-bw-dourado text-white":"bg-bw-areia text-bw-madeira border border-bw-border"}`}>{e}</div>)}
            </div>
          ))}
          {[...Array(4)].map((_,i)=><div key={`f${i}`} className="h-16 border-r border-b border-bw-border-sub" />)}
        </div>
        </div>
      </div>

      {isAgendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsAgendarModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Novo Agendamento</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Marcar evento ou visita</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setIsAgendarModalOpen(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Título do Evento</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: Visita técnica" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia flex justify-between items-end">
                  <span>Vincular a um Lead (Opcional)</span>
                  <span className="text-bw-dourado/60 text-[8px]">Funil de vendas</span>
                </label>
                <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none">
                  <option value="" className="bg-bw-preto text-bw-white">Nenhum (Evento interno)</option>
                  {leadsData.map(lead => (
                    <option key={lead.id} value={lead.id} className="bg-bw-preto text-bw-white">
                      {lead.nome} — {lead.etapa} ({lead.score} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Data</label>
                  <input type="date" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors [color-scheme:dark]" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Horário</label>
                  <input type="time" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors [color-scheme:dark]" required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Tipo de Evento</label>
                <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                  <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                  <option value="reuniao" className="bg-bw-preto text-bw-white">Reunião / Apresentação</option>
                  <option value="visita" className="bg-bw-preto text-bw-white">Visita Técnica</option>
                  <option value="entrega" className="bg-bw-preto text-bw-white">Montagem / Entrega</option>
                  <option value="outro" className="bg-bw-preto text-bw-white">Outro</option>
                </select>
              </div>

              <div className="mt-4">
                <button type="submit" className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: Chatbot ──────────────────────────────────────────────────────────
const chatHistory = [
  {id:1, clientName:"Rafael Mendes", preview:"Gostei muito do trabalho...", time:"Agora", aiContext:"O cliente demonstrou alto interesse (Score 94) para fechamento rápido. Foco em móveis planejados (R$ 28–35k). Recomendo enviar o portfólio da linha 'Madeira Nobre' e sugerir uma visita técnica. Urgência declarada."},
  {id:2, clientName:"Camila Furtado", preview:"Preciso do projeto arquitetônico...", time:"2h", aiContext:"Lead qualificada, busca projeto completo (R$ 80–120k). Pede opções mais clean e iluminação natural. Agendar reunião no escritório para apresentar amostras de materiais."},
  {id:3, clientName:"Thiago Cavalcanti", preview:"Qual o valor aproximado para...", time:"Ontem", aiContext:"Aguardando resposta do orçamento de móveis planejados. Perfil analítico, focado em custo-benefício. Sugestão: oferecer um desconto de 5% à vista para acelerar o fechamento."},
];

const chatMsgs = {
  1: [
    {from:"client", text:"Olá! Gostei muito do trabalho de vocês no Instagram. Queria fazer os móveis do meu apartamento novo.", time:"10:30"},
    {from:"user", text:"Olá, Rafael! Muito obrigado. Ficamos felizes com o contato. Qual o prazo que você tem em mente para a entrega?", time:"10:35"},
    {from:"client", text:"Estou com um pouco de urgência, pego as chaves mês que vem. Vocês conseguem atender?", time:"10:36"},
    {from:"user", text:"Conseguimos sim! Temos um encaixe perfeito na nossa produção para o próximo mês. Que tal agendarmos uma visita técnica para amanhã?", time:"10:40"},
  ],
  2: [
    {from:"client", text:"Bom dia, vi que vocês fazem projetos completos. Qual o valor médio para uma casa de 200m²?", time:"09:15"},
    {from:"user", text:"Bom dia, Camila! Para uma casa de 200m², o projeto completo costuma ficar na faixa de R$ 80–120k, dependendo dos acabamentos.", time:"09:40"},
  ],
  3: [
    {from:"client", text:"Recebi o orçamento de vocês. O valor está um pouco acima do que eu esperava.", time:"14:20"},
    {from:"user", text:"Entendo, Thiago. Podemos revisar os materiais para adequar ao seu budget. Tem preferência por alguma linha específica?", time:"15:10"},
  ]
};

function Chatbot() {
  const [input, setInput] = useState("");
  const [activeChat, setActiveChat] = useState(1);
  const currentChat = chatHistory.find(c => c.id === activeChat);
  const currentMsgs = chatMsgs[activeChat as keyof typeof chatMsgs] || [];

  return (
    <div className="flex h-[calc(100svh-9.5rem)] min-h-[32rem] flex-col gap-0 overflow-hidden rounded-lg border border-bw-border sm:h-[calc(100vh-8rem)] sm:min-h-0 sm:flex-row">
      {/* History */}
      <div className="flex h-36 w-full flex-shrink-0 flex-col border-b border-bw-border bg-bw-areia sm:h-auto sm:w-64 sm:border-b-0 sm:border-r">
        <div className="p-3 border-b border-bw-border bg-bw-preto">
          <div className="text-bw-white font-display text-lg px-1">Mensagens</div>
          <p className="text-[10px] text-bw-dourado font-mono uppercase tracking-wider px-1">Leads & Clientes</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {chatHistory.map(c=>(
            <button key={c.id} onClick={()=>setActiveChat(c.id)} className={`w-full text-left px-3 py-3 rounded-md mb-1 transition-colors ${activeChat===c.id?"bg-bw-preto text-bw-white shadow-md":"hover:bg-bw-white text-bw-preto"}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${activeChat===c.id?"bg-bw-dourado":"bg-bw-madeira/40"}`}></div>
                <div className="text-xs font-semibold truncate flex-1">{c.clientName}</div>
              </div>
              <div className={`text-[10px] truncate ${activeChat===c.id?"text-bw-areia":"text-bw-muted"}`}>{c.preview}</div>
              <div className={`text-[9px] font-mono mt-1.5 ${activeChat===c.id?"text-bw-dourado/60":"text-bw-madeira/50"}`}>{c.time}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Chat */}
      <div className="flex-1 flex flex-col bg-bw-white">
        <div className="z-10 flex items-center justify-between border-b border-bw-border bg-bw-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bw-preto flex items-center justify-center text-bw-white text-[10px] font-mono font-bold">
              {currentChat?.clientName.split(" ").map(n=>n[0]).join("")}
            </div>
            <div>
              <div className="text-sm font-semibold text-bw-preto">{currentChat?.clientName}</div>
              <div className="text-[10px] font-mono text-bw-dourado">Lead Qualificado</div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#faf9f8] p-3 sm:gap-6 sm:p-6">
          {/* AI Context Block */}
          {currentChat?.aiContext && (
            <div className="bg-bw-preto/95 backdrop-blur-md rounded-xl p-4 border border-bw-dourado/30 shadow-lg mb-4 self-center max-w-2xl w-full">
              <div className="flex items-center gap-2 mb-2">
                <Icon.Bot className="w-4 h-4 text-bw-dourado" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-bw-dourado">Resumo IA & Contexto</span>
              </div>
              <p className="text-xs text-bw-areia leading-relaxed">
                {currentChat.aiContext}
              </p>
              <div className="mt-3 flex gap-2">
                <button className="text-[9px] font-mono text-bw-preto bg-bw-dourado px-2 py-1 rounded hover:bg-bw-white transition-colors">Gerar proposta baseada no perfil</button>
              </div>
            </div>
          )}

          {/* Client & User Messages */}
          {currentMsgs.map((m,i)=>(
            <div key={i} className={`flex ${m.from==="user"?"justify-end":"justify-start"} gap-3`}>
              {m.from==="client" && (
                <div className="w-6 h-6 rounded-full bg-bw-areia border border-bw-border flex items-center justify-center flex-shrink-0 mt-1 text-bw-madeira text-[8px] font-bold">
                  {currentChat?.clientName.split(" ").map(n=>n[0]).join("")}
                </div>
              )}
              <div className={`flex flex-col ${m.from==="user"?"items-end":"items-start"}`}>
                <div className={`max-w-sm lg:max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from==="user"?"bg-bw-preto text-bw-white rounded-tr-sm":"bg-bw-white text-bw-preto border border-bw-border rounded-tl-sm shadow-sm"}`}>
                  {m.text}
                </div>
                <span className="text-[9px] font-mono text-bw-muted mt-1 mx-1">{m.time}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-bw-border bg-bw-white p-3 sm:p-4">
          <div className="flex gap-2 items-center border border-bw-dourado/40 focus-within:border-bw-dourado focus-within:shadow-[0_0_0_2px_rgba(197,160,89,0.1)] rounded-lg px-4 py-2 bg-bw-white transition-all">
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Digite sua mensagem para o cliente..." className="flex-1 bg-transparent text-sm text-bw-preto placeholder-bw-ph focus:outline-none" />
            <button className="p-2 bg-bw-preto text-bw-dourado rounded-md hover:bg-bw-dourado hover:text-bw-preto transition-colors"><Icon.Send /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: Simulação ────────────────────────────────────────────────────────
function Simulacao() {
  const [room, setRoom] = useState("Residencial");
  const [style, setStyle] = useState("Contemporâneo");
  const [furniture, setFurniture] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!photoUploaded) {
      alert("Por favor, envie uma foto do ambiente primeiro.");
      return;
    }
    setIsGenerating(true);
    setGeneratedImage(null);
    
    // Simulate API delay
    setTimeout(() => {
      setIsGenerating(false);
      // Faking an AI generated interior (Unsplash placeholder matching typical interior output)
      setGeneratedImage("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop");
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold text-bw-preto font-display">Simulação de Ambiente (IA)</h1>
        <p className="text-[10px] font-mono text-bw-muted">Redesenhe espaços instantaneamente para encantar o cliente</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Painel de Configuração Simples */}
        <div className="bg-bw-white border border-bw-border rounded-lg p-5 flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-mono text-bw-muted uppercase tracking-wider mb-2">1. Foto do Cliente</div>
            {!photoUploaded ? (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-bw-dourado/30 rounded cursor-pointer hover:border-bw-dourado/60 hover:bg-bw-hover transition-colors bg-bw-white">
                <Icon.Layers className="w-5 h-5 text-bw-madeira mb-2 opacity-50" />
                <span className="text-[10px] uppercase font-semibold tracking-wider text-bw-preto">Fazer Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={() => setPhotoUploaded(true)} />
              </label>
            ) : (
              <div className="relative h-28 rounded overflow-hidden border border-bw-border group">
                <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop" alt="Upload" className="w-full h-full object-cover grayscale opacity-80" />
                <div className="absolute inset-0 bg-bw-preto/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setPhotoUploaded(false)} className="text-[9px] uppercase font-mono text-bw-white border border-bw-white/50 px-2 py-1 rounded">Trocar foto</button>
                </div>
              </div>
            )}
          </div>

          {[{label:"2. Tipo de Ambiente",opts:["Residencial","Empresarial","Varejo","Consultório"],val:room,set:setRoom},{label:"3. Estilo Desejado",opts:["Contemporâneo","Minimalista","Clássico","Industrial"],val:style,set:setStyle}].map(g=>(
            <div key={g.label}>
              <div className="text-[10px] font-mono text-bw-muted uppercase tracking-wider mb-2">{g.label}</div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {g.opts.map(o=><button key={o} onClick={()=>g.set(o)} className={`px-2 py-1.5 rounded text-[10px] text-center transition-colors border ${g.val===o?"bg-bw-dourado text-white border-bw-dourado":"border-bw-border text-bw-madeira hover:bg-bw-hover"}`}>{o}</button>)}
              </div>
            </div>
          ))}

          <div>
            <div className="text-[10px] font-mono text-bw-muted uppercase tracking-wider mb-2">4. Móvel Principal (Foco)</div>
            <input 
              type="text" 
              value={furniture} 
              onChange={e => setFurniture(e.target.value)} 
              placeholder="Ex: Mesa de reunião, Armário..." 
              className="w-full bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-preto text-sm py-1.5 outline-none transition-colors"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !photoUploaded}
            className={`w-full py-3 text-xs uppercase tracking-wider font-semibold rounded-md transition-colors ${!photoUploaded ? "bg-bw-areia text-bw-muted cursor-not-allowed" : isGenerating ? "bg-bw-preto text-bw-areia animate-pulse" : "bg-bw-preto text-bw-dourado hover:bg-bw-dourado hover:text-bw-preto"}`}
          >
            {isGenerating ? "Processando..." : "Gerar Simulação"}
          </button>
        </div>

        {/* Visualização do Resultado */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="border border-bw-border rounded-lg aspect-video bg-[#faf9f8] flex items-center justify-center relative overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-bw-dourado border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[10px] font-mono text-bw-muted uppercase tracking-wider">A IA está desenhando seu ambiente...</div>
              </div>
            ) : generatedImage ? (
              <>
                <img src={generatedImage} alt="Gerado por IA" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-bw-preto/80 backdrop-blur text-bw-white px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider">{room}</span>
                  <span className="bg-bw-dourado/90 backdrop-blur text-bw-preto px-2 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider">{style}</span>
                </div>
              </>
            ) : (
              <div className="text-center text-bw-muted p-8">
                <Icon.Layers className="w-8 h-8 opacity-20 mx-auto mb-3" />
                <div className="text-sm font-semibold text-bw-preto">Nenhuma simulação gerada</div>
                <div className="text-[10px] mt-1 max-w-[200px] mx-auto">Faça o upload da foto original, escolha o estilo e clique em gerar para ver o resultado.</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button disabled={!generatedImage} className={`flex-1 py-2 border border-bw-dourado/40 text-bw-madeira rounded-md text-xs font-semibold hover:border-bw-dourado transition-colors ${!generatedImage && "opacity-50 cursor-not-allowed"}`}>
              Baixar Imagem
            </button>
            <button disabled={!generatedImage} className={`flex-1 py-2 bg-bw-dourado text-bw-preto rounded-md text-xs font-semibold hover:bg-bw-areia transition-colors ${!generatedImage && "opacity-50 cursor-not-allowed"}`}>
              Salvar no Projeto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: Tabela de Preços ─────────────────────────────────────────────────
function TabelaPrecos() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{desc:string, unit:string, material:string, price:number, cat:string} | null>(null);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full relative">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-semibold text-bw-preto font-display">Tabela de Preços de Referência</h1><p className="text-[10px] font-mono text-bw-muted">Padronização para orçamentos</p></div>
        <div className="flex gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="px-3 py-1.5 border border-bw-border text-bw-madeira rounded-md text-xs hover:bg-bw-hover transition-colors">Exportar PDF</button>
          <button onClick={() => setIsNewItemModalOpen(true)} className="px-3 py-1.5 bg-bw-dourado text-white rounded-md text-xs hover:bg-bw-madeira transition-colors">+ Novo item</button>
        </div>
      </div>
      {[{cat:"Marcenaria Planejada",items:[["Módulo base cozinha 60cm","un","MDF 15mm",480],["Módulo aéreo cozinha 60cm","un","MDF 15mm",320],["Módulo torre forno 60cm","un","MDF 15mm",780],["Gaveta com corrediça telescópica","un","MDF + metal",180]]},{cat:"Dormitório & Closet",items:[["Roupeiro planejado (por módulo)","un","MDF 15mm",650],["Cabeceira estofada 1,80m","un","Linho + MDF",1200]]},{cat:"Mão de Obra",items:[["Montagem e instalação","h","—",120],["Visita técnica","visita","—",200],["Projeto e consultoria","projeto","—",800]]}].map(s=>(
        <div key={s.cat} className="overflow-x-auto rounded-lg border border-bw-border bg-bw-white">
          <div className="px-4 py-3 border-b border-bw-border bg-bw-areia"><span className="text-xs font-semibold text-bw-madeira">{s.cat}</span></div>
          <table className="w-full min-w-[42rem] text-xs">
            <thead className="border-b border-bw-border-sub">
              <tr>{["Descrição","Unidade","Material base","Preço referência",""].map(h=><th key={h} className="text-left px-4 py-2.5 font-mono text-bw-muted text-[10px] uppercase">{h}</th>)}</tr>
            </thead>
            <tbody>
              {s.items.map(([d,u,m,p],i)=>(
                <tr key={i} className="border-b border-bw-border-sub last:border-0 hover:bg-bw-hover">
                  <td className="px-4 py-3 text-bw-preto">{d}</td>
                  <td className="px-4 py-3 font-mono text-bw-muted">{u}</td>
                  <td className="px-4 py-3 text-bw-muted">{m}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-bw-preto">R$ {(p as number).toLocaleString()}</td>
                  <td className="px-4 py-3 text-bw-muted text-[10px] hover:text-bw-madeira cursor-pointer" onClick={() => setEditingItem({desc: d as string, unit: u as string, material: m as string, price: p as number, cat: s.cat})}>Editar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Editar Item</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Atualizar tabela de preços</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setEditingItem(null); }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Categoria</label>
                <select defaultValue={editingItem.cat} className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                  <option value="Marcenaria Planejada" className="bg-bw-preto text-bw-white">Marcenaria Planejada</option>
                  <option value="Dormitório & Closet" className="bg-bw-preto text-bw-white">Dormitório & Closet</option>
                  <option value="Mão de Obra" className="bg-bw-preto text-bw-white">Mão de Obra</option>
                  <option value="Outro" className="bg-bw-preto text-bw-white">Nova Categoria...</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Descrição do item</label>
                <input type="text" defaultValue={editingItem.desc} className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Material Base</label>
                <input type="text" defaultValue={editingItem.material} className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Unidade</label>
                  <select defaultValue={editingItem.unit} className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                    <option value="un" className="bg-bw-preto text-bw-white">un (Unidade)</option>
                    <option value="m2" className="bg-bw-preto text-bw-white">m² (Metro quadrado)</option>
                    <option value="ml" className="bg-bw-preto text-bw-white">ml (Metro linear)</option>
                    <option value="h" className="bg-bw-preto text-bw-white">h (Hora)</option>
                    <option value="visita" className="bg-bw-preto text-bw-white">visita (Visita)</option>
                    <option value="projeto" className="bg-bw-preto text-bw-white">projeto (Projeto)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Preço Ref. (R$)</label>
                  <input type="number" step="0.01" defaultValue={editingItem.price} className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 border border-bw-dourado/30 text-bw-areia font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-dourado/10 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsNewItemModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Novo Item</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Adicionar à tabela de preços</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setIsNewItemModalOpen(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Categoria</label>
                <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                  <option value="" disabled selected hidden className="bg-bw-preto text-bw-white">Selecione...</option>
                  <option value="Marcenaria Planejada" className="bg-bw-preto text-bw-white">Marcenaria Planejada</option>
                  <option value="Dormitório & Closet" className="bg-bw-preto text-bw-white">Dormitório & Closet</option>
                  <option value="Mão de Obra" className="bg-bw-preto text-bw-white">Mão de Obra</option>
                  <option value="Outro" className="bg-bw-preto text-bw-white">Nova Categoria...</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Descrição do item</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: Módulo aéreo especial" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Material Base</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: MDF 15mm Branco" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Unidade</label>
                  <select className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" required>
                    <option value="un" className="bg-bw-preto text-bw-white">un (Unidade)</option>
                    <option value="m2" className="bg-bw-preto text-bw-white">m² (Metro quadrado)</option>
                    <option value="ml" className="bg-bw-preto text-bw-white">ml (Metro linear)</option>
                    <option value="h" className="bg-bw-preto text-bw-white">h (Hora)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Preço Ref. (R$)</label>
                  <input type="number" step="0.01" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="0,00" />
                </div>
              </div>

              <div className="mt-4">
                <button type="submit" className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 text-center shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="w-16 h-16 mx-auto bg-bw-areia/10 border border-bw-dourado/30 rounded-full flex items-center justify-center mb-5 text-bw-dourado">
              <Icon.Tag />
            </div>

            <h2 className="font-display text-2xl text-bw-white mb-2">Exportar Tabela</h2>
            <p className="text-xs text-bw-muted mb-6">Selecione o formato para download do referencial de preços atualizado.</p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors"
              >
                Gerar PDF
              </button>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="w-full border border-bw-dourado/40 text-bw-areia font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-dourado/10 transition-colors"
              >
                Exportar para Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: Rastreabilidade ──────────────────────────────────────────────────
function Rastreabilidade() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | "">("");
  const [selLoteIndex, setSelLoteIndex] = useState(0);
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState(false);

  // Simulando banco de dados com relação ao ID do Lead (Projeto)
  const lotes = [
    {id:"LOT-2024-089", leadId:11, material:"MDF Branco 15mm", origem:"Reflorestamento certificado — Paraná, BR", forn:"Pinheiro Madeiras Ltda.", cert:"FSC® COC-004321", volume:"24 chapas (83m²)", data:"02 ago 2024", status:"Em uso"},
    {id:"LOT-2024-076", leadId:12, material:"Painel Freijó 18mm", origem:"Manejo sustentável — Mato Grosso, BR", forn:"Madeireira Nobre", cert:"IBAMA 2024-MG-4412", volume:"12 chapas (40m²)", data:"15 jul 2024", status:"Em uso"},
    {id:"LOT-2024-061", leadId:11, material:"Pinus Tratado 25mm", origem:"Reflorestamento — Santa Catarina, BR", forn:"Pinheiro Madeiras Ltda.", cert:"FSC® COC-004321", volume:"8 chapas (28m²)", data:"01 jul 2024", status:"Utilizado"},
    {id:"LOT-2024-099", leadId:7, material:"Compensado Naval 18mm", origem:"Manejo Sustentável — Pará, BR", forn:"EcoMadeiras", cert:"IBAMA 2024-PA-1234", volume:"15 chapas (45m²)", data:"20 ago 2024", status:"Estoque"},
  ];

  const filteredLotes = selectedLeadId === "" ? lotes : lotes.filter(l => l.leadId === selectedLeadId);
  const s = filteredLotes[selLoteIndex] || filteredLotes[0];

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full relative">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-bw-preto font-display">Rastreabilidade de Materiais</h1>
          <p className="text-[10px] font-mono text-bw-muted">Transparência da origem ao produto final</p>
        </div>
        <button onClick={() => setIsRegistrarModalOpen(true)} className="px-3 py-1.5 bg-bw-dourado text-white rounded-md text-xs hover:bg-bw-madeira transition-colors">+ Registrar Uso</button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-bw-border bg-bw-white p-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-[10px] font-mono uppercase tracking-wider text-bw-madeira whitespace-nowrap">Filtrar por Projeto:</label>
        <select 
          value={selectedLeadId} 
          onChange={(e) => { setSelectedLeadId(e.target.value ? Number(e.target.value) : ""); setSelLoteIndex(0); }} 
          className="flex-1 bg-transparent border-b border-bw-border-sub text-bw-preto text-sm py-1.5 outline-none focus:border-bw-dourado transition-colors"
        >
          <option value="">Todos os Lotes (Estoque Geral)</option>
          {leadsData.map(lead => (
            <option key={lead.id} value={lead.id}>
              {lead.nome} — {lead.tipo}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-5 gap-5 min-h-[400px]">
        <div className="md:col-span-2 bg-bw-white border border-bw-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-bw-border bg-bw-areia flex items-center justify-between">
            <span className="text-xs font-semibold text-bw-madeira">Materiais Vinculados</span>
            <span className="text-[10px] font-mono text-bw-muted">{filteredLotes.length} reg.</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredLotes.length === 0 ? (
              <div className="p-8 text-center text-sm text-bw-muted">Nenhum material registrado para este projeto.</div>
            ) : (
              filteredLotes.map((l,i)=>(
                <button key={i} onClick={()=>setSelLoteIndex(i)} className={`w-full text-left px-4 py-3 border-b border-bw-border-sub last:border-0 hover:bg-bw-hover transition-colors ${selLoteIndex===i?"border-l-2 border-l-bw-dourado pl-3.5 bg-bw-areia/30":""}`}>
                  <div className="flex items-start justify-between">
                    <div><div className="font-mono text-[10px] text-bw-muted">{l.id}</div><div className="text-xs font-medium text-bw-preto mt-0.5">{l.material}</div><div className="text-[10px] text-bw-muted">{l.forn}</div></div>
                    <WireTag status={l.status==="Em uso"?"info":l.status==="Estoque"?"warn":"ok"}>{l.status}</WireTag>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-3 bg-bw-white border border-bw-border rounded-lg p-6 flex flex-col gap-4">
          {s ? (
            <>
              <div className="flex items-start justify-between pb-4 border-b border-bw-border">
                <div>
                  <div className="font-mono text-[10px] text-bw-muted mb-1">{s.id}</div>
                  <div className="text-lg font-semibold text-bw-preto font-display">{s.material}</div>
                  <div className="text-xs text-bw-madeira mt-1">Vinculado a: <strong>{leadsData.find(ld => ld.id === s.leadId)?.nome || "Não vinculado"}</strong></div>
                </div>
                <WireTag status={s.status==="Em uso"?"info":s.status==="Estoque"?"warn":"ok"}>{s.status}</WireTag>
              </div>
              <div className="grid gap-x-6 gap-y-4 pt-2 sm:grid-cols-2">
                {[["Origem",s.origem],["Fornecedor",s.forn],["Certificação",s.cert],["Volume Utilizado",s.volume],["Data de Registro",s.data]].map(([l,v])=>(
                  <div key={l} className="flex flex-col gap-1">
                    <div className="text-[9px] font-mono text-bw-muted uppercase tracking-wider">{l}</div>
                    <div className="text-xs text-bw-preto font-medium">{v}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-bw-muted gap-2">
              <Icon.Map className="w-8 h-8 opacity-20" />
              <p className="text-sm">Selecione um lote para visualizar os detalhes.</p>
            </div>
          )}
        </div>
      </div>

      {isRegistrarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button 
              onClick={() => setIsRegistrarModalOpen(false)}
              className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>

            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">Registrar Uso de Material</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Vincular lote a um projeto</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setIsRegistrarModalOpen(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Projeto (Cliente)</label>
                <select 
                  defaultValue={selectedLeadId}
                  className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors appearance-none rounded-none" 
                  required
                >
                  <option value="" disabled hidden className="bg-bw-preto text-bw-white">Selecione o projeto...</option>
                  {leadsData.map(lead => (
                    <option key={lead.id} value={lead.id} className="bg-bw-preto text-bw-white">
                      {lead.nome} — {lead.tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Lote do Fornecedor</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: LOT-2024-105" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Material / Madeira</label>
                <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: Carvalho Maciço 20mm" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Volume Utilizado</label>
                  <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" required placeholder="Ex: 5 chapas" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-bw-areia">Certificação</label>
                  <input type="text" className="bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors" placeholder="FSC, IBAMA..." />
                </div>
              </div>

              <div className="mt-4">
                <button type="submit" className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors">
                  Vincular Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: Mapa de Descarte ─────────────────────────────────────────────────
function MapaDescarte() {
  const pontos = [
    {nome:"Ecoponto Morumbi",end:"R. Princesa Isabel, 150",dist:"2,3 km",horario:"Seg–Sáb 8h–18h",aceita:["MDF","Aglomerado","Aparas"]},
    {nome:"Cooperativa Madeira Verde",end:"Av. das Nações Unidas, 5.400",dist:"8,1 km",horario:"Seg–Sex 7h–17h",aceita:["Madeira sólida","Paletes","Estruturas"]},
    {nome:"Aterro Industrial Classe II",end:"Rod. dos Imigrantes, km 22",dist:"24 km",horario:"Ter, Qui, Sáb",aceita:["MDF","Laminado","Resíduos"]},
    {nome:"Empresa Recicla Móveis",end:"R. Funchal, 418 — Vila Olímpia",dist:"4,7 km",horario:"Seg–Sex 8h–18h",aceita:["Móveis","MDF","Ferragens"]},
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full relative">
      <div>
        <div><h1 className="text-2xl font-semibold text-bw-preto font-display">Mapa de Descarte Adequado</h1><p className="text-[10px] font-mono text-bw-muted">Locais e formas corretas de descarte de resíduos</p></div>
      </div>

      {/* Map visualization */}
      <div className="bg-bw-white border border-bw-border rounded-lg h-64 overflow-hidden relative group">
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
          alt="Mapa da região" 
          className="w-full h-full object-cover opacity-60 grayscale contrast-125 mix-blend-multiply transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bw-white/80 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-4 left-4 bg-bw-white/90 backdrop-blur-sm px-3 py-2 border border-bw-border rounded shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bw-dourado"></span>
            <span className="text-[10px] font-mono font-semibold text-bw-preto uppercase tracking-wider">Região Ativa (SP)</span>
          </div>
        </div>
        
        {/* Fake Map Pins */}
        <div className="absolute top-[30%] left-[45%] group-hover:scale-110 transition-transform">
          <div className="w-4 h-4 bg-bw-preto rounded-full border-2 border-bw-white shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-bw-dourado rounded-full"></div>
          </div>
        </div>
        <div className="absolute top-[60%] left-[25%] group-hover:scale-110 transition-transform delay-75">
          <div className="w-4 h-4 bg-bw-preto rounded-full border-2 border-bw-white shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-bw-dourado rounded-full"></div>
          </div>
        </div>
        <div className="absolute top-[45%] left-[75%] group-hover:scale-110 transition-transform delay-150">
          <div className="w-4 h-4 bg-bw-preto rounded-full border-2 border-bw-white shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-bw-dourado rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {pontos.map((p,i)=>(
          <div key={i} className="bg-bw-white border border-bw-border rounded-lg p-4 transition-all hover:border-bw-dourado hover:shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-bw-preto">{p.nome}</span>
              <WireTag status="ok">Ativo</WireTag>
            </div>
            <div className="text-[10px] font-mono text-bw-muted mb-1">{p.end} · {p.dist}</div>
            <div className="text-[10px] text-bw-muted mb-3">⏰ {p.horario}</div>
            <div className="flex flex-wrap gap-1">
              {p.aceita.map(a=><WireTag key={a}>{a}</WireTag>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN: Configurações da Conta ──────────────────────────────────────────
type AccountSection = "perfil" | "endereco" | "seguranca";

const defaultAccountData = {
  empresa: "BW Arquitetura e Marcenaria",
  responsavel: "Bianca & Walmir",
  email: "",
  telefone: "",
  documento: "12.345.678/0001-95",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "São Paulo",
  estado: "SP",
};

const defaultAccountNotifications = {
  oportunidades: true,
  agenda: true,
  resumo: false,
};

function loadAccountData() {
  try {
    const stored = JSON.parse(localStorage.getItem("bw-account") ?? "{}");
    return { ...defaultAccountData, ...stored, documento: stored.documento || defaultAccountData.documento };
  } catch {
    return defaultAccountData;
  }
}

function loadAccountNotifications() {
  try {
    return { ...defaultAccountNotifications, ...JSON.parse(localStorage.getItem("bw-account-notifications") ?? "{}") };
  } catch {
    return defaultAccountNotifications;
  }
}

type AdminUser = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  funcao: string;
  status: "Ativo" | "Convite enviado" | "Inativo";
};

const initialAdminUsers: AdminUser[] = [
  { id: 1, nome: "Bianca Alves", email: "bianca@bwarquitetura.com.br", cpf: "***.482.***-**", funcao: "Administradora", status: "Ativo" },
  { id: 2, nome: "Walmir Santos", email: "walmir@bwarquitetura.com.br", cpf: "***.715.***-**", funcao: "Administrador", status: "Ativo" },
  { id: 3, nome: "Lívia Moraes", email: "livia@bwarquitetura.com.br", cpf: "***.039.***-**", funcao: "Operações", status: "Convite enviado" },
];

function UsuariosAdmin() {
  const [users, setUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [form, setForm] = useState({ nome: "", email: "", cpf: "", funcao: "Administradora" });
  const [message, setMessage] = useState("");
  const cpfDigits = form.cpf.replace(/\D/g, "");
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
      .replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3")
      .replace(/^(\d{3})(\d{3})$/, "$1.$2")
      .replace(/^(\d{3})$/, "$1");
  };
  const maskCpf = (value: string) => `***.${value.slice(3, 6)}.***-**`;
  const addUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || cpfDigits.length !== 11) {
      setMessage("Preencha nome, e-mail e um CPF válido com 11 dígitos.");
      return;
    }
    if (users.some(user => user.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setMessage("Já existe um acesso administrativo para este e-mail.");
      return;
    }
    setUsers(current => [...current, {
      id: Date.now(),
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      cpf: maskCpf(cpfDigits),
      funcao: form.funcao,
      status: "Convite enviado",
    }]);
    setForm({ nome: "", email: "", cpf: "", funcao: "Administradora" });
    setMessage("Convite enviado. A pessoa receberá as instruções de acesso por e-mail.");
  };
  const toggleUser = (id: number) => {
    setUsers(current => current.map(user => user.id === id && user.status !== "Convite enviado" ? { ...user, status: user.status === "Ativo" ? "Inativo" : "Ativo" } : user));
  };
  const fieldClass = "w-full border-0 border-b border-bw-border-sub bg-transparent px-0 py-2.5 text-sm text-bw-preto outline-none transition-colors placeholder:text-bw-ph focus:border-bw-dourado";
  const labelClass = "font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-5 border-b border-bw-border pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Acesso interno</div>
          <h1 className="font-display text-4xl leading-none tracking-[-.04em] text-bw-preto">Administradores</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bw-muted">Gerencie quem pode acessar a operação BW. Cada acesso administrativo é pessoal e identificado por CPF.</p>
        </div>
        <div className="flex items-center gap-2 border border-bw-dourado/25 bg-bw-dourado/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[.12em] text-bw-madeira"><Icon.Users /> {users.filter(user => user.status === "Ativo").length} acessos ativos</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden border border-bw-border bg-bw-white bw-panel">
          <div className="flex items-center justify-between gap-4 border-b border-bw-border px-5 py-4 sm:px-6">
            <div><h2 className="font-display text-2xl text-bw-preto">Equipe com acesso</h2><p className="mt-1 text-xs text-bw-muted">Acesso é liberado individualmente e pode ser desativado a qualquer momento.</p></div>
          </div>
          <div className="divide-y divide-bw-border-sub">
            {users.map(user => (
              <article key={user.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-bw-dourado/30 bg-bw-areia font-mono text-[10px] font-medium text-bw-madeira">{user.nome.split(" ").slice(0, 2).map(part => part[0]).join("")}</div>
                  <div className="min-w-0"><div className="truncate text-sm font-medium text-bw-preto">{user.nome}</div><div className="mt-0.5 truncate text-[11px] text-bw-muted">{user.email}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-bw-madeira">CPF {user.cpf} · {user.funcao}</div></div>
                </div>
                <div className="flex shrink-0 items-center gap-3"><span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[.1em] ${user.status === "Ativo" ? "text-bw-dourado" : "text-bw-muted"}`}><span className={`h-1.5 w-1.5 rounded-full ${user.status === "Ativo" ? "bg-bw-dourado" : "bg-bw-muted"}`} />{user.status}</span>{user.status !== "Convite enviado" && <button onClick={() => toggleUser(user.id)} className="border border-bw-border px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-bw-madeira transition-colors hover:border-bw-dourado hover:bg-bw-hover">{user.status === "Ativo" ? "Desativar" : "Reativar"}</button>}</div>
              </article>
            ))}
          </div>
        </section>

        <aside className="self-start border border-bw-dourado/25 bg-bw-preto p-5 text-bw-white shadow-xl">
          <div className="mb-6 border-b border-white/10 pb-5"><div className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Novo acesso</div><h2 className="font-display text-2xl">Adicionar administrador</h2><p className="mt-2 text-xs leading-relaxed text-bw-areia/60">O cadastro administrativo aceita somente CPF. O CNPJ permanece exclusivo da conta BW.</p></div>
          <form onSubmit={addUser} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">Nome completo</span><input value={form.nome} onChange={event => { setForm(current => ({ ...current, nome: event.target.value })); setMessage(""); }} placeholder="Nome da pessoa" className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-bw-dourado" /></label>
            <label className="flex flex-col gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">E-mail profissional</span><input type="email" value={form.email} onChange={event => { setForm(current => ({ ...current, email: event.target.value })); setMessage(""); }} placeholder="nome@empresa.com" className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-bw-dourado" /></label>
            <label className="flex flex-col gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">CPF</span><input inputMode="numeric" value={form.cpf} onChange={event => { setForm(current => ({ ...current, cpf: formatCpf(event.target.value) })); setMessage(""); }} placeholder="000.000.000-00" className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-bw-dourado" /><span className="text-[9px] leading-relaxed text-bw-areia/45">CPF é obrigatório para vincular uma pessoa ao acesso interno.</span></label>
            <label className="flex flex-col gap-1.5"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-areia/55">Área de atuação</span><select value={form.funcao} onChange={event => setForm(current => ({ ...current, funcao: event.target.value }))} className="border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-sm text-white outline-none focus:border-bw-dourado"><option className="bg-bw-preto" value="Administradora">Administradora</option><option className="bg-bw-preto" value="Administrador">Administrador</option><option className="bg-bw-preto" value="Operações">Operações</option></select></label>
            {message && <div role="status" className={`flex items-start gap-2 border px-3 py-2.5 text-[10px] leading-relaxed ${message.startsWith("Convite") ? "border-bw-dourado/40 bg-bw-dourado/10 text-bw-areia" : "border-white/20 bg-white/5 text-bw-areia/75"}`}>{message.startsWith("Convite") ? <Icon.Check /> : <Icon.AlertCircle />}{message}</div>}
            <button type="submit" className="mt-1 bg-bw-dourado px-4 py-3 text-[10px] font-medium uppercase tracking-[.16em] text-white transition-colors hover:bg-[#c19d65]">Enviar convite ↗</button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function ConfiguracoesConta() {
  const [section, setSection] = useState<AccountSection>("perfil");
  const [saved, setSaved] = useState(false);
  const [account, setAccount] = useState(loadAccountData);
  const [notifications, setNotifications] = useState(loadAccountNotifications);
  const [cnpjVerification, setCnpjVerification] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityError, setSecurityError] = useState("");
  const normalizeDocument = (value: string) => value.replace(/\D/g, "");
  const maskCnpj = (value: string) => {
    const digits = normalizeDocument(value);
    return digits.length === 14 ? `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}` : "**.***.***/****-**";
  };
  const isCnpjVerified = normalizeDocument(cnpjVerification) === normalizeDocument(account.documento);

  const updateAccount = (field: keyof typeof account, value: string) => {
    setAccount(current => ({ ...current, [field]: value }));
    setSaved(false);
  };
  const saveChanges = (event: React.FormEvent) => {
    event.preventDefault();
    const isChangingPassword = Boolean(currentPassword || newPassword || confirmPassword);
    if (section === "seguranca" && isChangingPassword) {
      if (!isCnpjVerified) {
        setSecurityError("Confirme corretamente o CNPJ da empresa para alterar a senha.");
        setSaved(false);
        return;
      }
      if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
        setSecurityError("Confira a senha atual e informe a nova senha com pelo menos 8 caracteres nos dois campos.");
        setSaved(false);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCnpjVerification("");
    }
    localStorage.setItem("bw-account", JSON.stringify(account));
    localStorage.setItem("bw-account-notifications", JSON.stringify(notifications));
    setSecurityError("");
    setSaved(true);
  };
  const cancelChanges = () => {
    setAccount(loadAccountData());
    setNotifications(loadAccountNotifications());
    setCnpjVerification("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityError("");
    setSaved(false);
  };
  const fieldClass = "w-full border-0 border-b border-bw-border-sub bg-transparent px-0 py-2.5 text-sm text-bw-preto outline-none transition-colors placeholder:text-bw-ph focus:border-bw-dourado";
  const labelClass = "font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-bw-border pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Conta BW</div>
          <h1 className="font-display text-4xl leading-none tracking-[-.04em] text-bw-preto">Informações da conta</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-bw-muted">Consulte e atualize os dados da empresa, endereço, preferências e acesso à plataforma.</p>
        </div>
        {saved && (
          <div className="flex shrink-0 items-center gap-2 border border-bw-dourado/30 bg-bw-dourado/10 px-3 py-2 text-[10px] font-medium text-bw-madeira">
            <Icon.Check /> Alterações salvas
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="self-start border border-bw-dourado/20 bg-bw-preto/95 p-5 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center gap-3 border-b border-bw-dourado/20 pb-5">
            <div className="flex h-11 w-11 items-center justify-center border border-bw-dourado/40 bg-bw-areia/10 font-display text-lg text-bw-areia">BW</div>
            <div>
              <div className="text-sm font-medium text-bw-white">BW Arquitetura</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-bw-dourado">Conta administrativa</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {([
              ["perfil", "Dados da empresa"],
              ["endereco", "Endereço"],
              ["seguranca", "Segurança e avisos"],
            ] as [AccountSection, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setSection(id); setSaved(false); }}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors ${section === id ? "bg-bw-dourado text-white" : "text-bw-areia hover:bg-white/10"}`}
              >
                {label}
                <Icon.Chevron />
              </button>
            ))}
          </div>
          <div className="mt-7 border-t border-bw-dourado/20 pt-5">
            <div className="font-mono text-[9px] uppercase tracking-wider text-bw-areia/50">Plano atual</div>
            <div className="mt-1 flex items-center justify-between text-xs text-bw-areia">
              <span>BW Profissional</span>
              <WireTag status="ok">Ativo</WireTag>
            </div>
          </div>
        </aside>

        <form onSubmit={saveChanges} className="border border-bw-border bg-bw-white p-6 shadow-sm sm:p-8">
          {section === "perfil" && (
            <div>
              <div className="mb-7 border-b border-bw-border pb-5">
                <h2 className="font-display text-2xl text-bw-preto">Dados da empresa</h2>
                <p className="mt-1 text-xs text-bw-muted">Informações utilizadas para identificar a conta da BW.</p>
              </div>
              <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelClass}>Nome da empresa</span>
                  <input value={account.empresa} onChange={event => updateAccount("empresa", event.target.value)} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Responsáveis</span>
                  <input value={account.responsavel} onChange={event => updateAccount("responsavel", event.target.value)} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>CNPJ</span>
                  <input value={maskCnpj(account.documento)} readOnly aria-readonly="true" className={`${fieldClass} cursor-not-allowed bg-bw-areia/50 text-bw-muted`} />
                  <span className="mt-1 text-[9px] leading-relaxed text-bw-muted">Este dado não pode ser alterado pela plataforma. Em caso de correção, entre em contato com o suporte.</span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>E-mail principal</span>
                  <input type="email" value={account.email} onChange={event => updateAccount("email", event.target.value)} placeholder="Informe o e-mail da conta" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Telefone</span>
                  <input value={account.telefone} onChange={event => updateAccount("telefone", event.target.value)} placeholder="(00) 00000-0000" className={fieldClass} />
                </label>
              </div>
            </div>
          )}

          {section === "endereco" && (
            <div>
              <div className="mb-7 border-b border-bw-border pb-5">
                <h2 className="font-display text-2xl text-bw-preto">Endereço comercial</h2>
                <p className="mt-1 text-xs text-bw-muted">Mantenha os dados de localização e correspondência atualizados.</p>
              </div>
              <div className="grid gap-x-7 gap-y-6 sm:grid-cols-6">
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelClass}>CEP</span>
                  <input value={account.cep} onChange={event => updateAccount("cep", event.target.value)} placeholder="00000-000" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-4">
                  <span className={labelClass}>Endereço</span>
                  <input value={account.endereco} onChange={event => updateAccount("endereco", event.target.value)} placeholder="Rua, avenida ou alameda" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelClass}>Número</span>
                  <input value={account.numero} onChange={event => updateAccount("numero", event.target.value)} placeholder="Número" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-4">
                  <span className={labelClass}>Complemento</span>
                  <input value={account.complemento} onChange={event => updateAccount("complemento", event.target.value)} placeholder="Sala, conjunto ou referência" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelClass}>Bairro</span>
                  <input value={account.bairro} onChange={event => updateAccount("bairro", event.target.value)} placeholder="Bairro" className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-3">
                  <span className={labelClass}>Cidade</span>
                  <input value={account.cidade} onChange={event => updateAccount("cidade", event.target.value)} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-1">
                  <span className={labelClass}>UF</span>
                  <input value={account.estado} maxLength={2} onChange={event => updateAccount("estado", event.target.value.toUpperCase())} className={fieldClass} />
                </label>
              </div>
            </div>
          )}

          {section === "seguranca" && (
            <div>
              <div className="mb-7 border-b border-bw-border pb-5">
                <h2 className="font-display text-2xl text-bw-preto">Segurança e avisos</h2>
                <p className="mt-1 text-xs text-bw-muted">Atualize sua senha e escolha quais comunicações deseja receber.</p>
              </div>
              <div className="mb-7 border border-bw-dourado/25 bg-bw-dourado/5 p-4">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-[.14em] text-bw-dourado">Verificação da empresa</div>
                <p className="mb-4 text-xs leading-relaxed text-bw-muted">Para liberar a alteração de senha, informe o CNPJ cadastrado na conta.</p>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>CNPJ da empresa</span>
                  <input
                    value={cnpjVerification}
                    onChange={event => {
                      setCnpjVerification(event.target.value);
                      setSecurityError("");
                      setSaved(false);
                    }}
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                    className={fieldClass}
                  />
                </label>
                {cnpjVerification && (
                  <div className={`mt-3 flex items-center gap-2 text-[10px] ${isCnpjVerified ? "text-bw-dourado" : "text-bw-muted"}`}>
                    {isCnpjVerified ? <Icon.Check /> : <Icon.AlertCircle />}
                    {isCnpjVerified ? "CNPJ confirmado. A alteração de senha foi liberada." : "O CNPJ informado não corresponde ao cadastro."}
                  </div>
                )}
              </div>
              <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelClass}>Senha atual</span>
                  <input type="password" value={currentPassword} onChange={event => { setCurrentPassword(event.target.value); setSecurityError(""); }} disabled={!isCnpjVerified} autoComplete="current-password" placeholder={isCnpjVerified ? "Digite sua senha atual" : "Confirme o CNPJ primeiro"} className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Nova senha</span>
                  <input type="password" value={newPassword} onChange={event => { setNewPassword(event.target.value); setSecurityError(""); }} disabled={!isCnpjVerified} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Confirmar nova senha</span>
                  <input type="password" value={confirmPassword} onChange={event => { setConfirmPassword(event.target.value); setSecurityError(""); }} disabled={!isCnpjVerified} autoComplete="new-password" placeholder="Repita a nova senha" className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`} />
                </label>
              </div>
              {securityError && (
                <div className="mt-5 flex items-start gap-2 border border-bw-border bg-bw-areia p-3 text-[10px] leading-relaxed text-bw-madeira">
                  <Icon.AlertCircle /> <span>{securityError}</span>
                </div>
              )}
              <div className="mt-8 border-t border-bw-border pt-6">
                <div className="mb-4 font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted">Notificações por e-mail</div>
                <div className="flex flex-col gap-3">
                  {([
                    ["oportunidades", "Novas oportunidades e movimentações no funil"],
                    ["agenda", "Lembretes de compromissos e entregas"],
                    ["resumo", "Resumo semanal da operação"],
                  ] as [keyof typeof notifications, string][]).map(([id, label]) => (
                    <label key={id} className="flex cursor-pointer items-center justify-between gap-4 border-b border-bw-border-sub pb-3 text-sm text-bw-madeira">
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={notifications[id]}
                        onChange={event => {
                          setNotifications(current => ({ ...current, [id]: event.target.checked }));
                          setSaved(false);
                        }}
                        className="h-4 w-4 accent-bw-dourado"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-9 flex flex-col gap-3 border-t border-bw-border pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={cancelChanges} className="w-full border border-bw-border px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider text-bw-madeira transition-colors hover:bg-bw-hover sm:w-auto">Cancelar</button>
            <button type="submit" className="w-full bg-bw-dourado px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-bw-madeira sm:w-auto">Salvar alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const platformScreens: Screen[] = ["funil","financeiro","calendario","chatbot","simulacao","tabela-precos","rastreabilidade","descarte","usuarios-admin","configuracoes"];

export default function App() {
  const [screen, setScreen] = useState<Screen>("institucional");
  const [clienteTipo, setClienteTipo] = useState<ClienteTipo>("pf");

  function handleClientLogin(tipo: ClienteTipo) {
    setClienteTipo(tipo);
    setScreen("portal-cliente");
  }

  if (screen === "institucional") return <SiteInstitucionalPremium onNav={setScreen} />;
  if (screen === "login") return <Login onNav={setScreen} onClientLogin={handleClientLogin} />;
  if (screen === "cadastro") return <Cadastro onNav={setScreen} onClientLogin={handleClientLogin} />;
  if (screen === "portal-cliente") return <PortalCliente tipo={clienteTipo} onNav={setScreen} />;
  if (platformScreens.includes(screen)) return <PlatformShell screen={screen} onNav={setScreen} />;
  return <SiteInstitucionalPremium onNav={setScreen} />;
}
