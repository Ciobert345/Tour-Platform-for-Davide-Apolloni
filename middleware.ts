import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MAINT_CACHE_COOKIE = "_maint_cache";
const MAINT_CACHE_TTL_MS = 60_000;

function hasEnvOverride(): boolean {
  const v = process.env.NEXT_PUBLIC_MAINTENANCE_OVERRIDE;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAdminUser = Boolean(user);
  const envOverride = hasEnvOverride();
  const isAdminOrDev = isAdminUser || envOverride;

  const isAlwaysAllowedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/translate") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/uploads") ||
    pathname === "/favicon.ico";

  // Se è un percorso amministrativo/di sistema o l'utente è un amministratore loggato,
  // consenti l'accesso immediato (anche al sito pubblico / tramite "Vedi sito pubblico")
  if (isAlwaysAllowedPath || isAdminOrDev) {
    if (request.cookies.has("_maint_bypass")) {
      supabaseResponse.cookies.delete("_maint_bypass");
    }
    return supabaseResponse;
  }

  // Per tutti gli altri visitatori: verifica se la manutenzione è attiva
  let enabled = false;
  let needCacheWrite = true;

  const cached = request.cookies.get(MAINT_CACHE_COOKIE)?.value;
  if (cached) {
    try {
      const [flag, tsStr] = cached.split(":");
      const ts = Number(tsStr);
      if (!Number.isNaN(ts) && Date.now() - ts < MAINT_CACHE_TTL_MS) {
        enabled = flag === "1";
        needCacheWrite = false;
      }
    } catch {}
  }

  if (needCacheWrite) {
    try {
      const { data } = await supabase
        .from("ui_strings")
        .select("it")
        .eq("key", "site.maintenance_mode")
        .maybeSingle();
      enabled = data?.it === "true";
    } catch (err) {
      console.warn("[middleware] maintenance lookup failed:", (err as Error).message);
      enabled = false;
    }
    supabaseResponse.cookies.set(
      MAINT_CACHE_COOKIE,
      `${enabled ? "1" : "0"}:${Date.now()}`,
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: Math.floor(MAINT_CACHE_TTL_MS / 1000),
      }
    );
  }

  if (enabled) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    const rewrite = NextResponse.rewrite(url);
    rewrite.cookies.set(
      MAINT_CACHE_COOKIE,
      `1:${Date.now()}`,
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: Math.floor(MAINT_CACHE_TTL_MS / 1000),
      }
    );
    if (request.cookies.has("_maint_bypass")) {
      rewrite.cookies.delete("_maint_bypass");
    }
    return rewrite;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


