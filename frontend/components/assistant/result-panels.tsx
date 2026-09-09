export function ResultPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-[18px] border border-accent-border bg-accent-bg-2 rounded-[10px] px-[18px] py-4 animate-rise">
      <div className="flex items-center gap-[10px]">
        <span className="w-[22px] h-[22px] rounded-full bg-accent text-white flex items-center justify-center text-[11px]">
          ✓
        </span>
        <div className="text-[15px] font-semibold tracking-[-0.2px]">{title}</div>
      </div>
      <div className="mt-2 text-[13.5px] text-[#3f5c56] leading-[1.55] pl-8 whitespace-pre-line">
        {body}
      </div>
    </div>
  );
}

export function BlockPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-[18px] border border-danger-border bg-danger-bg-2 rounded-[10px] px-[18px] py-4">
      <div className="text-[14.5px] font-semibold text-danger-dark">{title}</div>
      <div className="mt-[6px] text-[13.5px] text-danger-body leading-[1.55]">
        {body}
      </div>
    </div>
  );
}
