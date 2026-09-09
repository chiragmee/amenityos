function bars(n: number, max: number) {
  return Array.from({ length: n }, (_, i) => {
    const seed = Math.sin(i * 1.7) * 0.5 + 0.5;
    return {
      h: Math.round(8 + seed * max),
      s: (0.7 + (i % 5) * 0.12).toFixed(2),
      d: ((i % 7) * 0.09).toFixed(2),
    };
  });
}

export function Waveform({ mobile = false }: { mobile?: boolean }) {
  const data = mobile ? bars(16, 52) : bars(24, 64);
  return (
    <div
      className={`flex items-center justify-center gap-[3px] ${
        mobile ? "h-[70px]" : "h-[82px]"
      }`}
    >
      {data.map((b, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-accent animate-wf"
          style={{
            height: `${b.h}px`,
            animationDuration: `${b.s}s`,
            animationDelay: `${b.d}s`,
          }}
        />
      ))}
    </div>
  );
}
