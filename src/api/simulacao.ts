import type { ConfigIA, ProvedorIA, ResultadoSimulacao } from "@/models/Simulacao";
import { blobParaDataUrl, semPrefixo } from "@/utils/imagem";

// Provedores 100% open source:
//  • sd-webui     → AUTOMATIC1111 / Forge / SD.Next rodando na máquina da BW (--api).
//                   Usa a FOTO do cliente (img2img), com máscara (inpainting) e ControlNet opcional.
//  • pollinations → https://pollinations.ai (projeto open source, sem chave). Gera imagens
//                   conceito com FLUX a partir dos campos; não preserva a foto do cliente.

const base = (url: string) => url.trim().replace(/\/+$/, "");
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const seedAleatoria = () => Math.floor(Math.random() * 2_147_483_647);

export type GerarEntrada = {
  config: ConfigIA;
  prompt: string;
  negativo: string;
  width: number;
  height: number;
  quantidade: number;
  seed: number | null;
  intensidade: number;
  imagem: string | null; // dataURL da foto já redimensionada
  mascara: string | null; // dataURL PNG (branco = área do móvel)
  signal?: AbortSignal;
  onProgresso?: (atual: number, total: number) => void;
};

function erroDeRede(err: unknown, url: string): Error {
  if (err instanceof DOMException && err.name === "AbortError") return new Error("Geração cancelada.");
  if (err instanceof TypeError) {
    return new Error(
      `Não foi possível conectar em ${url}. Verifique se o Stable Diffusion WebUI está rodando com "--api --cors-allow-origins=${window.location.origin}".`
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

// ─── Stable Diffusion WebUI (AUTOMATIC1111 / Forge) ──────────────────────────
export async function testarStableDiffusion(url: string): Promise<{ modelo: string; modelos: string[] }> {
  const b = base(url);
  try {
    const [optsResp, modelosResp] = await Promise.all([fetch(`${b}/sdapi/v1/options`), fetch(`${b}/sdapi/v1/sd-models`)]);
    if (!optsResp.ok || !modelosResp.ok) throw new Error(`O servidor respondeu ${optsResp.status}. A API está habilitada (--api)?`);
    const opts = await optsResp.json();
    const modelos: { model_name: string }[] = await modelosResp.json();
    return { modelo: opts?.sd_model_checkpoint ?? "desconhecido", modelos: modelos.map((m) => m.model_name) };
  } catch (err) {
    throw erroDeRede(err, b);
  }
}

export async function progressoStableDiffusion(url: string): Promise<{ progresso: number; eta: number } | null> {
  try {
    const resp = await fetch(`${base(url)}/sdapi/v1/progress?skip_current_image=true`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return { progresso: Number(data?.progress ?? 0), eta: Number(data?.eta_relative ?? 0) };
  } catch {
    return null;
  }
}

export async function interromperStableDiffusion(url: string): Promise<void> {
  try {
    await fetch(`${base(url)}/sdapi/v1/interrupt`, { method: "POST" });
  } catch {
    // ignora: a requisição principal já será abortada
  }
}

async function gerarStableDiffusion(e: GerarEntrada): Promise<ResultadoSimulacao[]> {
  if (!e.imagem) throw new Error("Envie a foto do ambiente do cliente para usar o servidor Stable Diffusion.");
  const b = base(e.config.sdUrl);
  const foto = semPrefixo(e.imagem);
  const seed = e.seed ?? -1;

  const body: Record<string, unknown> = {
    init_images: [foto],
    prompt: e.prompt,
    negative_prompt: e.negativo,
    denoising_strength: e.intensidade,
    steps: e.config.steps,
    cfg_scale: e.config.cfg,
    sampler_name: e.config.sampler,
    width: e.width,
    height: e.height,
    batch_size: e.quantidade,
    n_iter: 1,
    seed,
  };

  if (e.mascara) {
    Object.assign(body, {
      mask: semPrefixo(e.mascara),
      mask_blur: 8,
      inpainting_fill: 1, // parte do conteúdo original (mantém luz e perspectiva)
      inpaint_full_res: false,
      inpainting_mask_invert: 0,
    });
  }

  if (e.config.controlNet) {
    // ControlNet preserva as linhas do ambiente (paredes, teto, janelas).
    body.alwayson_scripts = {
      controlnet: {
        args: [
          {
            enabled: true,
            image: foto,
            module: e.config.controlNetModulo,
            model: e.config.controlNetModelo,
            weight: 0.85,
            resize_mode: "Crop and Resize",
            pixel_perfect: true,
            control_mode: "Balanced",
          },
        ],
      },
    };
  }

  let data: { images?: string[]; info?: string; detail?: unknown; error?: string };
  try {
    const resp = await fetch(`${b}/sdapi/v1/img2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: e.signal,
    });
    data = await resp.json();
    if (!resp.ok) {
      const detalhe = typeof data?.detail === "string" ? data.detail : data?.error ?? JSON.stringify(data?.detail ?? "");
      throw new Error(`Stable Diffusion retornou ${resp.status}: ${detalhe}`);
    }
  } catch (err) {
    throw erroDeRede(err, b);
  }

  let seeds: number[] = [];
  try {
    const info = JSON.parse(data.info ?? "{}");
    seeds = Array.isArray(info.all_seeds) ? info.all_seeds : [info.seed];
  } catch {
    // info opcional
  }

  // O ControlNet anexa o mapa de detecção ao final da lista: mantemos só as variações pedidas.
  return (data.images ?? []).slice(0, e.quantidade).map((img, i) => ({
    id: novoId(),
    imagem: `data:image/png;base64,${img}`,
    seed: Number(seeds[i] ?? seeds[0] ?? seed),
    provedor: "sd-webui" as ProvedorIA,
  }));
}

// ─── Pollinations (FLUX, open source, sem chave) ────────────────────────────
async function gerarPollinations(e: GerarEntrada): Promise<ResultadoSimulacao[]> {
  const resultados: ResultadoSimulacao[] = [];
  const seedInicial = e.seed ?? seedAleatoria();

  // Sequencial: o plano anônimo aceita uma requisição por vez.
  for (let i = 0; i < e.quantidade; i++) {
    e.onProgresso?.(i, e.quantidade);
    const seed = seedInicial + i;
    const params = new URLSearchParams({
      width: String(e.width),
      height: String(e.height),
      seed: String(seed),
      model: "flux",
      nologo: "true",
      private: "true",
      negative_prompt: e.negativo,
    });
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(e.prompt)}?${params}`;

    let imagem = url;
    try {
      const resp = await fetch(url, { signal: e.signal });
      if (!resp.ok) throw new Error(`Pollinations respondeu ${resp.status}. Aguarde alguns segundos e tente novamente.`);
      imagem = await blobParaDataUrl(await resp.blob());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw new Error("Geração cancelada.");
      if (!(err instanceof TypeError)) throw err;
      // CORS bloqueado: usamos a URL direta (a imagem continua visível e baixável).
    }
    resultados.push({ id: novoId(), imagem, seed, provedor: "pollinations" });
  }
  e.onProgresso?.(e.quantidade, e.quantidade);
  return resultados;
}

export function gerarSimulacao(e: GerarEntrada): Promise<ResultadoSimulacao[]> {
  return e.config.provedor === "sd-webui" ? gerarStableDiffusion(e) : gerarPollinations(e);
}
