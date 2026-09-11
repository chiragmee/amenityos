"use client";

import { useState } from "react";
import * as api from "@/lib/api-client";
import { useAppState } from "@/lib/app-state";
import { AmenityForm } from "@/components/admin/amenity-form";

export default function AdminPage() {
  const { amenities, findAmenity } = useAppState();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState("");
  const [saved, setSaved] = useState(false);

  const activeCount = amenities.filter((a) => a.active).length;
  const editing = editingId ? findAmenity(editingId) ?? null : null;

  const openEdit = (id: string) => {
    setEditingId(id);
    setView("edit");
    setSaved(false);
    setGuidelines("Loading…");
    api
      .getAmenityPolicy(id)
      .then((policy) => setGuidelines(policy.guidelines.map((g) => g.content).join("\n\n") || ""))
      .catch(() => setGuidelines(""));
  };
  const openNew = () => {
    setEditingId(null);
    setView("edit");
    setSaved(false);
    setGuidelines("");
  };
  const backToList = () => {
    setView("list");
    setSaved(false);
  };
  const save = () => {
    // No PATCH /amenities endpoint exists yet — this reflects the change
    // locally only. See backend/README.md for what's built vs. specified.
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  if (view === "edit") {
    return (
      <section className="animate-rise">
        <button
          onClick={backToList}
          className="border-0 bg-transparent text-accent text-[12.5px] pb-[14px]"
        >
          ← All amenities
        </button>
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
              Amenity configuration
            </h1>
            <p className="mt-2 text-[15px] text-text-muted">
              {editing ? `${editing.name} · live from the backend` : "New amenity · not yet published"}
            </p>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="border-0 bg-accent text-white rounded-lg px-4 py-[10px] text-[13px] font-medium hover:bg-accent-dark"
            >
              Save amenity
            </button>
            <button className="border border-danger-border bg-surface text-danger rounded-lg px-4 py-[10px] text-[13px] hover:bg-danger-bg">
              Deactivate
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-[18px] border border-accent-border bg-accent-bg-2 rounded-lg px-4 py-3 text-[13.5px] text-[#3f5c56] animate-rise">
            Saved locally. There&apos;s no update endpoint on the backend yet,
            so this doesn&apos;t persist — see backend/README.md.
          </div>
        )}

        <AmenityForm amenity={editing} guidelines={guidelines} />
      </section>
    );
  }

  return (
    <section className="animate-rise">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
            Amenities
          </h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {amenities.length} configured · {activeCount} active ·{" "}
            {amenities.length - activeCount} inactive · Tower A
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={openNew}
          className="border-0 bg-dark text-white rounded-lg px-4 py-[10px] text-[13px] font-medium hover:bg-accent"
        >
          New amenity
        </button>
      </div>

      <div className="mt-6 bg-surface border border-border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-[14px] px-5 py-[11px] bg-[#fafaf8] border-b border-border-hairline text-[11px] tracking-[.07em] font-mono text-text-faint-2">
          <div>AMENITY</div>
          <div>TYPE</div>
          <div>CAPACITY</div>
          <div>RULES</div>
          <div>STATUS</div>
        </div>
        {amenities.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-2 md:gap-[14px] px-5 py-4 border-b border-border-hairline-2 last:border-b-0 items-center hover:bg-[#fcfcfa]"
          >
            <div>
              <div className="text-[14.5px] font-medium">{a.name}</div>
              <div className="mt-[3px] text-xs text-text-faint-2">
                {a.building} · Floor {a.floor}
              </div>
            </div>
            <div className="text-[13px] text-text-secondary">{a.type}</div>
            <div className="text-[13px] text-text-secondary">{a.capacity} people</div>
            <div>
              <div className="text-[13px] text-text-secondary">
                {a.costCredits === 0 ? "Free" : `${a.costCredits} credits`}
              </div>
              <div className="mt-[3px] text-[11.5px] text-text-faint-2 font-mono">
                max {a.maxActiveBookingsPerUser} active · {a.workingHours}
              </div>
            </div>
            <div className="flex items-center gap-[10px]">
              {a.active ? (
                <span className="text-[10.5px] tracking-[.07em] font-mono text-accent border border-accent-border bg-accent-bg rounded-full px-2 py-[3px]">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10.5px] tracking-[.07em] font-mono text-text-faint border border-border-rule bg-[#f6f6f3] rounded-full px-2 py-[3px]">
                  INACTIVE
                </span>
              )}
              <button
                onClick={() => openEdit(a.id)}
                className="border border-border bg-surface text-text-secondary-2 rounded-md px-[10px] py-[6px] text-xs hover:border-accent hover:text-accent"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
