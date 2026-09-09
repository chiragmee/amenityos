import type { UIOption } from "@/lib/use-assistant-scenario";

export function OptionsList({
  title,
  options,
}: {
  title: string;
  options: UIOption[];
}) {
  return (
    <div className="mt-4 border border-border-rule rounded-[10px] overflow-hidden">
      <div className="px-[14px] py-[9px] bg-[#fafaf8] border-b border-border-hairline text-[11px] tracking-[.08em] font-mono text-text-faint-2">
        {title}
      </div>
      {options.map((o, i) => (
        <div
          key={i}
          className="flex items-center gap-[14px] px-[14px] py-[13px] border-b border-border-hairline-2 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{o.name}</div>
            <div className="mt-[3px] text-[12.5px] text-text-faint font-mono">
              {o.detail}
            </div>
          </div>
          <span className="text-[11px] tracking-[.06em] font-mono text-accent">
            {o.tag}
          </span>
          <button
            onClick={o.pick}
            className="border border-border bg-surface text-text rounded-[7px] px-3 py-[7px] text-[12.5px] font-medium hover:border-accent hover:text-accent"
          >
            Book this
          </button>
        </div>
      ))}
    </div>
  );
}
