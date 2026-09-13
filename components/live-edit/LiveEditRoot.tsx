"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { LiveEditProvider } from "./LiveEditProvider";
import LangFromUrl from "./LangFromUrl";

export function LiveEditRoot({
  children,
  profileId,
}: {
  children: React.ReactNode;
  profileId: string | null;
}) {
  const searchParams = useSearchParams();
  const enabled = searchParams.get("liveEdit") === "1";

  return (
    <LiveEditProvider profileId={profileId} enabled={enabled}>
      {enabled && <LangFromUrl />}
      {children}
    </LiveEditProvider>
  );
}
