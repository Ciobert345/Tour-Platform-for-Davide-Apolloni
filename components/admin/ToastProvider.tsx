"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  msg: string;
};

const ToastCtx = createContext<{
  notify: (type: Toast["type"], msg: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const notify = useCallback((type: Toast["type"], msg: string) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, type, msg }]);
    setTimeout(() => {
      setItems((xs) => xs.filter((x) => x.id !== id));
    }, 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2 pointer-events-none">
        {items.map((t) => {
          const pal =
            t.type === "success"
              ? "bg-olive-dark text-text-white border-[#2e1d14]"
              : t.type === "error"
                ? "bg-terracotta text-text-white border-terracotta-dark"
                : "bg-blue-adriatic text-text-white border-blue-dark";
          const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
          return (
            <div
              key={t.id}
              className={cn(
                "rounded-sm border shadow-xl p-3.5 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right-4 fade-in",
                pal
              )}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{t.msg}</p>
              <button
                onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
                className="ml-auto opacity-80 hover:opacity-100 shrink-0"
                aria-label="chiudi"
              >
                <AlertTriangle className="w-4 h-4 rotate-45" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
