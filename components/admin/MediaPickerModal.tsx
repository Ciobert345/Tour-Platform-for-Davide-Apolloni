"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Sparkles,
  Link2,
  Check,
  Loader2,
  X,
  Play,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Curated high quality presets for Veneto, Trentino, culture & history
const CURATED_PRESETS = [
  {
    category: "Venezia & Laguna",
    items: [
      {
        title: "Venezia Canal Grande all'Alba",
        url: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Piazza San Marco & Basilica",
        url: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Gondola e Laguna al Tramonto",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Venezia Calli e Canali Notturni",
        url: "https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1920&q=80",
      },
    ],
  },
  {
    category: "Ville Venete & Palladio",
    items: [
      {
        title: "Villa Veneta & Giardini Monumentali",
        url: "https://images.unsplash.com/photo-1599818817294-82a17f6920f3?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Architettura Classica Palladiana",
        url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Colonnati e Saloni Affrescati",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
      },
    ],
  },
  {
    category: "Trentino & Castelli",
    items: [
      {
        title: "Castello Medievale e Vigneti",
        url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Dolomiti & Paesaggi Alpini",
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Laghi Alpini e Valli del Trentino",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
      },
    ],
  },
  {
    category: "Città d'Arte & Grande Guerra",
    items: [
      {
        title: "Padova, Prato della Valle",
        url: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Altopiano di Asiago e Forti",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
      },
      {
        title: "Verona e Centro Storico",
        url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80",
      },
    ],
  },
];

interface MediaPickerModalProps {
  value: string;
  onChange: (newUrl: string) => void;
  onClose?: () => void;
  isVideo?: boolean;
  posterValue?: string;
  onPosterChange?: (newPosterUrl: string) => void;
  title?: string;
}

export default function MediaPickerModal({
  value,
  onChange,
  onClose,
  isVideo = false,
  posterValue,
  onPosterChange,
  title = "Gestione Immagine & Video",
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "presets" | "url">(
    isVideo ? "url" : "upload"
  );
  const [urlInput, setUrlInput] = useState(value || "");
  const [posterInput, setPosterInput] = useState(posterValue || "");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setErrorMsg(null);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(50);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Errore nel caricamento del file");
      }

      setUploadProgress(100);
      onChange(json.url);
      setUrlInput(json.url);
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore caricamento");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const isVideoFile =
    isVideo ||
    (typeof urlInput === "string" &&
      (urlInput.endsWith(".mp4") ||
        urlInput.endsWith(".webm") ||
        urlInput.includes("youtube.com") ||
        urlInput.includes("youtu.be") ||
        urlInput.includes("vimeo.com")));

  return (
    <div className="bg-white border border-[#E9DCC4] rounded-md shadow-xl overflow-hidden flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0E8D6] pb-3">
        <div className="flex items-center gap-2">
          {isVideoFile ? (
            <Video className="w-5 h-5 text-[#B22A2A]" />
          ) : (
            <ImageIcon className="w-5 h-5 text-[#B22A2A]" />
          )}
          <h3 className="font-serif font-semibold text-[#1E160A] text-sm">{title}</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#F0E8D6] flex items-center justify-center text-[#92816A] hover:text-[#3D2E1A]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-sm bg-[#F0E8D6] p-0.5 border border-[#E9DCC4]">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5",
            activeTab === "upload"
              ? "bg-white text-[#1E160A] shadow-sm"
              : "text-[#7A6655] hover:text-[#2E2010]"
          )}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Carica dal Computer</span>
        </button>

        {!isVideo && (
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5",
              activeTab === "presets"
                ? "bg-white text-[#1E160A] shadow-sm"
                : "text-[#7A6655] hover:text-[#2E2010]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B22A2A]" />
            <span>Preset Fotografici</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5",
            activeTab === "url"
              ? "bg-white text-[#1E160A] shadow-sm"
              : "text-[#7A6655] hover:text-[#2E2010]"
          )}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Inserisci Link / URL</span>
        </button>
      </div>

      {/* Tab 1: Upload from Computer */}
      {activeTab === "upload" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all",
            "hover:border-[#B22A2A] hover:bg-[#B22A2A]/5 bg-[#F9F4EC]/50",
            uploading && "opacity-75 pointer-events-none"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={
              isVideo
                ? "video/mp4,video/webm,image/*"
                : "image/jpeg,image/png,image/webp,image/svg+xml"
            }
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-full bg-[#B22A2A]/10 text-[#B22A2A] flex items-center justify-center mx-auto mb-3">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <p className="text-xs font-bold text-[#2E2010] mb-1">
            {uploading ? "Caricamento in corso…" : "Trascina qui il file o Clicca per sfogliare"}
          </p>
          <p className="text-[11px] text-[#92816A]">
            Supporta JPG, PNG, WebP {isVideo && ", MP4 video"} fino a 50MB
          </p>

          {uploading && (
            <div className="w-full bg-[#E9DCC4] h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-[#B22A2A] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Presets */}
      {activeTab === "presets" && !isVideo && (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {CURATED_PRESETS.map((group) => (
            <div key={group.category} className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#92816A] block">
                {group.category}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const isSelected = value === item.url;
                  return (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        setUrlInput(item.url);
                      }}
                      className={cn(
                        "group relative rounded-sm overflow-hidden border text-left p-1 transition-all",
                        isSelected
                          ? "border-[#B22A2A] ring-2 ring-[#B22A2A]/40 bg-white"
                          : "border-[#E9DCC4] hover:border-[#92816A] bg-[#F9F4EC]"
                      )}
                    >
                      <div className="relative aspect-video w-full rounded-xs overflow-hidden mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#B22A2A]/40 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-[#3D2E1A] truncate px-1">
                        {item.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: URL Manual */}
      {activeTab === "url" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2E1A] mb-1">
              URL Immagine o Video
            </label>
            <div className="flex gap-2">
              <input
                className="inpt text-xs font-mono w-full"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Poster Image (if video) */}
      {isVideoFile && onPosterChange && (
        <div className="p-3 bg-[#F9F4EC] border border-[#E9DCC4] rounded-sm space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3D2E1A]">
            Copertina Poster del Video (Immagine)
          </label>
          <input
            className="inpt text-xs font-mono w-full bg-white"
            value={posterInput}
            onChange={(e) => {
              setPosterInput(e.target.value);
              onPosterChange(e.target.value);
            }}
            placeholder="https://... (URL immagine di copertina)"
          />
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-sm border border-rose-200">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
