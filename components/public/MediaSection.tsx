"use client";
import { useState, useRef } from "react";
import EditableSectionHeading from "@/components/live-edit/EditableSectionHeading";
import Editable from "@/components/live-edit/Editable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveEdit } from "@/components/live-edit/LiveEditProvider";
import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import { stringValues } from "@/lib/live-edit/helpers";
import {
  Play,
  Image as ImageIcon,
  Sparkles,
  Film,
  ArrowUpRight,
  Link2,
  Video,
  X,
  Maximize2,
} from "lucide-react";
import Image from "next/image";
import MobileCarousel from "@/components/public/MobileCarousel";
import type { Database } from "@/types/database.types";

type MediaT = Database["public"]["Tables"]["media_items"]["Row"];

const FALLBACK_GALLERY: MediaT[] = [];

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  const ytRegex =
    /(?:youtube.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu.be\/|youtube-nocookie.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
  const match = clean.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&enablejsapi=1`;
  }
  if (clean.includes("youtube.com/embed/") || clean.includes("youtube-nocookie.com/embed/")) {
    return clean;
  }
  return null;
}

export function getVimeoEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  const match = clean.match(/vimeo.com\/(?:video\/)?(\d+)/i);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}?dnt=1`;
  }
  if (clean.includes("player.vimeo.com/video/")) return clean;
  return null;
}

export function resolveVideoSrc(src: string | null | undefined): {
  type: "youtube" | "vimeo" | "direct";
  embedUrl: string;
} {
  if (!src) return { type: "direct", embedUrl: "" };
  const yt = getYoutubeEmbedUrl(src);
  if (yt) return { type: "youtube", embedUrl: yt };
  const vi = getVimeoEmbedUrl(src);
  if (vi) return { type: "vimeo", embedUrl: vi };
  return { type: "direct", embedUrl: src.trim() };
}

export default function MediaSection({ media }: { media: MediaT[] }) {
  const t = useT();
  const { lang } = useLang();
  const { strings } = useLanguage();
  const liveEdit = useLiveEdit();
  const [isPlayingMp4, setIsPlayingMp4] = useState(false);
  const [modalMedia, setModalMedia] = useState<MediaT | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const gallery = media.length > 0 ? media : FALLBACK_GALLERY;
  const images = gallery.filter((m) => m.type === "image");
  const videos = gallery.filter((m) => m.type === "video");

  const videoPoster =
    strings["media.videoPoster"]?.[lang] ||
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80";
  const rawVideoSrc =
    strings["media.videoSrc"]?.[lang] ||
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const { type: videoType, embedUrl: videoSrc } = resolveVideoSrc(rawVideoSrc);
  const isEmbed = videoType === "youtube" || videoType === "vimeo";

  const handlePlayMp4 = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => { });
        setIsPlayingMp4(true);
      } else {
        videoRef.current.pause();
        setIsPlayingMp4(false);
      }
    }
  };

  return (
    <section id="media" className="section bg-[#F9F4EC]">
      <div className="container-app">
        <EditableSectionHeading
          section="Media"
          subtitleKey="media.subtitle"
          titleKey="media.title"
          descKey="media.desc"
        />

        <div className="section-divider">
          <span className="w-12 h-px bg-gold/50" />
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="w-12 h-px bg-gold/50" />
        </div>

        {images.length > 0 && (
          <div className="mb-8 sm:mb-16">
            <MobileCarousel
              hint={lang === "it" ? "← Scorri per vedere tutte le immagini →" : "← Swipe to see all photos →"}
            >
              {images.map((m, i) => (
                <GalleryFigure
                  key={m.id}
                  m={m}
                  i={i}
                  lang={lang}
                  onOpen={() => setModalMedia(m)}
                />
              ))}
            </MobileCarousel>
          </div>
        )}

        {videos.length > 0 && (
          <div className="mb-8 sm:mb-16">
            <div className="hidden md:flex items-center justify-end gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  const container = document.getElementById('video-carousel');
                  if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-current/15 text-current transition-colors duration-200 hover:bg-current/10"
                aria-label="Scorri a sinistra"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const container = document.getElementById('video-carousel');
                  if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-current/15 text-current transition-colors duration-200 hover:bg-current/10"
                aria-label="Scorri a destra"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div
              id="video-carousel"
              className="flex gap-7 overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x -mx-5 px-5 pb-3 md:mx-0 md:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {videos.map((m, i) => (
                <div key={m.id} className="shrink-0 snap-start w-[min(90vw,800px)] md:w-[min(85vw,900px)] lg:w-[min(75vw,1000px)]">
                  <VideoCard
                    m={m}
                    i={i}
                    lang={lang}
                    onOpen={() => setModalMedia(m)}
                  />
                </div>
              ))}
            </div>

            <p className="mt-2 text-center text-[10.5px] font-medium uppercase tracking-wider text-text-muted md:hidden">
              {lang === "it" ? "← Scorri per vedere tutti i video →" : "← Swipe to see all videos →"}
            </p>
          </div>
        )}

      </div>

      {modalMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setModalMedia(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-bg-card rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalMedia(null)}
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {getYoutubeEmbedUrl(modalMedia.url) ? (
                <iframe
                  src={getYoutubeEmbedUrl(modalMedia.url)!}
                  title={modalMedia.caption_it || "Video galleria"}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                />
              ) : getVimeoEmbedUrl(modalMedia.url) ? (
                <iframe
                  src={getVimeoEmbedUrl(modalMedia.url)!}
                  title={modalMedia.caption_it || "Video Vimeo"}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : modalMedia.type === "video" || modalMedia.url.endsWith(".mp4") ? (
                <video
                  src={modalMedia.url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <Image
                  src={modalMedia.url}
                  alt={modalMedia.caption_it || "Foto ingrandita"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              )}
            </div>
            {(modalMedia.caption_it || modalMedia.caption_en) && (
              <div className="p-4 bg-bg-card border-t border-black/10">
                <p className="text-sm font-medium text-text-main">
                  {lang === "it" ? modalMedia.caption_it : modalMedia.caption_en}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryFigure({
  m,
  i,
  lang,
  onOpen,
}: {
  m: MediaT;
  i: number;
  lang: "it" | "en";
  onOpen: () => void;
}) {
  const cap = (lang === "it" ? m.caption_it : m.caption_en) ?? m.caption_it;
  const isItemVideo =
    m.type === "video" ||
    getYoutubeEmbedUrl(m.url) !== null ||
    getVimeoEmbedUrl(m.url) !== null ||
    m.url.endsWith(".mp4");

  return (
    <figure
      className="relative group overflow-hidden rounded-xl aspect-[4/3] bg-bg-card border border-black/10 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onOpen}
    >
      <Editable
        id={`media-img-${m.id}`}
        label={`Foto/Video galleria ${i + 1}`}
        kind="media_item"
        mediaItemId={m.id}
        mediaItemField="url"
        section="Galleria Media"
        values={{ url: m.url, it: m.url, en: m.url }}
        as="block"
        className="w-full h-full"
      >
        <div className="relative w-full h-full">
          <Image
            src={
              m.url.includes("youtube") || m.url.includes("youtu.be")
                ? `https://img.youtube.com/vi/${getYoutubeEmbedUrl(m.url)?.match(/embed\/([a-zA-Z0-9_-]+)/)?.[1] || "default"}/hqdefault.jpg`
                : m.url
            }
            alt={cap || "Scorcio artistico"}
            fill
            sizes="(max-width: 768px) 86vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isItemVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <span className="w-12 h-12 rounded-full bg-[#9C1C1C]/90 text-white flex items-center justify-center shadow-lg ring-2 ring-gold/50 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </span>
            </div>
          )}
        </div>
      </Editable>
      <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/85 via-bg-dark/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <Editable
            id={`media-cap-${m.id}`}
            label={`Didascalia media ${i + 1} (IT/EN)`}
            kind="media_item"
            mediaItemId={m.id}
            mediaItemField="caption"
            section="Galleria Media"
            values={{ it: m.caption_it ?? "", en: m.caption_en ?? "" }}
            as="block"
            className="bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/10"
          >
            <figcaption className="text-text-white text-xs font-light flex items-center justify-between gap-2 leading-snug">
              <div className="flex items-center gap-2 min-w-0">
                {isItemVideo ? (
                  <Video className="w-3.5 h-3.5 text-gold shrink-0" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-gold shrink-0" />
                )}
                <span className="line-clamp-2">
                  {cap || "Clicca per aggiungere didascalia IT / EN"}
                </span>
              </div>
              <Maximize2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
            </figcaption>
          </Editable>
        </div>
      </div>
    </figure>
  );
}

function VideoCard({
  m,
  i,
  lang,
  onOpen,
}: {
  m: MediaT;
  i: number;
  lang: "it" | "en";
  onOpen: () => void;
}) {
  const cap = (lang === "it" ? (m as any).caption_it : (m as any).caption_en) ?? (m as any).caption_it;
  const { type: videoType, embedUrl } = resolveVideoSrc(m.url);
  const isEmbed = videoType === "youtube" || videoType === "vimeo";

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden grid lg:grid-cols-[1.25fr_0.75fr] h-full">
      <div className="relative bg-black aspect-video w-full lg:aspect-auto lg:min-h-[420px] flex items-center justify-center overflow-hidden">
        <Editable
          id={`media-video-url-${m.id}`}
          label={`URL Video ${i + 1}`}
          kind="media_item"
          mediaItemId={m.id}
          mediaItemField="url"
          section="Galleria Media"
          values={{ url: m.url, it: m.url, en: m.url }}
          as="block"
          className="w-full h-full"
        >
          {isEmbed ? (
            <div className="relative w-full h-full aspect-video lg:aspect-auto">
              <iframe
                src={embedUrl}
                title={cap || "Video"}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                src={m.url}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            </div>
          )}
        </Editable>

        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 z-10"
          aria-label="Apri video a schermo intero"
        >
          <span className="w-14 h-14 rounded-full bg-[#9C1C1C]/90 text-white flex items-center justify-center shadow-lg ring-2 ring-gold/50 transition-transform hover:scale-110">
            <Maximize2 className="w-6 h-6" />
          </span>
        </button>
      </div>

      <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
        <Editable
          id={`media-video-badge-${m.id}`}
          label={`Badge video ${i + 1}`}
          kind="string"
          stringKey={`media.videoBadge${m.id}`}
          section="Galleria Media"
          values={stringValues({}, `media.videoBadge${m.id}`)}
          as="block"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-terracotta mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>{lang === "it" ? "Video" : "Video"}</span>
          </div>
        </Editable>

        {/* TITOLO: usa il campo 'caption' */}
        <Editable
          id={`media-video-title-${m.id}`}
          label={`Titolo video ${i + 1} (IT/EN)`}
          kind="media_item"
          mediaItemId={m.id}
          mediaItemField="caption"
          section="Galleria Media"
          values={{ it: (m as any).caption_it ?? "", en: (m as any).caption_en ?? "" }}
          as="block"
        >
          <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-text-main leading-tight mb-3">
            {cap || `Video ${i + 1}`}
          </h3>
        </Editable>

        {/* DESCRIZIONE: usa il campo 'description' */}
        <Editable
          id={`media-video-desc-${m.id}`}
          label={`Descrizione video ${i + 1} (IT/EN)`}
          kind="media_item"
          mediaItemId={m.id}
          mediaItemField={"description" as any} // Cast sicuro per evitare errore TS se il tipo non è ancora aggiornato nel componente Editable
          section="Galleria Media"
          values={{
            it: (m as any).description_it ?? "",
            en: (m as any).description_en ?? ""
          }}
          as="block"
        >
          <p className="text-sm sm:text-base text-text-muted font-light leading-relaxed mb-6">
            {(m as any).description_it || (lang === "it" ? (m as any).caption_it : (m as any).caption_en) || "Clicca per aggiungere una descrizione"}
          </p>
        </Editable>

        {m.url && (
          <Editable
            id={`media-video-link-${m.id}`}
            label={`Link video ${i + 1}`}
            kind="media_item"
            mediaItemId={m.id}
            mediaItemField="url"
            section="Galleria Media"
            values={{ url: m.url, it: m.url, en: m.url }}
            as="block"
          >
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-terracotta hover:underline font-mono mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[240px]">
                {videoType === "youtube" ? "YouTube" : videoType === "vimeo" ? "Vimeo" : m.url}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </a>
          </Editable>
        )}
      </div>
    </article>
  );
}