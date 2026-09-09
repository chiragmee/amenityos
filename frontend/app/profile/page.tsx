"use client";

import { useAppState } from "@/lib/app-state";
import { currentUser } from "@/lib/mock-data";

export default function ProfilePage() {
  const { credits } = useAppState();

  return (
    <section className="animate-rise max-w-[560px]">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        Profile
      </h1>
      <div className="mt-[22px] bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-[14px]">
          <div className="w-[52px] h-[52px] rounded-full bg-avatar-bg text-avatar-text flex items-center justify-center text-[19px] font-semibold">
            {currentUser.avatarInitial}
          </div>
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.3px]">
              {currentUser.name}
            </div>
            <div className="mt-[3px] text-[13px] text-text-faint">
              {currentUser.org} · {currentUser.building} · Employee
            </div>
          </div>
        </div>
        <div className="mt-[22px] pt-5 border-t border-border-hairline grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-[18px]">
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              CREDITS
            </div>
            <div className="mt-[5px] text-sm font-medium">{credits} remaining</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              ELIGIBILITY
            </div>
            <div className="mt-[5px] text-sm font-medium">{currentUser.eligibility}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              VOICE
            </div>
            <div className="mt-[5px] text-sm font-medium">
              {currentUser.voiceEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
