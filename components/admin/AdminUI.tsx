"use client";

import React from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";

export function PageHeader({
  title, subtitle, icon, onSave, saving, loading, children,
}: {
  title: string; subtitle?: string; icon?: React.ReactNode;
  onSave?: () => void; saving?: boolean; loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1E160A] font-serif flex items-center gap-3">
            {icon && (
              <span className="w-10 h-10 rounded-sm bg-[#B22A2A]/10 text-[#9C1C1C] flex items-center justify-center shrink-0">
                {icon}
              </span>
            )}
            {title}
          </h1>
          {subtitle && <p className="text-sm text-[#7A6655] mt-1">{subtitle}</p>}
        </div>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4A6535] hover:bg-[#3A5228] disabled:bg-[#C4B49A] text-white text-sm font-medium rounded-sm shadow-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando…" : "Salva modifiche"}
          </button>
        )}
      </div>
      {loading ? (
        <div className="bg-white border border-[#E9DCC4] rounded-sm p-12 text-center text-[#7A6655] flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#B22A2A]" />
          Caricamento in corso…
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ✅ AGGIORNATO: label ora accetta ReactNode (permettendo JSX come asterischi colorati)
// ✅ AGGIUNTO: prop 'error' per mostrare messaggi di errore inline sotto il campo
export function Field({ 
  label, 
  children, 
  hint, 
  error 
}: { 
  label: React.ReactNode; 
  children: React.ReactNode; 
  hint?: React.ReactNode; // ✅ Cambiato da 'string' a 'React.ReactNode'
  error?: string; 
}) {
  return (
    <div className="block">
      <span className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A] mb-1.5">
        {label}
      </span>
      {children}
      {error ? (
        <span className="block text-[11px] text-[#9C1C1C] mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      ) : hint ? (
        <span className="block text-[11px] text-[#92816A] mt-1">{hint}</span>
      ) : null}
    </div>
  );
}

export function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

export function SubCard({ title, icon, children }: { title: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E9DCC4] rounded-sm p-5 shadow-sm">
      <p className="font-semibold text-[#2E2010] border-b border-[#F0E8D6] pb-2 mb-3 flex items-center gap-2">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}