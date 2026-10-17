import { createClient } from "@/lib/supabase/server";

export async function requireAdminSession(): Promise<boolean> {
  try {
    const sb = createClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return false;
    const { data: ok, error } = await sb.rpc("is_admin");
    if (error) return false;
    return Boolean(ok);
  } catch {
    return false;
  }
}
