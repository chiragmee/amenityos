"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Booking, CreditLedgerEntry } from "./types";
import {
  STARTING_CREDITS,
  initialLedger,
  initialUpcomingBookings,
  pastBookings,
} from "./mock-data";

let bookingSeq = 1000;
function nextDisplayId() {
  bookingSeq += 1;
  return `AMN-2${bookingSeq}`;
}

interface AppState {
  credits: number;
  ledger: CreditLedgerEntry[];
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  spend: (amount: number, description: string) => void;
  addBooking: (booking: Omit<Booking, "id" | "displayId">) => Booking;
  pendingPrefill: string | null;
  setPendingPrefill: (text: string | null) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState(STARTING_CREDITS);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>(initialLedger);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>(
    initialUpcomingBookings
  );
  const [pendingPrefill, setPendingPrefill] = useState<string | null>(null);

  const spend = useCallback((amount: number, description: string) => {
    setCredits((c) => Math.max(0, c - amount));
    setLedger((l) => [
      {
        id: `l-${Date.now()}`,
        name: description,
        date: "TODAY",
        amount: -amount,
      },
      ...l,
    ]);
  }, []);

  const addBooking = useCallback(
    (booking: Omit<Booking, "id" | "displayId">) => {
      const full: Booking = {
        ...booking,
        id: `b-${Date.now()}`,
        displayId: nextDisplayId(),
      };
      setUpcomingBookings((b) => [full, ...b]);
      return full;
    },
    []
  );

  const value = useMemo(
    () => ({
      credits,
      ledger,
      upcomingBookings,
      pastBookings,
      spend,
      addBooking,
      pendingPrefill,
      setPendingPrefill,
    }),
    [credits, ledger, upcomingBookings, spend, addBooking, pendingPrefill]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
