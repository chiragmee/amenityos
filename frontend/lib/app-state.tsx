"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api-client";
import type { BackendAgentOptionsBlock, BackendAmenity, BackendBooking, BackendCredits } from "./backend-types";
import { parseBackendDate, toBackendIso } from "./backend-time";
import { mapAmenity, mapBooking, mapLedgerEntry, mapUser } from "./map-backend";
import type { Amenity, Booking, CreditLedgerEntry, User } from "./types";

interface CreateBookingInput {
  amenityId: string;
  startTime: Date;
  durationMinutes: number;
  attendeeCount: number;
}

interface AgentTurnResult {
  sessionId: string;
  message: string;
  booking: Booking | null;
  options: BackendAgentOptionsBlock | null;
}

interface AppState {
  loading: boolean;
  loadError: string | null;
  user: User | null;
  credits: number;
  monthlyAllowance: number;
  spentThisMonth: number;
  ledger: CreditLedgerEntry[];
  amenities: Amenity[];
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  findAmenity: (id: string) => Amenity | undefined;
  refresh: () => Promise<void>;
  createRealBooking: (input: CreateBookingInput) => Promise<Booking>;
  cancelRealBooking: (bookingId: string) => Promise<{ refundedCredits: number }>;
  sendAgentMessage: (
    sessionId: string | null,
    message: string,
    userId?: string
  ) => Promise<AgentTurnResult>;
}

const AppStateContext = createContext<AppState | null>(null);

function isUpcoming(raw: BackendBooking): boolean {
  return raw.status === "confirmed" && parseBackendDate(raw.end_time).getTime() > Date.now();
}

/** No "monthly allowance" concept exists on the backend (it's pure ledger
 * balance) — these are honest derived totals from this calendar month's
 * real ledger entries, not a fabricated policy number. */
function thisMonthTotals(credits: BackendCredits | null): { granted: number; spent: number } {
  if (!credits) return { granted: 0, spent: 0 };
  const now = new Date();
  const entries = credits.ledger.filter((l) => {
    const d = parseBackendDate(l.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const granted = entries.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const spent = entries.filter((l) => l.amount < 0).reduce((s, l) => s - l.amount, 0);
  return { granted, spent };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rawAmenities, setRawAmenities] = useState<BackendAmenity[]>([]);
  const [rawBookings, setRawBookings] = useState<BackendBooking[]>([]);
  const [rawCredits, setRawCredits] = useState<BackendCredits | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const amenitiesById = useMemo(
    () => new Map(rawAmenities.map((a) => [a.id, a])),
    [rawAmenities]
  );
  const bookingsById = useMemo(
    () => new Map(rawBookings.map((b) => [b.id, b])),
    [rawBookings]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [amenities, bookings, backendUser, credits] = await Promise.all([
        api.getAmenities(),
        api.getUserBookings(api.CURRENT_USER_ID),
        api.getUser(api.CURRENT_USER_ID),
        api.getUserCredits(api.CURRENT_USER_ID),
      ]);
      setRawAmenities(amenities);
      setRawBookings(bookings);
      setRawCredits(credits);
      setUser(mapUser(backendUser));
    } catch (err) {
      setLoadError(
        err instanceof api.ApiError
          ? err.message
          : "Could not load nookly. Check that the backend is reachable."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const amenities = useMemo(() => rawAmenities.map(mapAmenity), [rawAmenities]);

  const upcomingBookings = useMemo(
    () =>
      rawBookings.filter(isUpcoming).map((b) => mapBooking(b, amenitiesById)),
    [rawBookings, amenitiesById]
  );
  const pastBookings = useMemo(
    () =>
      rawBookings.filter((b) => !isUpcoming(b)).map((b) => mapBooking(b, amenitiesById)),
    [rawBookings, amenitiesById]
  );

  const ledger = useMemo(() => {
    if (!rawCredits) return [];
    return [...rawCredits.ledger]
      .reverse()
      .map((l) => mapLedgerEntry(l, bookingsById, amenitiesById));
  }, [rawCredits, bookingsById, amenitiesById]);

  const { granted: monthlyAllowance, spent: spentThisMonth } = useMemo(
    () => thisMonthTotals(rawCredits),
    [rawCredits]
  );

  const findAmenity = useCallback(
    (id: string) => amenities.find((a) => a.id === id),
    [amenities]
  );

  const createRealBooking = useCallback(
    async ({ amenityId, startTime, durationMinutes, attendeeCount }: CreateBookingInput) => {
      const created = await api.createBooking({
        user_id: api.CURRENT_USER_ID,
        amenity_id: amenityId,
        start_time: toBackendIso(startTime),
        duration_minutes: durationMinutes,
        attendee_count: attendeeCount,
        idempotency_key: api.newIdempotencyKey(),
      });
      const mapped = mapBooking(created, amenitiesById);
      await load();
      return mapped;
    },
    [load, amenitiesById]
  );

  const cancelRealBooking = useCallback(
    async (bookingId: string) => {
      const result = await api.cancelBooking(bookingId, api.CURRENT_USER_ID);
      await load();
      return { refundedCredits: result.refunded_credits };
    },
    [load]
  );

  const sendAgentMessage = useCallback(
    async (sessionId: string | null, message: string, userId?: string) => {
      const result = await api.agentChat({
        session_id: sessionId,
        user_id: userId ?? api.CURRENT_USER_ID,
        message,
      });
      let booking: Booking | null = null;
      if (result.booking) {
        const raw = await api.getBooking(result.booking.id);
        booking = mapBooking(raw, amenitiesById);
        await load();
      }
      return { sessionId: result.session_id, message: result.message, booking, options: result.options };
    },
    [load, amenitiesById]
  );

  const value: AppState = {
    loading,
    loadError,
    user,
    credits: rawCredits?.balance ?? 0,
    monthlyAllowance,
    spentThisMonth,
    ledger,
    amenities,
    upcomingBookings,
    pastBookings,
    findAmenity,
    refresh: load,
    createRealBooking,
    cancelRealBooking,
    sendAgentMessage,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
