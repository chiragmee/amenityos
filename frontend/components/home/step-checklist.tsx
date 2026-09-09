export function StepChecklist({
  labels,
  step,
  mobile = false,
}: {
  labels: string[];
  step: number;
  mobile?: boolean;
}) {
  const dot = mobile ? "w-4 h-4" : "w-[18px] h-[18px]";
  const textSize = mobile ? "text-[13px]" : "text-sm";
  const rowPad = mobile ? "py-[7px]" : "py-[9px]";

  return (
    <div className="flex flex-col gap-[2px]">
      {labels.map((label, i) => {
        const done = step > i;
        const active = step === i;
        return (
          <div
            key={label}
            className={`flex items-center gap-[11px] ${rowPad} ${textSize} ${
              done
                ? "text-text-secondary"
                : active
                  ? "text-text font-medium"
                  : "text-[#b4b4ac]"
            }`}
          >
            {done ? (
              <span
                className={`${dot} rounded-full bg-accent text-white flex items-center justify-center text-[10px]`}
              >
                ✓
              </span>
            ) : active ? (
              <span
                className={`${dot} rounded-full border-2 border-spinner-track border-t-accent animate-spin-slow`}
              />
            ) : (
              <span className={`${dot} rounded-full border border-border`} />
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
}
