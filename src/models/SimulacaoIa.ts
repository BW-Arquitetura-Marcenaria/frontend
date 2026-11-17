// Simulação de Ambiente por IA (FLUX.2 [flex]) — contratos de entrada/saída.
// A geração é opcional e aditiva: usa a foto real do ambiente + os parâmetros
// do projeto (medidas, acabamentos, extras) + uma descrição livre do cliente.

export type FluxAspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3";

export const FLUX_ASPECT_RATIOS: { id: FluxAspectRatio; label: string }[] = [
  { id: "16:9", label: "Paisagem (16:9)" },
  { id: "4:3", label: "Paisagem (4:3)" },
  { id: "1:1", label: "Quadrada (1:1)" },
  { id: "3:4", label: "Retrato (3:4)" },
  { id: "9:16", label: "Retrato (9:16)" },
];

export type SimulacaoFluxRequest = {
  /** Imagem do ambiente enviada pelo cliente, em data URL (base64). */
  imagemBase64: string;
  /** Prompt em pt-BR montado a partir do projeto e da descrição livre. */
  prompt: string;
  /** Proporção desejada para a imagem gerada. */
  aspectRatio?: FluxAspectRatio;
};

export type SimulacaoFluxResponse = {
  /** Imagem resultante — pode vir como URL remota ou data URL. */
  imagemUrl: string;
  /** Semente usada na geração, para reprodutibilidade (opcional). */
  seed?: number;
  /** Revisão do modelo de IA usado (opcional). */
  modelo?: string;
};