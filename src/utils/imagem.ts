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
 * Redimensiona mantendo proporção e exporta em JPEG otimizado.
 */
export async function redimensionar(
  src: string,
  maxLado: number,
  qualidade = 0.9
): Promise<ImagemCarregada> {
  const img = await carregarElemento(src);
  const escala = Math.min(
    1,
    maxLado / Math.max(img.naturalWidth, img.naturalHeight)
  );
  const width = Math.max(64, Math.round(img.naturalWidth * escala));
  const height = Math.max(64, Math.round(img.naturalHeight * escala));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", qualidade), width, height };
}

export async function carregarFoto(file: File): Promise<ImagemCarregada> {
  if (!file.type.startsWith("image/"))
    throw new Error("Selecione um arquivo de imagem (JPG, PNG ou WEBP).");
  if (file.size > 25 * 1024 * 1024)
    throw new Error("A imagem deve ter no máximo 25 MB.");
  return redimensionar(await lerArquivo(file), 1600, 0.92);
}

export async function dataUrlParaBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) {
    const sep = src.indexOf(",");
    const meta = src.slice(5, sep);
    const corpo = src.slice(sep + 1);
    const mime = meta.split(";")[0] || "application/octet-stream";
    if (meta.includes(";base64")) {
      const bin = atob(corpo);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(corpo)], { type: mime });
  }
  const resp = await fetch(src);
  return resp.blob();
}

export async function imagemParaPngDataUrl(src: string): Promise<string> {
  const img = await carregarElemento(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 1200;
  canvas.height = img.naturalHeight || 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Contexto de canvas indisponível.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export async function baixarImagem(src: string, nome: string) {
  let href = src;
  let revogar = false;
  try {
    href = URL.createObjectURL(await dataUrlParaBlob(src));
    revogar = true;
  } catch {
    if (!src.startsWith("data:")) {
      window.open(src, "_blank", "noopener");
      return;
    }
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = nome;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    if (revogar) URL.revokeObjectURL(href);
  }, 1500);
}
