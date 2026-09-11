"use client";

import type { ReactNode } from "react";
import { useAppState } from "@/lib/app-state";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileTabBar } from "./mobile-tab-bar";

function LoadState() {
  const { loading, loadError, refresh } = useAppState();

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-text-faint">
        Loading AmenityOS…
        <div className="mt-2 text-[12.5px] text-text-faint-2">
          The backend runs on a free tier and can take up to a minute to
          wake up from idle.
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="text-sm font-medium text-danger-dark">{loadError}</div>
        <button
          onClick={refresh}
          className="mt-4 border border-border bg-surface text-text rounded-lg px-4 py-2 text-[13px] hover:border-[#c9c9c1]"
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 px-5 md:px-[34px] pt-[26px] md:pt-[38px] pb-[70px]">
          <div className="max-w-[1080px] mx-auto">
            <LoadStateGate>{children}</LoadStateGate>
          </div>
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}

function LoadStateGate({ children }: { children: ReactNode }) {
  const { loading, loadError } = useAppState();
  if (loading || loadError) return <LoadState />;
  return <>{children}</>;
}
