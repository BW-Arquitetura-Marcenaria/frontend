type FeedbackMessageProps = {
  message: string;
  tone?: "error" | "success";
  className?: string;
};

export default function FeedbackMessage({ message, tone = "error", className = "" }: FeedbackMessageProps) {
  return <div role={tone === "error" ? "alert" : "status"} className={`${tone === "error" ? "border-red-400/40 bg-red-400/10 text-red-700" : "border-bw-dourado/40 bg-bw-dourado/10 text-bw-madeira"} rounded-md border px-4 py-3 text-sm ${className}`}>
    {message}
  </div>;
}
