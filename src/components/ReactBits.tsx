import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. React Bits — SwarmCursor (Cursor de Enxame + Click Spark)
 *    Enxame de partículas douradas/areia com física de atração orbital (boids)
 *    que segue o ponteiro e emite faíscas ao clicar.
 * ───────────────────────────────────────────────────────────────────────────── */
interface SwarmParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  spring: number;
  friction: number;
}

interface ClickSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const SWARM_COLORS = ["#B08D57", "#D4B475", "#E8E1D5", "#9C7A44", "#C8A46B"];

export const SwarmCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      active: false,
      hoveringInteractive: false,
      pressed: false,
    };

    const PARTICLE_COUNT = 26;
    const particles: SwarmParticle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: mouse.x + (Math.random() - 0.5) * 40,
      y: mouse.y + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      radius: 1.2 + (i % 4) * 0.55,
      alpha: 0.35 + (1 - i / PARTICLE_COUNT) * 0.55,
      color: SWARM_COLORS[i % SWARM_COLORS.length],
      orbitRadius: 6 + (i % 7) * 3.8,
      orbitSpeed: (i % 2 === 0 ? 1 : -1) * (0.022 + (i % 5) * 0.006),
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      spring: 0.045 + (1 - i / PARTICLE_COUNT) * 0.065,
      friction: 0.82 + (i % 4) * 0.025,
    }));

    const sparks: ClickSpark[] = [];

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      if (!mouse.active) {
        mouse.active = true;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        for (const p of particles) {
          p.x = e.clientX;
          p.y = e.clientY;
        }
      }
      const targetEl = e.target as HTMLElement | null;
      mouse.hoveringInteractive = Boolean(
        targetEl?.closest("button, a, [role='button'], input, textarea, select, [data-spotlight]")
      );
    };

    const onMouseDown = (e: MouseEvent) => {
      mouse.pressed = true;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
        const speed = 2.2 + Math.random() * 3.6;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 22 + Math.random() * 10,
          size: 1.5 + Math.random() * 1.5,
          color: SWARM_COLORS[i % SWARM_COLORS.length],
        });
      }
    };

    const onMouseUp = () => {
      mouse.pressed = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });

    let rafId = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.28;
        mouse.y += (mouse.targetY - mouse.y) * 0.28;

        const orbitScale = mouse.pressed ? 0.45 : mouse.hoveringInteractive ? 1.45 : 1;

        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 28 * orbitScale);
        grad.addColorStop(0, "rgba(176, 141, 87, 0.16)");
        grad.addColorStop(1, "rgba(176, 141, 87, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 28 * orbitScale, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.angle += p.orbitSpeed * (mouse.hoveringInteractive ? 1.5 : 1);

          const anchorX = i === 0 ? mouse.targetX : particles[i - 1].x * 0.35 + mouse.targetX * 0.65;
          const anchorY = i === 0 ? mouse.targetY : particles[i - 1].y * 0.35 + mouse.targetY * 0.65;

          const desiredX = anchorX + Math.cos(p.angle) * p.orbitRadius * orbitScale;
          const desiredY = anchorY + Math.sin(p.angle) * p.orbitRadius * orbitScale;

          p.vx = (p.vx + (desiredX - p.x) * p.spring) * p.friction;
          p.vy = (p.vy + (desiredY - p.y) * p.spring) * p.friction;
          p.x += p.vx;
          p.y += p.vy;

          if (i > 0 && i < 14) {
            const prev = particles[i - 1];
            const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
            if (dist < 42) {
              ctx.strokeStyle = `rgba(176, 141, 87, ${(1 - dist / 42) * 0.18})`;
              ctx.lineWidth = 0.75;
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
            }
          }

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (mouse.hoveringInteractive ? 1.15 : 1), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += 1;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        const progress = s.life / s.maxLife;
        if (progress >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        const alpha = 1 - progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 2.4, s.y - s.vy * 2.4);
        ctx.stroke();
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9998] hidden lg:block"
    />
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. React Bits — ShinyText
 * ───────────────────────────────────────────────────────────────────────────── */
export const ShinyText: React.FC<{
  children: React.ReactNode;
  className?: string;
  speedSec?: number;
}> = ({ children, className = "", speedSec = 4.5 }) => {
  return (
    <span
      className={`bw-shiny-text inline-block ${className}`}
      style={{ animationDuration: `${speedSec}s` }}
    >
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. React Bits — SpotlightCard
 * ───────────────────────────────────────────────────────────────────────────── */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}> = ({
  children,
  className = "",
  spotlightColor = "rgba(176, 141, 87, 0.16)",
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      data-spotlight
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(460px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 68%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 4. React Bits — CountUpMetric
 * ───────────────────────────────────────────────────────────────────────────── */
export const CountUpMetric: React.FC<{
  target: number;
  prefix?: string;
  suffix?: string;
  durationSec?: number;
  className?: string;
}> = ({ target, prefix = "", suffix = "", durationSec = 1.8, className = "" }) => {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(target);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const proxy = { n: 0 };
          gsap.to(proxy, {
            n: target,
            duration: durationSec,
            ease: "power3.out",
            onUpdate: () => setVal(Math.round(proxy.n)),
          });
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationSec]);

  return (
    <span ref={elRef} className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 5. React Bits — 3D Interactive Project Carousel
 *    Carrossel 3D com perspectiva, arraste (drag/swipe) e abertura do projeto.
 * ───────────────────────────────────────────────────────────────────────────── */
export interface CarouselProjectItem {
  title: string;
  type: string;
  image: string;
  detail?: string;
}

export const ReactBitsCarousel: React.FC<{
  items: CarouselProjectItem[];
  onSelectProject: (index: number) => void;
}> = ({ items, onSelectProject }) => {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = items.length;

  const goTo = useCallback(
    (nextIndex: number) => {
      setActive(((nextIndex % total) + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => {
      setActive(curr => (curr + 1) % total);
    }, 5200);
    return () => window.clearInterval(id);
  }, [isPaused, total]);

  useEffect(() => {
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      let offset = i - active;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const absOffset = Math.abs(offset);
      const isCenter = offset === 0;
      const isAdjacent = absOffset === 1;

      const xPercent = offset * 62;
      const scale = isCenter ? 1 : isAdjacent ? 0.85 : 0.72;
      const rotateY = offset * -16;
      const zIndex = 20 - absOffset * 5;
      const opacity = isCenter ? 1 : isAdjacent ? 0.55 : 0.15;

      gsap.to(card, {
        xPercent,
        scale,
        rotateY,
        autoAlpha: opacity,
        zIndex,
        duration: 0.75,
        ease: "expo.out",
        overwrite: "auto",
      });
    });
  }, [active, total]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };

  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    dragStartX.current = null;
    dragDeltaX.current = 0;
    if (Math.abs(delta) > 42) {
      if (delta < 0) next();
      else prev();
    }
  };

  return (
    <div
      role="region"
      tabIndex={0}
      aria-roledescription="carrossel"
      aria-label="Projetos selecionados BW — use as setas esquerda e direita para navegar"
      onKeyDown={e => {
        if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectProject(active); }
      }}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        dragStartX.current = null;
      }}
      className="relative select-none rounded-sm focus-visible:outline-2 focus-visible:outline-bw-dourado"
    >
      {/* 3D Stage */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative mx-auto flex h-[430px] max-w-5xl cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing sm:h-[540px]"
        style={{ perspective: "1400px", touchAction: "pan-y" }}
      >
        {items.map((item, i) => {
          const isCurrent = i === active;
          return (
            <div
              key={item.title}
              ref={el => {
                cardRefs.current[i] = el;
              }}
              onClick={() => {
                if (Math.abs(dragDeltaX.current) > 12) return;
                if (isCurrent) onSelectProject(i);
                else goTo(i);
              }}
              className="group absolute w-[82%] max-w-[460px] cursor-pointer sm:w-[66%]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <SpotlightCard
                spotlightColor="rgba(176, 141, 87, 0.25)"
                className={`border bg-bw-preto shadow-[0_24px_55px_rgba(22,19,15,0.22)] transition-colors duration-500 ${
                  isCurrent ? "border-bw-dourado" : "border-bw-border"
                }`}
              >
                <div className="relative aspect-[4/4.6] w-full overflow-hidden bg-bw-sidebar">
                  <img
                    src={item.image}
                    alt={`${item.title} — ${item.type}`}
                    draggable={false}
                    className="h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bw-preto/90 via-bw-preto/20 to-transparent"
                  />
                  <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-bw-dourado">
                        {item.type}
                      </div>
                      <h3 className="mt-1 font-display text-3xl leading-none text-bw-white sm:text-4xl">
                        {item.title}
                      </h3>
                    </div>
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-bw-dourado/50 bg-bw-dourado/20 text-base text-bw-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-bw-dourado">
                      ↗
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          );
        })}
      </div>

      {/* Controls & Indicators */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-bw-border pt-5">
        <div aria-live="polite" className="flex items-center gap-3">
          <span className="font-display text-2xl font-medium text-bw-preto">{items[active]?.title}</span>
          <span className="text-bw-muted">—</span>
          <span className="text-sm text-bw-madeira">{items[active]?.type}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Ir para ${item.title}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === active ? "w-9 bg-bw-dourado" : "w-2.5 bg-bw-border hover:bg-bw-madeira"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Projeto anterior"
              className="grid h-10 w-10 place-items-center border border-bw-border bg-bw-white text-base text-bw-preto transition-colors hover:border-bw-dourado hover:bg-bw-dourado hover:text-white"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próximo projeto"
              className="grid h-10 w-10 place-items-center border border-bw-border bg-bw-white text-base text-bw-preto transition-colors hover:border-bw-dourado hover:bg-bw-dourado hover:text-white"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────────────────────────────────────
 * 6. Barra de Acessibilidade Dinâmica (Aula 5 SPTech — WAI-ARIA, Fontes,
 *    Alto Contraste, Escala de Cinza / Daltonismo e Redução de Movimento)
 * ───────────────────────────────────────────────────────────────────────────── */
type FontScale = "sm" | "md" | "lg" | "xl";

export const AccessibilityToolbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [fontScale, setFontScale] = useState<FontScale>(() => (localStorage.getItem("bw-a11y-font") as FontScale) || "md");
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem("bw-a11y-contrast") === "high");
  const [grayscale, setGrayscale] = useState<boolean>(() => localStorage.getItem("bw-a11y-vision") === "grayscale");
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => localStorage.getItem("bw-a11y-motion") === "reduce");
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-a11y-font", fontScale);
    localStorage.setItem("bw-a11y-font", fontScale);
  }, [fontScale]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.setAttribute("data-a11y-contrast", "high");
      localStorage.setItem("bw-a11y-contrast", "high");
    } else {
      root.removeAttribute("data-a11y-contrast");
      localStorage.removeItem("bw-a11y-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (grayscale) {
      root.setAttribute("data-a11y-vision", "grayscale");
      localStorage.setItem("bw-a11y-vision", "grayscale");
    } else {
      root.removeAttribute("data-a11y-vision");
      localStorage.removeItem("bw-a11y-vision");
    }
  }, [grayscale]);

  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) {
      root.setAttribute("data-a11y-motion", "reduce");
      localStorage.setItem("bw-a11y-motion", "reduce");
    } else {
      root.removeAttribute("data-a11y-motion");
      localStorage.removeItem("bw-a11y-motion");
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const resetAll = () => {
    setFontScale("md");
    setHighContrast(false);
    setGrayscale(false);
    setReduceMotion(false);
  };

  const hasActiveSetting = fontScale !== "md" || highContrast || grayscale || reduceMotion;

  return (
    <aside
      ref={wrapRef}
      aria-label="Opções de acessibilidade"
      className="fixed right-[10px] top-[calc(50%+36px)] z-[9995] font-body text-sm"
    >
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Painel de ajustes de acessibilidade"
          className="absolute right-[48px] top-1/2 max-h-[85vh] w-72 max-w-[calc(100vw-72px)] -translate-y-1/2 overflow-y-auto rounded-lg border border-bw-border bg-bw-preto p-4 text-bw-white shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-2.5">
            <span className="font-semibold text-bw-white">Acessibilidade</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar painel de acessibilidade"
              className="rounded px-2 py-0.5 text-xs text-bw-areia hover:bg-white/10 hover:text-white"
            >
              Fechar ✕
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="mb-1.5 text-xs font-medium text-bw-areia">Tamanho da fonte</div>
              <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Ajustar tamanho da fonte">
                {([
                  ["sm", "A-"],
                  ["md", "100%"],
                  ["lg", "A+"],
                  ["xl", "A++"],
                ] as [FontScale, string][]).map(([scale, lbl]) => (
                  <button
                    key={scale}
                    type="button"
                    aria-pressed={fontScale === scale}
                    onClick={() => setFontScale(scale)}
                    className={`rounded border py-1.5 text-xs font-semibold transition-colors ${
                      fontScale === scale
                        ? "border-bw-dourado bg-bw-dourado text-white"
                        : "border-white/20 bg-white/5 text-bw-areia hover:border-bw-dourado"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-white/15 pt-3">
              <button
                type="button"
                aria-pressed={highContrast}
                onClick={() => setHighContrast(v => !v)}
                className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  highContrast
                    ? "border-bw-dourado bg-bw-dourado text-white"
                    : "border-white/20 bg-white/5 text-bw-areia hover:border-bw-dourado"
                }`}
              >
                <span>Alto contraste</span>
                <span>{highContrast ? "Ativado ✓" : "Desativado"}</span>
              </button>

              <button
                type="button"
                aria-pressed={grayscale}
                onClick={() => setGrayscale(v => !v)}
                className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  grayscale
                    ? "border-bw-dourado bg-bw-dourado text-white"
                    : "border-white/20 bg-white/5 text-bw-areia hover:border-bw-dourado"
                }`}
              >
                <span>Escala de cinza (Daltonismo)</span>
                <span>{grayscale ? "Ativado ✓" : "Desativado"}</span>
              </button>

              <button
                type="button"
                aria-pressed={reduceMotion}
                onClick={() => setReduceMotion(v => !v)}
                className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  reduceMotion
                    ? "border-bw-dourado bg-bw-dourado text-white"
                    : "border-white/20 bg-white/5 text-bw-areia hover:border-bw-dourado"
                }`}
              >
                <span>Reduzir animações</span>
                <span>{reduceMotion ? "Ativado ✓" : "Desativado"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="w-full rounded border border-white/15 py-1.5 text-xs text-bw-areia/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        title="Acessibilidade (Fonte, Alto Contraste e Daltonismo)"
        aria-label="Abrir opções de acessibilidade (tamanho de fonte, alto contraste e daltonismo)"
        className={`relative grid h-[40px] w-[40px] place-items-center rounded-[8px] border shadow-lg transition-all ${
          open || hasActiveSetting
            ? "border-bw-dourado bg-bw-dourado text-white"
            : "border-bw-dourado/60 bg-bw-preto text-bw-white hover:border-bw-dourado hover:bg-bw-dourado"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M4 9h16M12 9v5m0 0l-3 6m3-6l3 6" />
        </svg>
        {hasActiveSetting && (
          <span
            aria-hidden="true"
            className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border border-bw-preto bg-bw-dourado"
          />
        )}
      </button>
    </aside>
  );
};
