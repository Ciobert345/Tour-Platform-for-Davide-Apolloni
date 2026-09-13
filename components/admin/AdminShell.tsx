"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";
import { ToastProvider } from "./ToastProvider";
import { Loader2 } from "lucide-react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const mod = await import("@/lib/supabase/browser");
        const sb = mod.default ?? mod.createClient();

        // Race getUser() against a 5s timeout to prevent infinite loading
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("auth_timeout")), 5000)
        );
        const { data } = await Promise.race([sb.auth.getUser(), timeout]);

        if (!data.user) {
          if (alive) router.replace("/admin/login");
          return;
        }
        if (alive) setUser({ email: data.user.email });
      } catch (e: any) {
        console.error("AdminShell auth error:", e?.message ?? e);
        if (alive) router.replace("/admin/login");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F4EC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-9 h-9 text-[#B22A2A] animate-spin" />
          <p className="text-sm text-[#7A6655] font-medium">Verifica accesso…</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayoutClient userEmail={user.email ?? null}>
      <ToastProvider>{children}</ToastProvider>
    </AdminLayoutClient>
  );
}
