// ============================================================
// DATA LAYER — ADMIN (usare via server action o route handler)
// Richiede privilegi admin (usa service_role in server,
// oppure in client l'utente che ha ruolo admin scrive via RLS)
// ============================================================

import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types/database.types";

/**
 * Calcola statistiche dashboard admin (usa service_role server-side).
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const sb = createAdminClient(); // service role, bypassa RLS
  if (!sb) {
    return {
      newBookings: 0,
      pendingReviews: 0,
      upcomingEvents: 0,
      totalApprovedReviews: 0,
      totalPlaces: 0,
      totalEvents: 0,
      bookingsByMonth: [],
      latestBookings: [],
      latestReviews: [],
    };
  }

  const [
    newBookings,
    pendingReviews,
    upcomingEvents,
    totalApprovedReviews,
    totalPlaces,
    totalEvents,
    bookingsByMonth,
  ] = await Promise.all([
    sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("events").select("id", { count: "exact", head: true }).gte("start_date", new Date().toISOString()).eq("is_active", true),
    sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "approved"),
    sb.from("places").select("id", { count: "exact", head: true }).eq("is_active", true),
    sb.from("events").select("id", { count: "exact", head: true }).eq("is_active", true),
    (() => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      return sb
        .from("bookings")
        .select("created_at, status")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });
    })(),
  ]);

  // Latest bookings and reviews (non contati, mostrati separatamente)
  const [latestBookings, latestReviews] = await Promise.all([
    sb
      .from("bookings")
      .select("id, full_name, email, phone, created_at, status, preferred_destination, preferred_date, participants")
      .order("created_at", { ascending: false })
      .limit(6),
    sb
      .from("reviews")
      .select("id, author_name, author_location_it, review_text, rating, status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  return {
    newBookings: newBookings.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    upcomingEvents: upcomingEvents.count ?? 0,
    totalApprovedReviews: totalApprovedReviews.count ?? 0,
    totalPlaces: totalPlaces.count ?? 0,
    totalEvents: totalEvents.count ?? 0,
    bookingsByMonth: (bookingsByMonth.data ?? []) as any[],
    latestBookings: (latestBookings.data ?? []) as any[],
    latestReviews: (latestReviews.data ?? []) as any[],
  };
}
