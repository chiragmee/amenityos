"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeRootFor, mobileTabs } from "./nav-config";

export function MobileTabBar() {
  const pathname = usePathname();
  const active = activeRootFor(pathname);

  return (
    <div className="md:hidden border-t border-border bg-sidebar px-3 pt-[10px] pb-5 grid grid-cols-4 gap-1 sticky bottom-0">
      {mobileTabs.map((tab) => {
        const isActive = active === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "border-0 bg-transparent text-[11.5px] py-2 flex flex-col items-center gap-[5px] min-h-11 " +
              (isActive ? "text-accent font-semibold" : "text-text-faint")
            }
          >
            <span
              className={
                "w-[6px] h-[6px] rounded-full " +
                (isActive ? "bg-accent" : "bg-[#dcdcd6]")
              }
            />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
