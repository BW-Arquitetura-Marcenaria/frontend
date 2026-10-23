import { useEffect } from "react";

type ConfirmDeleteModalProps = {
  title: string;
  itemName: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  title,
  itemName,
  description,
  loading = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [loading, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bw-preto/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden border border-bw-dourado/20 bg-bw-preto/95 p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-5 top-4 font-mono text-[10px] uppercase tracking-wider text-bw-areia/60 transition-colors hover:text-white disabled:opacity-40"
        >
          Fechar
        </button>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10 text-red-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          </svg>
        </div>

        <div className="mb-7">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[.2em] text-bw-dourado">Ação irreversível</p>
          <h2 id="delete-modal-title" className="font-display text-3xl leading-none text-bw-white">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-bw-areia/65">{description}</p>
          <div className="mt-4 border-l-2 border-bw-dourado bg-bw-areia/5 px-4 py-3 text-sm font-medium text-bw-white">{itemName}</div>
        </div>

        {error && <div className="mb-5 border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-bw-dourado/30 py-3 text-xs font-semibold uppercase tracking-wider text-bw-areia transition-colors hover:bg-bw-dourado/10 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 border border-red-400/50 bg-red-400/10 py-3 text-xs font-semibold uppercase tracking-wider text-red-200 transition-colors hover:bg-red-400/20 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Excluindo..." : "Excluir definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}
