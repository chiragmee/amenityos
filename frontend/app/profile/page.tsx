"use client";

import { useAppState } from "@/lib/app-state";

export default function ProfilePage() {
  const { user, credits } = useAppState();
  if (!user) return null;

  return (
    <section className="animate-rise max-w-[560px]">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        Profile
      </h1>
      <div className="mt-[22px] bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-[14px]">
          <div className="w-[52px] h-[52px] rounded-full bg-avatar-bg text-avatar-text flex items-center justify-center text-[19px] font-semibold">
            {user.avatarInitial}
          </div>
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.3px]">
              {user.name}
            </div>
            <div className="mt-[3px] text-[13px] text-text-faint">
              {user.org} · {user.building}
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
            <div className="mt-[5px] text-sm font-medium">{user.eligibility}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              VOICE
            </div>
            <div className="mt-[5px] text-sm font-medium">
              {user.voiceEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
