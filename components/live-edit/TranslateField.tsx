"use client";

import { useState } from "react";
import TranslateButton from "@/components/admin/TranslateButton";

interface TranslateFieldProps {
  label: string;
  valueIT: string;
  valueEN: string;
  onChangeIT: (value: string) => void;
  onChangeEN: (value: string) => void;
  placeholderIT?: string;
  placeholderEN?: string;
  rows?: number;
  type?: "input" | "textarea";
}

export default function TranslateField({
  label,
  valueIT,
  valueEN,
  onChangeIT,
  onChangeEN,
  placeholderIT = "",
  placeholderEN = "",
  rows = 3,
  type = "textarea",
}: TranslateFieldProps) {
  const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6535]/30 focus:border-[#4A6535] transition-colors";

  return (
    <div className="space-y-3">
      {/* Campo Italiano */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          {label} <span className="text-slate-400 font-normal normal-case">(IT)</span>
        </label>
        {type === "textarea" ? (
          <textarea
            value={valueIT}
            onChange={(e) => onChangeIT(e.target.value)}
            placeholder={placeholderIT}
            rows={rows}
            className={`${inputClass} resize-y`}
          />
        ) : (
          <input
            type="text"
            value={valueIT}
            onChange={(e) => onChangeIT(e.target.value)}
            placeholder={placeholderIT}
            className={inputClass}
          />
        )}
      </div>

      {/* Campo Inglese con bottone Traduci */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label} <span className="text-slate-400 font-normal normal-case">(EN)</span>
          </label>
          <TranslateButton
            sourceText={valueIT}
            onTranslated={onChangeEN}
            size="sm"
          />
        </div>
        {type === "textarea" ? (
          <textarea
            value={valueEN}
            onChange={(e) => onChangeEN(e.target.value)}
            placeholder={placeholderEN}
            rows={rows}
            className={`${inputClass} resize-y`}
          />
        ) : (
          <input
            type="text"
            value={valueEN}
            onChange={(e) => onChangeEN(e.target.value)}
            placeholder={placeholderEN}
            className={inputClass}
          />
        )}
      </div>
    </div>
  );
}