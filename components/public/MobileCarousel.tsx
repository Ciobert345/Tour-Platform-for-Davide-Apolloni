"use client";
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
Su mobile: carosello orizzontale con scroll-snap (swipe touch).
Da md in su: griglia (2 / 3 colonne) — a meno che `desktopMode="scroll"`,
nel qual caso resta un carosello orizzontale anche da desktop, con
scrollbar nascosta e due frecce di navigazione in una barretta sopra
il carosello (invece che sovrapposte alle card).
Se c'è un solo elemento, viene centrato invece di essere allargato
o allineato a sinistra.
Un solo set di children nel DOM (niente duplicati).
*/
export default function MobileCarousel({
  children,
  className,
  hint,
  hintClassName,
  desktopMode = "grid",
  childWidth,
}: {
  children: ReactNode;
  className?: string;
  hint?: string;
  hintClassName?: string;
  /*
  "grid" (default): da md in su gli elementi vanno in griglia a 2/3 colonne.
  "scroll": anche da md in su restano in scroll orizzontale invece di
  andare a capo su più righe — mostra anche le frecce di navigazione.
  */
  desktopMode?: "grid" | "scroll";
  childWidth?: string; // ← NUOVA PROP: sovrascrive le larghezze default dei figli
}) {
  const count = Children.count(children);
  const isSingle = count === 1;
  const isDesktopScroll = desktopMode === "scroll" && !isSingle;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (!isDesktopScroll) return;
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [isDesktopScroll, updateScrollState, count]);

  const scrollByStep = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const step = firstChild
      ? firstChild.getBoundingClientRect().width + 28
      : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <>
      {/* Barra frecce — solo desktop, solo in modalità scroll */}
      {isDesktopScroll && (
        <div className="hidden md:flex items-center justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            aria-label="Scorri a sinistra"
            disabled={!canScrollLeft}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full border border-current/15",
              "text-current transition-colors duration-200 hover:bg-current/10",
              "disabled:opacity-30 disabled:pointer-events-none"
            )}
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            aria-label="Scorri a destra"
            disabled={!canScrollRight}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full border border-current/15",
              "text-current transition-colors duration-200 hover:bg-current/10",
              "disabled:opacity-30 disabled:pointer-events-none"
            )}
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      <div
        ref={scrollerRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={cn(
          "flex gap-3.5 md:gap-7",
          isDesktopScroll ? "md:flex" : "md:grid md:grid-cols-2 lg:grid-cols-3",
          "overflow-x-auto snap-x snap-mandatory",
          isDesktopScroll ? "md:overflow-x-auto md:snap-x md:snap-mandatory" : "md:overflow-visible md:snap-none",
          "[&::-webkit-scrollbar]:hidden scrollbar-hide overscroll-x-contain touch-pan-x",
          isDesktopScroll ? "md:touch-pan-x" : "md:touch-auto",
          "-mx-4 px-4 sm:-mx-5 sm:px-5",
          isDesktopScroll ? "" : "md:mx-0 md:px-0",
          "pb-3 md:pb-0",
          isSingle && "justify-center",
          className
        )}
      >
        {Children.map(children, (child) => (
          <div
            className={cn(
              "shrink-0 snap-start",
              // ← Se childWidth è passata, usa quella; altrimenti le classi default
              childWidth
                ? childWidth
                : isSingle
                  ? "w-[min(76vw,290px)] xs:w-[min(78vw,320px)] md:w-full md:max-w-sm"
                  : isDesktopScroll
                    ? "w-[min(76vw,290px)] xs:w-[min(78vw,320px)] md:w-[min(42vw,340px)] lg:w-[min(30vw,360px)] md:shrink-0"
                    : "w-[min(76vw,290px)] xs:w-[min(78vw,320px)] md:w-auto md:min-w-0 md:shrink"
            )}
          >
            {child}
          </div>
        ))}
      </div>
      {hint && count > 1 ? (
        <p
          className={cn(
            "mt-2 text-center text-[10.5px] font-medium uppercase tracking-wider",
            isDesktopScroll ? "" : "md:hidden",
            hintClassName ?? "text-text-muted"
          )}
        >
          {hint}
        </p>
      ) : null}
    </>
  );
}