// ============================================================
// Supabase Client — LATO SERVER (Route Handlers, Server Actions, Server Components)
// Utile per: RSC, middleware, chiamate autenticate server-side
// ============================================================

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase Server-side
 * Usa SEMPRE questo in Server Components / Route Handlers / Actions
 * — condivide la sessione con il client (cookies)
 */
export function createClient() {
  const cookieStore = cookies();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL non è configurato — controlla il file .env.local");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY non è configurato — controlla il file .env.local");
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch (_) {
            // Server Components possono fallire durante il rendering — ignora
          }
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}

/**
 * Admin Server Client (con service_role key) — USO ESCLUSIVO SERVER
 * Salta RLS, usalo solo per operazioni riservate lato server
 * (es. route handlers protetti da auth)
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
