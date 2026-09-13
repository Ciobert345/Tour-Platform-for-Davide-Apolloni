"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  Info,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TutorialStep {
  title: string;
  description: string;
  badge?: string;
}

export interface AdminTutorialProps {
  title: string;
  description: string;
  badge?: string;
  steps?: TutorialStep[];
  tips?: string[];
  links?: { label: string; href: string; external?: boolean }[];
  defaultOpen?: boolean;
  className?: string;
}

export default function AdminTutorial({
  title,
  description,
  badge = "Guida & Tutorial",
  steps,
  tips,
  links,
  defaultOpen = false,
  className,
}: AdminTutorialProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-[#1E160A] via-[#244D68] to-[#1E160A] text-white rounded-sm shadow-sm border border-[#2E2010] transition-all duration-200 overflow-hidden mb-6",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-[#B22A2A]/20 border border-[#B22A2A]/40 flex items-center justify-center text-[#B22A2A] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#B22A2A] text-white">
                {badge}
              </span>
              <h3 className="font-serif text-base font-semibold text-white truncate">
                {title}
              </h3>
            </div>
            <p className="text-xs text-white/70 truncate mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/60 hidden sm:inline">
            {isOpen ? "Nascondi guida" : "Mostra guida"}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-white/70 transition-transform duration-200",
              isOpen && "rotate-180 text-[#B22A2A]"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-white/10 bg-[#0E0B04]/50 text-sm">
          <p className="text-xs text-white/80 leading-relaxed mb-4 max-w-3xl">
            {description}
          </p>

          {steps && steps.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {steps.map((st, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-sm p-3.5 hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#B22A2A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {st.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-white/10 text-white/80">
                        {st.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-1">
                    {st.title}
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {st.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tips && tips.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-sm p-3.5 space-y-1.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C4923A]">
                <Sparkles className="w-3.5 h-3.5" />
                Consigli utili
              </div>
              <ul className="space-y-1 text-xs text-white/80 list-disc pl-4">
                {tips.map((tp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {tp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {links && links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 items-center">
              <span className="text-xs text-white/50">Link correlati:</span>
              {links.map((lk, i) => (
                <a
                  key={i}
                  href={lk.href}
                  target={lk.external ? "_blank" : undefined}
                  rel={lk.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#B22A2A] hover:text-white bg-white/5 hover:bg-[#B22A2A] px-2.5 py-1 rounded-sm transition-colors"
                >
                  {lk.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
