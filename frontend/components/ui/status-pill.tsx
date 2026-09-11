const tones = {
  accent: { dot: "bg-accent", text: "text-text-primary" },
  danger: { dot: "bg-danger", text: "text-danger-dark" },
  neutral: { dot: "bg-text-disabled", text: "text-text-secondary" },
} as const;

/** Sentence-case label + a small colored dot — never color alone as the
 * status signal, per the design system's accessibility rule. */
export function StatusPill({
  children,
  tone = "accent",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  const t = tones[tone];
  return (
    <span className={`inline-flex items-center gap-[6px] text-[12.5px] font-medium whitespace-nowrap ${t.text}`}>
      <span className={`w-[6px] h-[6px] rounded-full ${t.dot}`} />
      {children}
    </span>
  );
}
