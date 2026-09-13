"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { LiveEditMessage, LiveEditTarget, LiveEditValues } from "@/lib/live-edit/types";

interface LiveEditContextValue {
  enabled: boolean;
  profileId: string | null;
  selectedId: string | null;
  select: (target: LiveEditTarget, values: LiveEditValues) => void;
  hover: (id: string | null) => void;
}

const LiveEditContext = createContext<LiveEditContextValue | null>(null);

export function useLiveEdit() {
  const ctx = useContext(LiveEditContext);
  return ctx;
}

function postToParent(message: LiveEditMessage) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

export function LiveEditProvider({
  children,
  profileId,
  enabled,
}: {
  children: React.ReactNode;
  profileId: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((target: LiveEditTarget, values: LiveEditValues) => {
    setSelectedId(target.id);
    postToParent({ type: "LIVE_EDIT_SELECT", target, values });
  }, []);

  const hover = useCallback((id: string | null) => {
    postToParent({ type: "LIVE_EDIT_HOVER", targetId: id });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    postToParent({ type: "LIVE_EDIT_READY" });

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as LiveEditMessage;
      if (data?.type === "LIVE_EDIT_SAVED") {
        router.refresh();
      }
      if (data?.type === "LIVE_EDIT_SCROLL") {
        const el = document.getElementById(data.anchor) ?? document.querySelector(`[id="${data.anchor}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: data.anchor === "top" ? 0 : document.body.scrollHeight, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("live-edit-mode");
    return () => document.documentElement.classList.remove("live-edit-mode");
  }, [enabled]);

  const value = useMemo(
    () => ({ enabled, profileId, selectedId, select, hover }),
    [enabled, profileId, selectedId, select, hover]
  );

  if (!enabled) return <>{children}</>;

  return (
    <LiveEditContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-terracotta text-text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm shadow-lg max-w-[90vw] text-center">
        Modalità modifica live — clicca gli elementi evidenziati per modificarli
      </div>
    </LiveEditContext.Provider>
  );
}
