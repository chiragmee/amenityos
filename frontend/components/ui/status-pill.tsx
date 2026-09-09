const tones = {
  accent: "text-accent border-accent-border bg-accent-bg",
  danger: "text-danger-dark border-danger-border bg-danger-bg-2",
  neutral: "text-text-faint border-border-rule bg-[#f6f6f3]",
} as const;

export function StatusPill({
  children,
  tone = "accent",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`text-[10.5px] tracking-[.07em] font-mono border rounded-full px-2 py-[3px] whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
