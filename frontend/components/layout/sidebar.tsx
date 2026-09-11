"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { activeRootFor, sidebarNav } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const active = activeRootFor(pathname);
  const { user } = useAppState();

  return (
    <aside className="hidden md:flex w-[252px] shrink-0 flex-col gap-0 bg-sidebar border-r border-border px-4 py-[22px] sticky top-0 h-screen">
      <div className="flex items-center gap-[10px] px-2 pb-[22px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/nookly-mark.svg" alt="" className="w-7 h-7" />
        <div
          className="text-[19px] font-semibold tracking-[-0.4px] text-text-primary"
          style={{ fontFamily: "var(--font-wordmark)" }}
        >
          nookly
        </div>
      </div>

      <nav className="flex flex-col gap-[2px]">
        {sidebarNav.map((item, i) =>
          "rule" in item ? (
            <div key={i} className="h-px bg-border-rule my-[10px] mx-[10px]" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={
                active === item.href
                  ? "flex items-center gap-[10px] w-full text-left px-[10px] py-[9px] rounded-[10px] bg-nav-active-bg text-nav-active-text text-[13.5px] font-medium"
                  : "flex items-center gap-[10px] w-full text-left px-[10px] py-[9px] rounded-[10px] bg-transparent text-nav-inactive-text text-[13.5px] font-normal transition-colors hover:bg-nav-hover-bg hover:text-text"
              }
            >
              <span
                className={
                  active === item.href
                    ? "w-[6px] h-[6px] rounded-full bg-accent"
                    : "w-[6px] h-[6px] rounded-full bg-nav-dot-inactive"
                }
              />
              {item.label}
            </Link>
          )
        )}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-border-rule pt-[14px] flex items-center gap-[10px]">
        <div className="w-8 h-8 rounded-full bg-avatar-bg text-avatar-text flex items-center justify-center text-[12.5px] font-semibold">
          {user?.avatarInitial ?? ""}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium">{user?.name ?? ""}</div>
          <div className="text-[11.5px] text-text-faint">{user?.org ?? ""}</div>
        </div>
        <div className="flex-1" />
        <Link
          href="/profile"
          className="border border-border bg-surface text-text-muted-2 rounded-[6px] px-2 py-[5px] text-[11.5px] hover:border-[#c9c9c1] hover:text-text"
        >
          Profile
        </Link>
      </div>
    </aside>
  );
}
