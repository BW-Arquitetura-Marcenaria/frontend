// Estúdio de Marcenaria BW — modelos, catálogos e cálculos puros (sem IA).
// Fluxo: modelo pronto → módulos editáveis → desenho 3D/elevação → plano de corte → orçamento → proposta.

export type Opcao = { id: string; label: string };
export type Material = Opcao & { cor: string; precoChapa: number; madeirado?: boolean };

export type TipoModulo =
  | "porta"
  | "duas-portas"
  | "gaveteiro"
  | "basculante"
  | "vidro"
  | "espelho"
  | "nicho"
  | "prateleiras"
  | "cabideiro"
  | "adega"
  | "vao"
  | "vao-geladeira";

export type Modulo = {
  id: string;
  tipo: TipoModulo;
  larguraCm: number;
  /** Altura própria (alinhada ao topo da linha). Vazio = altura da linha. */
  alturaCm?: number;
};

export type TipoLinha = "caixa" | "painel";

export type Linha = {
  id: string;
  nome: string;
  tipo: TipoLinha;
  alturaCm: number;
  profundidadeCm: number;
  /** Distância horizontal a partir da parede esquerda (cm). Padrão = 0. */
  inicioCm?: number;
  /** Distância do piso até a base do móvel (inclui rodapé). */
  elevacaoCm: number;
  tampo: boolean;
  modulos: Modulo[];
};

export type ProjetoParams = {
  clienteNome: string;
  leadId: number | "";
  ambienteNome: string;
  modelo: string;
  larguraParedeCm: number;
  peDireitoCm: number;
  materialCaixa: string;
  materialFrente: string;
  materialFrenteSuperior: string; // "" = igual à frente principal
  puxador: string;
  tampo: string;
  extras: string[];
  observacoes: string;
  linhas: Linha[];
  prazoDias: number;
  condicaoPagamento: string;
  validadeDias: number;
};

export type ConfigPrecos = {
  precoChapa: Record<string, number>;
  areaChapaM2: number;
  aproveitamentoPct: number;
  precoFundo6: number;
  fitaM: number;
  dobradica: number;
  dobradicaSoft: number;
  corredicaPar: number;
  corredicaSoftPar: number;
  puxadorAlca: number;
  perfilCavaM: number;
  fechoToque: number;
  pistao: number;
  tuboCabideiroM: number;
  ledM: number;
  fonteLed: number;
  vidroPerfilM2: number;
  espelhoM2: number;
  tampoM2: Record<string, number>;
  maoDeObraPct: number;
  instalacaoPct: number;
  margemPct: number;
  descontoAVistaPct: number;
};

export type Peca = {
  ref: string;
  descricao: string;
  materialId: string;
  espessuraMm: number;
  comprimentoMm: number;
  larguraMm: number;
  qtd: number;
  fita: string; // ex.: "1C", "4L"
  fitaMm: number; // fita por unidade
};

export type ItemOrcamento = {
  grupo: "Chapas" | "Fitas" | "Ferragens" | "Acessórios" | "Tampo";
  descricao: string;
  qtd: number;
  unidade: string;
  unitario: number;
  total: number;
};

export type Orcamento = {
  itens: ItemOrcamento[];
  materiais: number;
  maoDeObra: number;
  instalacao: number;
  custo: number;
  precoFinal: number;
  precoAVista: number;
  areaFrenteM2: number;
  totalModulos: number;
  totalChapas: number;
};

export type ProjetoSimulacao = {
  id: string;
  criadoEm: string;
  params: ProjetoParams;
  foto: string | null;
  precoFinal: number;
};

// ─── Catálogos ───────────────────────────────────────────────────────────────
export const MODELOS: (Opcao & {
  ambiente: string;
  largura: number;
  grupo: "livre" | "comercial" | "residencial";
})[] = [
  { id: "sob-medida", label: "Sob medida (criar do zero)", ambiente: "Projeto sob medida", largura: 300, grupo: "livre" },
  { id: "adega", label: "Vinícola / Adega expositora", ambiente: "Vinícola / Adega", largura: 300, grupo: "comercial" },
  { id: "expositor-loja", label: "Expositor de loja / Varejo", ambiente: "Loja / Varejo", largura: 300, grupo: "comercial" },
  { id: "balcao-caixa", label: "Balcão caixa / Atendimento", ambiente: "Balcão / Recepção", largura: 240, grupo: "comercial" },
  { id: "bar-cafe", label: "Bar / Café / Empório", ambiente: "Bar / Café", largura: 280, grupo: "comercial" },
  { id: "cozinha", label: "Cozinha linear (aéreos + balcões)", ambiente: "Cozinha", largura: 320, grupo: "residencial" },
  { id: "guarda-roupa", label: "Guarda-roupa com maleiro", ambiente: "Dormitório", largura: 240, grupo: "residencial" },
  { id: "closet", label: "Closet aberto", ambiente: "Closet", largura: 260, grupo: "residencial" },
  { id: "painel-tv", label: "Painel de TV + rack suspenso", ambiente: "Sala de TV", largura: 280, grupo: "residencial" },
  { id: "estante", label: "Estante com balcão", ambiente: "Sala / Living", largura: 260, grupo: "residencial" },
  { id: "banheiro", label: "Gabinete + espelheira", ambiente: "Banheiro", largura: 120, grupo: "residencial" },
  { id: "lavanderia", label: "Lavanderia", ambiente: "Lavanderia", largura: 200, grupo: "residencial" },
  { id: "home-office", label: "Home office (bancada + aéreos)", ambiente: "Home office", largura: 200, grupo: "residencial" },
];

export const TIPOS_MODULO: (Opcao & { curto: string })[] = [
  { id: "duas-portas", label: "2 portas", curto: "2P" },
  { id: "porta", label: "1 porta", curto: "1P" },
  { id: "gaveteiro", label: "Gaveteiro (3 gavetas)", curto: "GAV" },
  { id: "basculante", label: "Basculante", curto: "BAS" },
  { id: "vidro", label: "Vitrine / vidro (perfil alumínio)", curto: "VID" },
  { id: "espelho", label: "Porta espelhada", curto: "ESP" },
  { id: "nicho", label: "Nicho aberto", curto: "NIC" },
  { id: "prateleiras", label: "Prateleiras / expositor", curto: "PRA" },
  { id: "adega", label: "Adega / colmeia p/ garrafas", curto: "ADG" },
  { id: "cabideiro", label: "Cabideiro", curto: "CAB" },
  { id: "vao", label: "Vão livre (equipamento)", curto: "VÃO" },
  { id: "vao-geladeira", label: "Vão p/ geladeira / coluna", curto: "GEL" },
];

/** Preço por chapa 18 mm (2,75 × 1,85 m) — valores referenciais, editáveis na aba Preços. */
export const MATERIAIS: Material[] = [
  { id: "branco-tx", label: "Branco TX", cor: "#F2F0EB", precoChapa: 260 },
  { id: "off-white", label: "Off-white / Areia", cor: "#E6DCCB", precoChapa: 340 },
  { id: "freijo", label: "Freijó", cor: "#B38A5E", precoChapa: 520, madeirado: true },
  { id: "carvalho", label: "Carvalho natural", cor: "#C9A578", precoChapa: 540, madeirado: true },
  { id: "nogueira", label: "Nogueira", cor: "#6B4A33", precoChapa: 560, madeirado: true },
  { id: "grafite", label: "Cinza grafite", cor: "#4A4A48", precoChapa: 360 },
  { id: "preto", label: "Preto fosco", cor: "#1E1D1B", precoChapa: 380 },
  { id: "salvia", label: "Verde sálvia", cor: "#9CAF94", precoChapa: 420 },
  { id: "petroleo", label: "Azul petróleo", cor: "#2F4B57", precoChapa: 420 },
];

export const MATERIAL_FUNDO = { id: "fundo-6", label: "MDF Branco 6 mm (fundos)", cor: "#EEECE6" };

export const PUXADORES: (Opcao & { tipo: "cava" | "toque" | "alca"; cor: string })[] = [
  { id: "cava", label: "Perfil cava (alumínio)", tipo: "cava", cor: "#2A2826" },
  { id: "toque", label: "Fecho toque (sem puxador)", tipo: "toque", cor: "#000000" },
  { id: "alca-preta", label: "Alça preta fosca", tipo: "alca", cor: "#1B1A18" },
  { id: "alca-latao", label: "Alça latão escovado", tipo: "alca", cor: "#C8A45D" },
  { id: "alca-inox", label: "Alça inox escovado", tipo: "alca", cor: "#B9C0C6" },
];

export const TAMPOS: (Opcao & { cor: string })[] = [
  { id: "quartzo-branco", label: "Quartzo branco", cor: "#F4F3EF" },
  { id: "granito-preto", label: "Granito preto São Gabriel", cor: "#2B2A29" },
  { id: "porcelanato", label: "Porcelanato marmorizado", cor: "#E2DDD5" },
  { id: "mdf", label: "MDF no acabamento da frente", cor: "" },
];

export const EXTRAS: Opcao[] = [
  { id: "led", label: "Fita LED sob aéreos e nichos" },
  { id: "soft-close", label: "Amortecedores (soft-close)" },
  { id: "ripado", label: "Painéis ripados" },
];

export const CONFIG_PADRAO: ConfigPrecos = {
  precoChapa: Object.fromEntries(MATERIAIS.map((m) => [m.id, m.precoChapa])),
  areaChapaM2: 5.0875,
  aproveitamentoPct: 85,
  precoFundo6: 130,
  fitaM: 3.5,
  dobradica: 9,
  dobradicaSoft: 22,
  corredicaPar: 38,
  corredicaSoftPar: 95,
  puxadorAlca: 28,
  perfilCavaM: 55,
  fechoToque: 18,
  pistao: 22,
  tuboCabideiroM: 35,
  ledM: 38,
  fonteLed: 90,
  vidroPerfilM2: 750,
  espelhoM2: 320,
  tampoM2: { "quartzo-branco": 1600, "granito-preto": 750, porcelanato: 1100 },
  maoDeObraPct: 90,
  instalacaoPct: 12,
  margemPct: 35,
  descontoAVistaPct: 5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function encontrar<T extends Opcao>(lista: T[], id: string): T | undefined {
  return lista.find((o) => o.id === id);
}

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);

export const formatarBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const meio = (n: number) => Math.round(n * 2) / 2;

export const ehVao = (t: TipoModulo) => t === "vao" || t === "vao-geladeira";

/** Divide uma largura em módulos de largura parecida, alternando o padrão de tipos. */
export function distribuir(larguraCm: number, padrao: TipoModulo[], alvoCm: number): Modulo[] {
  if (larguraCm < 20) return [];
  const n = Math.max(1, Math.round(larguraCm / alvoCm));
  const base = meio(larguraCm / n);
  return Array.from({ length: n }, (_, i) => ({
    id: uid(),
    tipo: padrao[i % padrao.length],
    larguraCm: i === n - 1 ? meio(larguraCm - base * (n - 1)) : base,
  }));
}

/** Iguala as larguras dos módulos (exceto vãos) para fechar a largura da parede. */
export function redistribuirLinha(linha: Linha, larguraParedeCm: number): Linha {
  const vaos = linha.modulos.filter((m) => ehVao(m.tipo));
  const moveis = linha.modulos.filter((m) => !ehVao(m.tipo));
  if (moveis.length === 0) return linha;
  const livre = larguraParedeCm - vaos.reduce((s, m) => s + m.larguraCm, 0);
  const base = meio(livre / moveis.length);
  let i = 0;
  return {
    ...linha,
    inicioCm: 0,
    modulos: linha.modulos.map((m) => {
      if (ehVao(m.tipo)) return m;
      i++;
      return { ...m, larguraCm: i === moveis.length ? meio(livre - base * (moveis.length - 1)) : base };
    }),
  };
}

export const larguraLinha = (l: Linha) => l.modulos.reduce((s, m) => s + m.larguraCm, 0);

/** Gera as linhas (balcões, aéreos, expositores...) de um modelo pronto. */
export function gerarLinhas(modelo: string, L: number, pd: number): Linha[] {
  const linha = (p: Omit<Linha, "id">): Linha => ({ id: uid(), ...p });
  switch (modelo) {
    case "sob-medida":
      return [];
    case "adega":
      return [
        linha({ nome: "Painel fundo", tipo: "painel", alturaCm: Math.min(240, pd - 10), profundidadeCm: 2, elevacaoCm: 0, tampo: false, modulos: [{ id: uid(), tipo: "nicho", larguraCm: L }] }),
        linha({ nome: "Expositores", tipo: "caixa", alturaCm: Math.min(130, pd - 105), profundidadeCm: 35, elevacaoCm: 95, tampo: false, modulos: distribuir(L, ["adega", "vidro", "adega"], 85) }),
        linha({ nome: "Balcão degustação", tipo: "caixa", alturaCm: 72, profundidadeCm: 55, elevacaoCm: 10, tampo: true, modulos: distribuir(L, ["duas-portas", "adega", "gaveteiro"], 80) }),
      ];
    case "expositor-loja":
      return [
        linha({ nome: "Painel fundo", tipo: "painel", alturaCm: Math.min(240, pd - 10), profundidadeCm: 2, elevacaoCm: 0, tampo: false, modulos: [{ id: uid(), tipo: "nicho", larguraCm: L }] }),
        linha({ nome: "Vitrines e prateleiras", tipo: "caixa", alturaCm: Math.min(140, pd - 95), profundidadeCm: 35, elevacaoCm: 82, tampo: false, modulos: distribuir(L, ["prateleiras", "vidro", "nicho", "prateleiras"], 75) }),
        linha({ nome: "Balcão estoque", tipo: "caixa", alturaCm: 70, profundidadeCm: 45, elevacaoCm: 10, tampo: false, modulos: distribuir(L, ["duas-portas", "gaveteiro"], 80) }),
      ];
    case "balcao-caixa":
      return [
        linha({ nome: "Painel marca", tipo: "painel", alturaCm: Math.min(240, pd - 10), profundidadeCm: 2, elevacaoCm: 0, tampo: false, modulos: [{ id: uid(), tipo: "nicho", larguraCm: L }] }),
        linha({ nome: "Balcão atendimento", tipo: "caixa", alturaCm: 95, profundidadeCm: 60, elevacaoCm: 5, tampo: true, modulos: distribuir(L, ["duas-portas", "gaveteiro", "duas-portas"], 75) }),
      ];
    case "bar-cafe":
      return [
        linha({ nome: "Painel fundo", tipo: "painel", alturaCm: Math.min(240, pd - 10), profundidadeCm: 2, elevacaoCm: 0, tampo: false, modulos: [{ id: uid(), tipo: "nicho", larguraCm: L }] }),
        linha({ nome: "Aéreos bar", tipo: "caixa", alturaCm: 70, profundidadeCm: 35, elevacaoCm: Math.min(150, pd - 75), tampo: false, modulos: distribuir(L, ["vidro", "prateleiras", "adega"], 75) }),
        linha({ nome: "Balcão serviço", tipo: "caixa", alturaCm: 72, profundidadeCm: 55, elevacaoCm: 10, tampo: true, modulos: distribuir(L, ["duas-portas", "gaveteiro", "vao"], 75) }),
      ];
    case "cozinha": {
      const geladeira = L >= 260 ? 80 : 0;
      const util = L - geladeira;
      const inferior = [
        ...distribuir(util, ["gaveteiro", "duas-portas", "duas-portas"], 70),
        ...(geladeira ? [{ id: uid(), tipo: "vao-geladeira" as TipoModulo, larguraCm: geladeira }] : []),
      ];
      const superior = [
        ...distribuir(util, ["duas-portas", "duas-portas", "vidro"], 70),
        ...(geladeira ? [{ id: uid(), tipo: "basculante" as TipoModulo, larguraCm: geladeira, alturaCm: 35 }] : []),
      ];
      return [
        linha({ nome: "Aéreos", tipo: "caixa", alturaCm: 70, profundidadeCm: 35, elevacaoCm: Math.min(150, pd - 75), tampo: false, modulos: superior }),
        linha({ nome: "Balcões", tipo: "caixa", alturaCm: 72, profundidadeCm: 55, elevacaoCm: 10, tampo: true, modulos: inferior }),
      ];
    }
    case "guarda-roupa": {
      const corpo = Math.min(215, pd - 60);
      const maleiro = Math.max(0, Math.min(60, pd - 12 - 10 - corpo));
      const linhas = [
        linha({ nome: "Corpo", tipo: "caixa", alturaCm: corpo, profundidadeCm: 58, elevacaoCm: 10, tampo: false, modulos: distribuir(L, ["duas-portas"], 90) }),
      ];
      if (maleiro >= 25) {
        linhas.unshift(
          linha({ nome: "Maleiro", tipo: "caixa", alturaCm: maleiro, profundidadeCm: 58, elevacaoCm: 10 + corpo, tampo: false, modulos: distribuir(L, ["duas-portas"], 90) })
        );
      }
      return linhas;
    }
    case "closet":
      return [
        linha({ nome: "Corpo", tipo: "caixa", alturaCm: Math.min(240, pd - 12), profundidadeCm: 55, elevacaoCm: 10, tampo: false, modulos: distribuir(L, ["cabideiro", "prateleiras", "gaveteiro", "cabideiro"], 70) }),
      ];
    case "painel-tv":
      return [
        linha({ nome: "Painel", tipo: "painel", alturaCm: Math.min(240, pd - 10), profundidadeCm: 2, elevacaoCm: 0, tampo: false, modulos: [{ id: uid(), tipo: "nicho", larguraCm: L }] }),
        linha({ nome: "Rack suspenso", tipo: "caixa", alturaCm: 40, profundidadeCm: 45, elevacaoCm: 30, tampo: false, modulos: distribuir(L, ["basculante", "nicho", "basculante"], 75) }),
      ];
    case "estante":
      return [
        linha({ nome: "Estante", tipo: "caixa", alturaCm: Math.min(180, pd - 92), profundidadeCm: 30, elevacaoCm: 82, tampo: false, modulos: distribuir(L, ["prateleiras", "nicho", "prateleiras"], 80) }),
        linha({ nome: "Balcão", tipo: "caixa", alturaCm: 70, profundidadeCm: 40, elevacaoCm: 10, tampo: false, modulos: distribuir(L, ["duas-portas"], 80) }),
      ];
    case "banheiro":
      return [
        linha({ nome: "Espelheira", tipo: "caixa", alturaCm: 70, profundidadeCm: 14, elevacaoCm: 115, tampo: false, modulos: distribuir(L, ["espelho"], 60) }),
        linha({ nome: "Gabinete", tipo: "caixa", alturaCm: 50, profundidadeCm: 48, elevacaoCm: 35, tampo: true, modulos: distribuir(L, ["gaveteiro", "duas-portas"], 60) }),
      ];
    case "lavanderia":
      return [
        linha({ nome: "Aéreos", tipo: "caixa", alturaCm: 70, profundidadeCm: 35, elevacaoCm: Math.min(150, pd - 75), tampo: false, modulos: distribuir(L, ["duas-portas"], 70) }),
        linha({
          nome: "Balcões", tipo: "caixa", alturaCm: 72, profundidadeCm: 60, elevacaoCm: 10, tampo: true,
          modulos: [{ id: uid(), tipo: "vao", larguraCm: 65 }, ...distribuir(L - 65, ["duas-portas"], 65)],
        }),
      ];
    case "home-office":
      return [
        linha({ nome: "Aéreos", tipo: "caixa", alturaCm: 40, profundidadeCm: 30, elevacaoCm: 145, tampo: false, modulos: distribuir(L, ["basculante", "nicho"], 70) }),
        linha({
          nome: "Bancada", tipo: "caixa", alturaCm: 72, profundidadeCm: 55, elevacaoCm: 0, tampo: true,
          modulos: [
            { id: uid(), tipo: "gaveteiro", larguraCm: 45 },
            { id: uid(), tipo: "vao", larguraCm: Math.max(60, L - 45) },
          ],
        }),
      ];
    default:
      return [];
  }
}

export function paramsPadrao(modelo = "cozinha"): ProjetoParams {
  const m = encontrar(MODELOS, modelo) ?? MODELOS[0];
  return {
    clienteNome: "",
    leadId: "",
    ambienteNome: m.ambiente,
    modelo: m.id,
    larguraParedeCm: m.largura,
    peDireitoCm: 260,
    materialCaixa: "branco-tx",
    materialFrente: "freijo",
    materialFrenteSuperior: "off-white",
    puxador: "cava",
    tampo: "quartzo-branco",
    extras: ["led", "soft-close"],
    observacoes: "",
    linhas: gerarLinhas(m.id, m.largura, 260),
    prazoDias: 35,
    condicaoPagamento: "Entrada de 40% na assinatura + saldo em até 6x sem juros",
    validadeDias: 15,
  };
}

/** Linha "superior" usa a frente secundária (aéreos, maleiro, espelheira, estante). */
export const ehLinhaSuperior = (l: Linha) => l.elevacaoCm >= 80;

export function materialFrenteDaLinha(p: ProjetoParams, l: Linha): string {
  return ehLinhaSuperior(l) && p.materialFrenteSuperior ? p.materialFrenteSuperior : p.materialFrente;
}

export function refModulo(linhaIdx: number, modIdx: number, l: Linha) {
  const prefixo = l.nome.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || `L${linhaIdx + 1}`;
  return `${prefixo}-${String(modIdx + 1).padStart(2, "0")}`;
}

// ─── Plano de corte + ferragens + orçamento ─────────────────────────────────
const E = 18; // espessura padrão (mm)

export function calcularProjeto(p: ProjetoParams, cfg: ConfigPrecos) {
  const pecas: Peca[] = [];
  const ferr = new Map<string, { descricao: string; qtd: number; unidade: string; unitario: number; grupo: ItemOrcamento["grupo"] }>();
  const addFerr = (descricao: string, qtd: number, unidade: string, unitario: number, grupo: ItemOrcamento["grupo"] = "Ferragens") => {
    if (qtd <= 0) return;
    const atual = ferr.get(descricao);
    if (atual) atual.qtd += qtd;
    else ferr.set(descricao, { descricao, qtd, unidade, unitario, grupo });
  };
  const soft = p.extras.includes("soft-close");
  const puxador = encontrar(PUXADORES, p.puxador) ?? PUXADORES[0];
  const add = (peca: Peca) => {
    if (peca.comprimentoMm > 0 && peca.larguraMm > 0 && peca.qtd > 0) pecas.push(peca);
  };

  let areaFrente = 0;
  let totalModulos = 0;
  let ledCm = 0;
  let vidroM2 = 0;
  let espelhoM2 = 0;

  const frenteComPuxador = (larguraMm: number, qtd: number) => {
    if (puxador.tipo === "alca") addFerr(`Puxador ${puxador.label.toLowerCase()}`, qtd, "un", cfg.puxadorAlca);
    if (puxador.tipo === "toque") addFerr("Fecho toque", qtd, "un", cfg.fechoToque);
    if (puxador.tipo === "cava") addFerr("Perfil cava alumínio", (larguraMm / 1000) * qtd, "m", cfg.perfilCavaM);
  };
  const dobradicas = (alturaMm: number) => (alturaMm <= 900 ? 2 : alturaMm <= 1600 ? 3 : 4);

  p.linhas.forEach((l, li) => {
    const matFrente = materialFrenteDaLinha(p, l);
    const D = l.profundidadeCm * 10;

    if (l.tipo === "painel") {
      const W = larguraLinha(l) * 10;
      const H = l.alturaCm * 10;
      areaFrente += (W * H) / 1e6;
      add({ ref: refModulo(li, 0, l), descricao: "Painel (base)", materialId: matFrente, espessuraMm: E, comprimentoMm: H, larguraMm: W, qtd: 1, fita: "4L", fitaMm: 2 * (W + H) });
      if (p.extras.includes("ripado")) {
        const n = Math.floor(W / 40);
        add({ ref: refModulo(li, 0, l), descricao: "Ripa 20 mm", materialId: matFrente, espessuraMm: E, comprimentoMm: H, larguraMm: 20, qtd: n, fita: "2C", fitaMm: 2 * H });
      }
      return;
    }

    let tampoMm = 0;
    l.modulos.forEach((m, mi) => {
      const ref = refModulo(li, mi, l);
      const W = m.larguraCm * 10;
      const H = (m.alturaCm || l.alturaCm) * 10;
      if (m.tipo !== "vao-geladeira") tampoMm += W;
      if (ehVao(m.tipo)) return;

      totalModulos++;
      areaFrente += (W * H) / 1e6;
      const Wi = W - 2 * E;

      // Caixa
      add({ ref, descricao: "Lateral", materialId: p.materialCaixa, espessuraMm: E, comprimentoMm: H, larguraMm: D, qtd: 2, fita: "1C", fitaMm: H });
      add({ ref, descricao: "Base / topo", materialId: p.materialCaixa, espessuraMm: E, comprimentoMm: Wi, larguraMm: D, qtd: 2, fita: "1C", fitaMm: Wi });
      add({ ref, descricao: "Fundo", materialId: MATERIAL_FUNDO.id, espessuraMm: 6, comprimentoMm: H - 10, larguraMm: W - 10, qtd: 1, fita: "-", fitaMm: 0 });

      const gavetaAlta = m.tipo === "gaveteiro" && H > 1200;
      const alturaGavetas = gavetaAlta ? 800 : H;
      let prateleiras = 0;
      switch (m.tipo) {
        case "porta":
        case "duas-portas":
        case "vidro":
        case "espelho":
          prateleiras = H > 1200 ? Math.floor(H / 400) : 1;
          break;
        case "prateleiras":
          prateleiras = Math.max(2, Math.floor(H / 350));
          break;
        case "nicho":
          prateleiras = H > 600 ? 1 : 0;
          break;
        case "adega":
          prateleiras = Math.max(3, Math.floor(H / 160));
          break;
        case "cabideiro":
          prateleiras = 1;
          break;
        case "basculante":
          prateleiras = H > 500 ? 1 : 0;
          break;
        case "gaveteiro":
          prateleiras = gavetaAlta ? Math.max(1, Math.floor((H - 800) / 380)) : 0;
          break;
      }
      add({ ref, descricao: "Prateleira", materialId: p.materialCaixa, espessuraMm: E, comprimentoMm: Wi - 2, larguraMm: D - 20, qtd: prateleiras, fita: "1C", fitaMm: Wi - 2 });

      if (["nicho", "prateleiras", "vidro", "adega"].includes(m.tipo) || ehLinhaSuperior(l)) ledCm += m.larguraCm;

      // Frentes e ferragens
      const portas = (qtd: number, larguraPorta: number, altura: number) => {
        add({ ref, descricao: "Porta", materialId: matFrente, espessuraMm: E, comprimentoMm: altura - 4, larguraMm: larguraPorta - 4, qtd, fita: "4L", fitaMm: 2 * (altura + larguraPorta - 8) });
        addFerr(soft ? "Dobradiça 35 mm c/ amortecedor" : "Dobradiça 35 mm", dobradicas(altura) * qtd, "un", soft ? cfg.dobradicaSoft : cfg.dobradica);
        frenteComPuxador(larguraPorta, qtd);
      };

      switch (m.tipo) {
        case "porta":
          portas(1, W, H);
          break;
        case "duas-portas":
          portas(2, W / 2, H);
          break;
        case "basculante":
          add({ ref, descricao: "Porta basculante", materialId: matFrente, espessuraMm: E, comprimentoMm: W - 4, larguraMm: H - 4, qtd: 1, fita: "4L", fitaMm: 2 * (W + H - 8) });
          addFerr(soft ? "Dobradiça 35 mm c/ amortecedor" : "Dobradiça 35 mm", 2, "un", soft ? cfg.dobradicaSoft : cfg.dobradica);
          addFerr("Pistão a gás", 2, "un", cfg.pistao);
          frenteComPuxador(W, 1);
          break;
        case "vidro": {
          const qtd = W > 600 ? 2 : 1;
          vidroM2 += (W * H) / 1e6;
          addFerr(soft ? "Dobradiça 35 mm c/ amortecedor" : "Dobradiça 35 mm", dobradicas(H) * qtd, "un", soft ? cfg.dobradicaSoft : cfg.dobradica);
          frenteComPuxador(W / qtd, qtd);
          break;
        }
        case "espelho": {
          const qtd = W > 600 ? 2 : 1;
          espelhoM2 += (W * H) / 1e6;
          addFerr(soft ? "Dobradiça 35 mm c/ amortecedor" : "Dobradiça 35 mm", dobradicas(H) * qtd, "un", soft ? cfg.dobradicaSoft : cfg.dobradica);
          if (puxador.tipo === "toque") addFerr("Fecho toque", qtd, "un", cfg.fechoToque);
          break;
        }
        case "gaveteiro": {
          const alturas = [0.25, 0.35, 0.4].map((f) => Math.round(alturaGavetas * f));
          alturas.forEach((hf) => {
            add({ ref, descricao: "Frente de gaveta", materialId: matFrente, espessuraMm: E, comprimentoMm: W - 4, larguraMm: hf - 4, qtd: 1, fita: "4L", fitaMm: 2 * (W + hf - 8) });
            const hc = Math.max(80, hf - 60);
            const larguraCaixa = Wi - 26;
            add({ ref, descricao: "Gaveta — lateral", materialId: p.materialCaixa, espessuraMm: 15, comprimentoMm: D - 50, larguraMm: hc, qtd: 2, fita: "1C", fitaMm: D - 50 });
            add({ ref, descricao: "Gaveta — frente/traseira", materialId: p.materialCaixa, espessuraMm: 15, comprimentoMm: larguraCaixa - 30, larguraMm: hc, qtd: 2, fita: "1C", fitaMm: larguraCaixa - 30 });
            add({ ref, descricao: "Gaveta — fundo", materialId: MATERIAL_FUNDO.id, espessuraMm: 6, comprimentoMm: D - 50, larguraMm: larguraCaixa, qtd: 1, fita: "-", fitaMm: 0 });
          });
          addFerr(soft ? "Corrediça telescópica soft-close (par)" : "Corrediça telescópica (par)", 3, "par", soft ? cfg.corredicaSoftPar : cfg.corredicaPar);
          frenteComPuxador(W, 3);
          break;
        }
        case "cabideiro":
          addFerr("Tubo cabideiro oblongo", Wi / 1000, "m", cfg.tuboCabideiroM, "Acessórios");
          break;
      }
    });

    if (l.tampo && tampoMm > 0) {
      const profTampo = D + 20;
      if (p.tampo === "mdf") {
        add({ ref: `${refModulo(li, 0, l).split("-")[0]}-TP`, descricao: "Tampo engrossado", materialId: materialFrenteDaLinha(p, l), espessuraMm: E, comprimentoMm: tampoMm, larguraMm: profTampo, qtd: 2, fita: "1C", fitaMm: tampoMm });
      } else {
        const t = encontrar(TAMPOS, p.tampo);
        const m2 = (tampoMm * profTampo) / 1e6;
        addFerr(`Tampo ${t?.label ?? ""} (${l.nome.toLowerCase()})`, m2, "m²", cfg.tampoM2[p.tampo] ?? 0, "Tampo");
      }
    }
  });

  if (vidroM2 > 0) addFerr("Porta perfil alumínio + vidro canelado", vidroM2, "m²", cfg.vidroPerfilM2, "Acessórios");
  if (espelhoM2 > 0) addFerr("Espelho 4 mm lapidado", espelhoM2, "m²", cfg.espelhoM2, "Acessórios");
  if (p.extras.includes("led") && ledCm > 0) {
    addFerr("Fita LED 3000K + perfil", ledCm / 100, "m", cfg.ledM, "Acessórios");
    addFerr("Fonte / driver LED", 1, "un", cfg.fonteLed, "Acessórios");
  }

  // Chapas por material
  const itens: ItemOrcamento[] = [];
  const porMaterial = new Map<string, { area: number; fita: number }>();
  for (const pc of pecas) {
    const atual = porMaterial.get(pc.materialId) ?? { area: 0, fita: 0 };
    atual.area += (pc.comprimentoMm * pc.larguraMm * pc.qtd) / 1e6;
    atual.fita += (pc.fitaMm * pc.qtd) / 1000;
    porMaterial.set(pc.materialId, atual);
  }
  const areaUtil = cfg.areaChapaM2 * (cfg.aproveitamentoPct / 100);
  let totalChapas = 0;
  let fitaTotal = 0;
  for (const [matId, { area, fita }] of porMaterial) {
    const chapas = Math.max(1, Math.ceil(area / areaUtil));
    totalChapas += chapas;
    fitaTotal += fita;
    const ehFundo = matId === MATERIAL_FUNDO.id;
    const label = ehFundo ? MATERIAL_FUNDO.label : `MDF ${encontrar(MATERIAIS, matId)?.label ?? matId} 18 mm`;
    const unit = ehFundo ? cfg.precoFundo6 : cfg.precoChapa[matId] ?? 0;
    itens.push({ grupo: "Chapas", descricao: `${label} (${area.toFixed(2).replace(".", ",")} m²)`, qtd: chapas, unidade: "chapa", unitario: unit, total: chapas * unit });
  }
  if (fitaTotal > 0) {
    const metros = Math.ceil(fitaTotal * 1.1);
    itens.push({ grupo: "Fitas", descricao: "Fita de borda (com 10% de perda)", qtd: metros, unidade: "m", unitario: cfg.fitaM, total: metros * cfg.fitaM });
  }
  for (const f of ferr.values()) {
    const qtd = f.unidade === "un" || f.unidade === "par" ? Math.ceil(f.qtd) : Math.round(f.qtd * 100) / 100;
    itens.push({ grupo: f.grupo, descricao: f.descricao, qtd, unidade: f.unidade, unitario: f.unitario, total: qtd * f.unitario });
  }

  const materiais = itens.reduce((s, i) => s + i.total, 0);
  const maoDeObra = materiais * (cfg.maoDeObraPct / 100);
  const instalacao = materiais * (cfg.instalacaoPct / 100);
  const custo = materiais + maoDeObra + instalacao;
  const precoFinal = Math.round((custo * (1 + cfg.margemPct / 100)) / 10) * 10;
  const precoAVista = Math.round((precoFinal * (1 - cfg.descontoAVistaPct / 100)) / 10) * 10;

  const orcamento: Orcamento = {
    itens,
    materiais,
    maoDeObra,
    instalacao,
    custo,
    precoFinal,
    precoAVista,
    areaFrenteM2: areaFrente,
    totalModulos,
    totalChapas,
  };
  return { pecas, orcamento };
}

export function resumoProjeto(p: ProjetoParams): string[] {
  const frente = encontrar(MATERIAIS, p.materialFrente)?.label ?? "-";
  const sup = p.materialFrenteSuperior ? encontrar(MATERIAIS, p.materialFrenteSuperior)?.label : "";
  const temTampo = p.linhas.some((l) => l.tampo);
  const linhas = [
    `Ambiente: ${p.ambienteNome || "-"}`,
    `Projeto: ${encontrar(MODELOS, p.modelo)?.label ?? "Personalizado"}`,
    `Medidas da parede: ${p.larguraParedeCm} cm × ${p.peDireitoCm} cm (L × pé-direito)`,
    `Frentes: MDF ${frente}${sup && sup !== frente ? ` + ${sup} nas peças superiores` : ""}`,
    `Caixaria: MDF ${encontrar(MATERIAIS, p.materialCaixa)?.label ?? "-"} 18 mm`,
    `Puxador: ${encontrar(PUXADORES, p.puxador)?.label ?? "-"}`,
  ];
  if (temTampo) linhas.push(`Tampo: ${encontrar(TAMPOS, p.tampo)?.label ?? "-"}`);
  if (p.extras.length) linhas.push(`Extras: ${p.extras.map((id) => encontrar(EXTRAS, id)?.label).filter(Boolean).join(", ")}`);
  return linhas;
}

export type ResumoMaterial = {
  materialId: string;
  label: string;
  areaM2: number;
  chapas: number;
};

/** Resume as chapas e áreas (m²) por acabamento usado no projeto, sem valores financeiros. */
export function resumirMateriais(p: ProjetoParams, cfg: ConfigPrecos = CONFIG_PADRAO): ResumoMaterial[] {
  const { pecas } = calcularProjeto(p, cfg);
  const porMaterial = new Map<string, number>();
  for (const pc of pecas) {
    const area = (pc.comprimentoMm * pc.larguraMm * pc.qtd) / 1e6;
    porMaterial.set(pc.materialId, (porMaterial.get(pc.materialId) ?? 0) + area);
  }
  const areaUtil = cfg.areaChapaM2 * (cfg.aproveitamentoPct / 100);
  return [...porMaterial.entries()].map(([materialId, areaM2]) => ({
    materialId,
    label:
      materialId === MATERIAL_FUNDO.id
        ? MATERIAL_FUNDO.label
        : `MDF ${encontrar(MATERIAIS, materialId)?.label ?? materialId} 18 mm`,
    areaM2,
    chapas: Math.max(1, Math.ceil(areaM2 / areaUtil)),
  }));
}
