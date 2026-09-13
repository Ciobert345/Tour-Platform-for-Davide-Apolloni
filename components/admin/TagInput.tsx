"use client";

import React, { useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";
import { X, AlertCircle } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export function TagInput({
  tags = [],
  onChange,
  placeholder,
  className,
  maxTags = 12,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [limitWarning, setLimitWarning] = useState(false);

  const showLimitWarning = () => {
    setLimitWarning(true);
    setTimeout(() => setLimitWarning(false), 2500);
  };

  const addTags = (newTags: string[]) => {
    const currentTags = Array.isArray(tags) ? tags : [];

    if (currentTags.length >= maxTags) {
      showLimitWarning();
      return;
    }

    const cleaned = newTags
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !currentTags.includes(t));

    if (cleaned.length === 0) return;

    const availableSlots = maxTags - currentTags.length;
    const toAdd = cleaned.slice(0, availableSlots);

    if (toAdd.length > 0) {
      onChange([...currentTags, ...toAdd]);
    }

    if (cleaned.length > toAdd.length) {
      showLimitWarning();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Intercetta la virgola o l'invio
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTags([inputValue]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Elimina l'ultimo tag se l'input è vuoto
      onChange(tags.slice(0, -1));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Sicurezza aggiuntiva nel caso la virgola venga incollata o digitata velocemente
    if (value.includes(",")) {
      const splitTags = value.split(",");
      addTags(splitTags);
      setInputValue("");
    } else {
      setInputValue(value);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    if (pastedData) {
      const splitTags = pastedData.split(",");
      addTags(splitTags);
      setInputValue("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const atLimit = Array.isArray(tags) && tags.length >= maxTags;

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1.5 p-1.5 min-h-[42px] border rounded-sm bg-white border-[#E9DCC4] focus-within:ring-2 focus-within:ring-[#4A6535]/30 focus-within:border-[#4A6535] transition-colors cursor-text ${className || ""
          }`}
      >
        {Array.isArray(tags) &&
          tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-[#F0E8D6] text-[#3D2E1A] text-xs font-medium border border-[#E9DCC4] shrink-0"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-[#92816A] hover:text-[#B22A2A] focus:outline-none p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={atLimit}
          placeholder={
            atLimit
              ? `Limite di ${maxTags} tag raggiunto`
              : (!tags || tags.length === 0)
                ? placeholder
                : ""
          }
          className="flex-1 bg-transparent text-sm text-[#1E160A] placeholder-[#92816A] outline-none min-w-[120px] px-1 py-1 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <div>
          {limitWarning && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B22A2A]">
              <AlertCircle className="w-3 h-3" />
              Massimo {maxTags} tag consentiti
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#92816A] tabular-nums">
          {Array.isArray(tags) ? tags.length : 0}/{maxTags}
        </span>
      </div>
    </div>
  );
}