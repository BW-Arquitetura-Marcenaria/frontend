import type { AreaMovel } from "@/models/Simulacao";

export type ImagemCarregada = { dataUrl: string; width: number; height: number };

function carregarElemento(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = src;
  });
}

function lerArquivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona mantendo proporção, com lados múltiplos de 8
 * (exigência do Stable Diffusion) e exporta em JPEG.
 */
export async function redimensionar(src: string, maxLado: number, qualidade = 0.9): Promise<ImagemCarregada> {
  const img = await carregarElemento(src);
  const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(64, Math.floor((img.naturalWidth * escala) / 8) * 8);
  const height = Math.max(64, Math.floor((img.naturalHeight * escala) / 8) * 8);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", qualidade), width, height };
}

export async function carregarFoto(file: File): Promise<ImagemCarregada> {
  if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem (JPG, PNG ou WEBP).");
  if (file.size > 25 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 25 MB.");
  return redimensionar(await lerArquivo(file), 1600, 0.92);
}

/** Máscara de inpainting: branco = área onde a IA desenha o móvel; preto = preserva a foto. */
export function gerarMascara(width: number, height: number, areas: AreaMovel[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  for (const a of areas) ctx.fillRect(a.x * width, a.y * height, a.w * width, a.h * height);
  return canvas.toDataURL("image/png");
}

export const semPrefixo = (dataUrl: string) => dataUrl.replace(/^data:image\/[a-z+]+;base64,/, "");

export function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao converter imagem."));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlParaBlob(src: string): Promise<Blob> {
  const resp = await fetch(src);
  return resp.blob();
}

export async function baixarImagem(src: string, nome: string) {
  let href = src;
  let revogar = false;
  if (!src.startsWith("data:")) {
    try {
      href = URL.createObjectURL(await dataUrlParaBlob(src));
      revogar = true;
    } catch {
      window.open(src, "_blank", "noopener");
      return;
    }
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revogar) setTimeout(() => URL.revokeObjectURL(href), 2000);
}
