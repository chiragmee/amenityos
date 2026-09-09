import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileTabBar } from "./mobile-tab-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 px-5 md:px-[34px] pt-[26px] md:pt-[38px] pb-[70px]">
          <div className="max-w-[1080px] mx-auto">{children}</div>
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
