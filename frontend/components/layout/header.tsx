"use client";

import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { crumbFor } from "./nav-config";

export function Header() {
  const pathname = usePathname();
  const { credits } = useAppState();

  return (
    <header className="flex items-center gap-4 px-5 md:px-[34px] py-4 border-b border-border-subtle bg-[rgba(250,250,248,.86)] backdrop-blur-[6px] sticky top-0 z-20">
      <div className="flex items-center gap-2 md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/nookly-mark.svg" alt="" className="w-6 h-6" />
      </div>
      <div className="text-xs tracking-[.04em] uppercase text-text-disabled hidden md:block">
        {crumbFor(pathname)}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-[7px] px-[10px] py-[5px] border border-border rounded-full bg-surface text-xs text-text-secondary">
        <span className="w-[6px] h-[6px] rounded-full bg-accent" />
        {credits} credits
      </div>
    </header>
  );
}
