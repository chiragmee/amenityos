"use client";

import { useAppState } from "@/lib/app-state";
import { AmenityCard } from "@/components/amenities/amenity-card";

export default function AmenitiesPage() {
  const { amenities } = useAppState();

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        Explore amenities
      </h1>
      <p className="mt-2 text-[15px] text-text-muted">
        {amenities.length} amenities across Tower A.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(292px,1fr))] gap-4">
        {amenities.map((a) => (
          <AmenityCard key={a.id} amenity={a} />
        ))}
      </div>
    </section>
  );
}
