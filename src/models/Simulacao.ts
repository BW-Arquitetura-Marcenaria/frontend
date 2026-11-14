// Modelos, catálogos e helpers puros da Simulação de Ambientes com IA.
// Os rótulos ficam em português (para a equipe BW) e os fragmentos de prompt em
// inglês, idioma em que os modelos open source (Stable Diffusion / FLUX) respondem melhor.

export type Opcao = { id: string; label: string; prompt: string };
export type Material = Opcao & { cor: string; precoM2: number };

export type ProvedorIA = "sd-webui" | "pollinations";
export type Qualidade = "rapida" | "alta";

/** Retângulo normalizado (0..1) marcando onde o móvel será aplicado na foto. */
export type AreaMovel = { x: number; y: number; w: number; h: number };

export type SimulacaoParams = {
  clienteNome: string;
  leadId: number | "";
  ambiente: string;
  movel: string;
  estilo: string;
  material: string;
  materialSecundario: string; // "" = sem combinação
  puxador: string;
  detalhes: string[];
  larguraCm: number;
  alturaCm: number;
  profundidadeCm: number;
  observacoes: string;
  intensidade: number; // denoising strength 0.3 – 0.9
  variacoes: number; // 1 – 4
  qualidade: Qualidade;
  seed: number | null; // null = aleatório
};

export type ConfigIA = {
  provedor: ProvedorIA;
  sdUrl: string;
  steps: number;
  cfg: number;
  sampler: string;
  controlNet: boolean;
  controlNetModulo: string;
  controlNetModelo: string;
};

export type ResultadoSimulacao = {
  id: string;
  imagem: string; // dataURL (ou URL remota quando o CORS não permitir converter)
  seed: number;
  provedor: ProvedorIA;
};

export type Estimativa = { areaM2: number; minimo: number; maximo: number };

export type ProjetoSimulacao = {
  id: string;
  criadoEm: string;
  params: SimulacaoParams;
  prompt: string;
  original: string | null;
  resultados: ResultadoSimulacao[];
  escolhido: number;
  estimativa: Estimativa;
};

// ─── Catálogos ───────────────────────────────────────────────────────────────
export const AMBIENTES: Opcao[] = [
  { id: "cozinha", label: "Cozinha", prompt: "kitchen" },
  { id: "dormitorio", label: "Dormitório", prompt: "bedroom" },
  { id: "closet", label: "Closet", prompt: "walk-in closet" },
  { id: "sala", label: "Sala / TV", prompt: "living room" },
  { id: "home-office", label: "Home office", prompt: "home office" },
  { id: "banheiro", label: "Banheiro", prompt: "bathroom" },
  { id: "lavanderia", label: "Lavanderia", prompt: "laundry room" },
  { id: "comercial", label: "Loja / Escritório", prompt: "commercial office interior" },
];

export const MOVEIS: Opcao[] = [
  { id: "cozinha-planejada", label: "Cozinha planejada (aéreos + inferiores)", prompt: "custom built-in kitchen cabinets with upper and lower units" },
  { id: "guarda-roupa", label: "Guarda-roupa até o teto", prompt: "floor-to-ceiling built-in wardrobe with sliding doors" },
  { id: "closet-aberto", label: "Closet aberto (prateleiras e cabideiros)", prompt: "open closet system with shelves, hanging rods and drawers" },
  { id: "painel-tv", label: "Painel de TV + rack suspenso", prompt: "wall-mounted TV panel with floating media console" },
  { id: "estante", label: "Estante / nichos", prompt: "built-in bookshelf with open niches" },
  { id: "bancada-office", label: "Bancada de escritório + armários", prompt: "built-in desk with overhead cabinets and shelves" },
  { id: "gabinete-banheiro", label: "Gabinete de banheiro + espelheira", prompt: "floating bathroom vanity cabinet with mirror cabinet" },
  { id: "lavanderia", label: "Armários de lavanderia", prompt: "laundry cabinets with countertop and tall storage" },
  { id: "cabeceira", label: "Cabeceira + criados-mudos", prompt: "wood panel headboard with floating nightstands" },
];

export const ESTILOS: Opcao[] = [
  { id: "contemporaneo", label: "Contemporâneo", prompt: "contemporary" },
  { id: "minimalista", label: "Minimalista", prompt: "minimalist, clean lines" },
  { id: "japandi", label: "Japandi", prompt: "japandi, warm minimalism, natural textures" },
  { id: "escandinavo", label: "Escandinavo", prompt: "scandinavian, light and airy" },
  { id: "industrial", label: "Industrial", prompt: "industrial, black metal details" },
  { id: "classico", label: "Clássico", prompt: "classic, shaker style doors with moldings" },
  { id: "rustico", label: "Rústico moderno", prompt: "modern rustic, natural wood grain" },
];

/** Preço por m² de frente: valores referenciais, ajuste conforme a tabela da BW. */
export const MATERIAIS: Material[] = [
  { id: "branco-tx", label: "Branco TX", prompt: "matte white MDF", cor: "#F2F0EB", precoM2: 1100 },
  { id: "off-white", label: "Off-white / Areia", prompt: "warm off-white sand matte lacquer", cor: "#E6DCCB", precoM2: 1250 },
  { id: "freijo", label: "Freijó", prompt: "freijo wood veneer with warm golden wood grain", cor: "#B38A5E", precoM2: 1450 },
  { id: "carvalho", label: "Carvalho natural", prompt: "natural light oak wood veneer", cor: "#C9A578", precoM2: 1500 },
  { id: "nogueira", label: "Nogueira", prompt: "dark walnut wood veneer", cor: "#6B4A33", precoM2: 1550 },
  { id: "grafite", label: "Cinza grafite", prompt: "graphite grey matte MDF", cor: "#4A4A48", precoM2: 1200 },
  { id: "preto", label: "Preto fosco", prompt: "matte black MDF", cor: "#1E1D1B", precoM2: 1250 },
  { id: "salvia", label: "Verde sálvia", prompt: "sage green matte lacquer", cor: "#9CAF94", precoM2: 1600 },
  { id: "petroleo", label: "Azul petróleo", prompt: "deep petrol blue matte lacquer", cor: "#2F4B57", precoM2: 1600 },
];

export const PUXADORES: Opcao[] = [
  { id: "cava", label: "Perfil cava", prompt: "handleless doors with recessed finger grooves" },
  { id: "tic-tac", label: "Fecho toque (sem puxador)", prompt: "push-to-open handleless flat doors" },
  { id: "preto", label: "Puxador preto fosco", prompt: "slim matte black bar handles" },
  { id: "dourado", label: "Latão escovado", prompt: "brushed brass handles" },
  { id: "inox", label: "Inox escovado", prompt: "brushed stainless steel handles" },
];

export const DETALHES: Opcao[] = [
  { id: "led", label: "Fita LED embutida", prompt: "integrated warm LED strip lighting" },
  { id: "vidro", label: "Portas de vidro canelado", prompt: "fluted glass doors with slim aluminum frames" },
  { id: "nichos", label: "Nichos abertos", prompt: "open display niches" },
  { id: "ripado", label: "Painel ripado", prompt: "vertical wood slat panel detail" },
  { id: "tampo", label: "Tampo em quartzo", prompt: "white quartz countertop" },
  { id: "espelho", label: "Espelho integrado", prompt: "full-height mirror panel" },
];

export const NEGATIVE_PROMPT =
  "blurry, low quality, lowres, distorted perspective, warped lines, deformed furniture, bent doors, " +
  "cartoon, illustration, painting, 3d render artifacts, text, watermark, logo, people, person, " +
  "floating objects, duplicated cabinets, oversaturated, overexposed";

export const PARAMS_PADRAO: SimulacaoParams = {
  clienteNome: "",
  leadId: "",
  ambiente: "cozinha",
  movel: "cozinha-planejada",
  estilo: "contemporaneo",
  material: "freijo",
  materialSecundario: "off-white",
  puxador: "cava",
  detalhes: ["led"],
  larguraCm: 300,
  alturaCm: 240,
  profundidadeCm: 60,
  observacoes: "",
  intensidade: 0.6,
  variacoes: 2,
  qualidade: "rapida",
  seed: null,
};

export const CONFIG_PADRAO: ConfigIA = {
  provedor: "pollinations",
  sdUrl: (import.meta.env.VITE_SD_API_URL as string | undefined) || "http://127.0.0.1:7860",
  steps: 28,
  cfg: 6.5,
  sampler: "DPM++ 2M Karras",
  controlNet: false,
  controlNetModulo: "mlsd",
  controlNetModelo: "control_v11p_sd15_mlsd",
};

// ─── Helpers puros ───────────────────────────────────────────────────────────
export function encontrar<T extends Opcao>(lista: T[], id: string): T | undefined {
  return lista.find((o) => o.id === id);
}

export function montarPrompt(p: SimulacaoParams): string {
  const ambiente = encontrar(AMBIENTES, p.ambiente)?.prompt ?? "room";
  const movel = encontrar(MOVEIS, p.movel)?.prompt ?? "custom built-in furniture";
  const estilo = encontrar(ESTILOS, p.estilo)?.prompt ?? "contemporary";
  const material = encontrar(MATERIAIS, p.material)?.prompt;
  const secundario = p.materialSecundario ? encontrar(MATERIAIS, p.materialSecundario)?.prompt : undefined;
  const puxador = encontrar(PUXADORES, p.puxador)?.prompt;
  const detalhes = p.detalhes.map((id) => encontrar(DETALHES, id)?.prompt).filter(Boolean);

  const partes = [
    `photorealistic interior photograph of a ${estilo} ${ambiente} featuring ${movel}`,
    material && `main finish ${material}`,
    secundario && secundario !== material && `combined with ${secundario} accents`,
    puxador,
    ...detalhes,
    p.larguraCm > 0 && p.alturaCm > 0 &&
      `furniture approximately ${(p.larguraCm / 100).toFixed(1)} m wide and ${(p.alturaCm / 100).toFixed(1)} m tall`,
    "high-end Brazilian custom joinery, precise carpentry, realistic proportions",
    "soft natural daylight, architectural photography, sharp focus, highly detailed",
    p.observacoes.trim() && p.observacoes.trim(),
  ];
  return partes.filter(Boolean).join(", ");
}

export function calcularEstimativa(p: SimulacaoParams): Estimativa {
  const areaM2 = Math.max(0, (p.larguraCm * p.alturaCm) / 10000);
  const principal = encontrar(MATERIAIS, p.material)?.precoM2 ?? 1300;
  const secundario = p.materialSecundario ? encontrar(MATERIAIS, p.materialSecundario)?.precoM2 : undefined;
  const precoM2 = secundario ? principal * 0.7 + secundario * 0.3 : principal;
  const adicional = 1 + p.detalhes.length * 0.06 + (p.profundidadeCm > 60 ? 0.08 : 0);
  const base = areaM2 * precoM2 * adicional;
  return { areaM2, minimo: Math.round((base * 0.85) / 50) * 50, maximo: Math.round((base * 1.15) / 50) * 50 };
}

export const formatarBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function resumoProjeto(p: SimulacaoParams): string[] {
  const linhas = [
    `Ambiente: ${encontrar(AMBIENTES, p.ambiente)?.label ?? "-"}`,
    `Projeto: ${encontrar(MOVEIS, p.movel)?.label ?? "-"}`,
    `Estilo: ${encontrar(ESTILOS, p.estilo)?.label ?? "-"}`,
    `Acabamento: ${encontrar(MATERIAIS, p.material)?.label ?? "-"}${
      p.materialSecundario ? ` + ${encontrar(MATERIAIS, p.materialSecundario)?.label ?? ""}` : ""
    }`,
    `Puxador: ${encontrar(PUXADORES, p.puxador)?.label ?? "-"}`,
    `Medidas aprox.: ${p.larguraCm} × ${p.alturaCm} × ${p.profundidadeCm} cm (L × A × P)`,
  ];
  if (p.detalhes.length) {
    linhas.push(`Detalhes: ${p.detalhes.map((id) => encontrar(DETALHES, id)?.label).filter(Boolean).join(", ")}`);
  }
  return linhas;
}
