// ============================================================
// Supabase Client — LATO BROWSER (Client Components)
// Usa SEMPRE 'use client' nei componenti che lo importano
// ============================================================

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

let singleton: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (singleton) return singleton;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL non configurato — controlla .env.local");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY non configurato — controlla .env.local");
  }

  singleton = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return singleton;
}

/**
 * Lazy getter — il client viene istanziato solo al primo utilizzo effettivo,
 * mai durante SSR / rendering server-side.
 */
export function getClient() {
  return createClient();
}

// Default export come getter lazy per compatibilità con i componenti esistenti
const clientProxy = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

export default clientProxy;
