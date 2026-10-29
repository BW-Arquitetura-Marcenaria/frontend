import type { ButtonHTMLAttributes } from "react";

export default function DeleteButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`inline-flex h-8 w-8 items-center justify-center rounded text-bw-muted transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40 ${className}`}>
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
  </button>;
}
