"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, GraduationCap, Loader2, AlertCircle } from "lucide-react";
import supabase from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pwd,
      });
      if (error || !data.user) {
        throw new Error(error?.message || "Credenziali non valide");
      }
      router.replace("/admin");
    } catch (e: any) {
      setErr(e?.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#244D68] via-[#3D6E90] to-[#244D68] relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(200,109,81,0.2),transparent_60%)]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4A6535]/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-6 text-center">
          
          <div className="mt-4">
            <h1 className="font-serif text-2xl text-white font-semibold">
              Davide Apolloni
            </h1>
            <p className="text-xs text-white/70 mt-1 uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-1.5">
              <GraduationCap className="w-3 h-3 text-[#B22A2A]" />
              Pannello Amministrazione
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-md shadow-2xl border border-white/20 p-8 space-y-5"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9C1C1C] mb-2">
            <LockKeyhole className="w-3.5 h-3.5" />
            Accesso Area Riservata
          </div>
          {err && (
            <div className="bg-[#9C1C1C]/10 border border-[#9C1C1C]/30 text-[#9C1C1C] px-3.5 py-2.5 rounded-sm text-sm flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {err}
            </div>
          )}
          <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A] mb-1.5">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuo@esempio.it"
                className="w-full px-3.5 py-2.5 border border-[#E9DCC4] rounded-sm bg-[#F9F4EC] focus:bg-white focus:ring-2 focus:ring-[#B22A2A]/30 focus:border-[#B22A2A] outline-none text-sm"
              />
            </div>
          <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A] mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-[#E9DCC4] rounded-sm bg-[#F9F4EC] focus:bg-white focus:ring-2 focus:ring-[#B22A2A]/30 focus:border-[#B22A2A] outline-none text-sm"
              />
            </div>
          <button
            type="submit"
            disabled={loading}
            className={
              "w-full inline-flex items-center justify-center gap-2 bg-[#B22A2A] hover:bg-[#9C1C1C] disabled:bg-[#B22A2A]/70 text-white font-semibold py-3 rounded-sm shadow-md transition-colors " +
              (loading ? "cursor-not-allowed" : "")
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Accesso in corso…
              </>
            ) : (
              <>Accedi</>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
