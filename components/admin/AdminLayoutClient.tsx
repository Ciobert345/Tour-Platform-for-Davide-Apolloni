"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  Bus,
  Map as MapIcon,
  CalendarDays,
  MessageSquare,
  CalendarCheck,
  LogOut,
  Home,
  ShieldCheck,
  MousePointerClick,
  Layers,
  Images,
  Shield,
  MapPinned,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/common/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  subtext?: string;
};

const NAV_GROUPS: { id: string; label?: string; items: NavItem[] }[] = [
  {
    id: "sito",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      {
        href: "/admin/live-editor",
        label: "Editor Live",
        icon: MousePointerClick,
        subtext: "Modifica visuale, Profilo, CV, FAQ",
      },
      { href: "/admin/banners", label: "Banner in Cima (Hero)", icon: Layers },
      { href: "/admin/gallery", label: "Galleria", icon: Images },
      { href: "/admin/tour-types", label: "Categorie Tour", icon: Tags },
      { href: "/admin/transport-modes", label: "Mezzi di Trasporto", icon: Bus },
      { href: "/admin/places", label: "Luoghi", icon: MapIcon },
    ],
  },
  {
    id: "mappa",
    label: "Mappa",
    items: [{ href: "/admin/map-spots", label: "Mete proposte", icon: MapPinned }],
  },
  {
    id: "gestione",
    label: "Gestione",
    items: [
      { href: "/admin/events", label: "Eventi / Calendario", icon: CalendarDays },
      { href: "/admin/reviews", label: "Recensioni", icon: MessageSquare },
      { href: "/admin/bookings", label: "Prenotazioni", icon: CalendarCheck },
      {
        href: "/admin/legal",
        label: "Documenti Legali",
        icon: Shield,
        subtext: "Privacy · Termini · Cookie Policy",
      },
    ],
  },
];

const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayoutClient({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const isLiveEditor = pathname === "/admin/live-editor";
  return (
    <div
      className={cn(
        "admin-shell h-dvh max-h-dvh overflow-hidden bg-[#F9F4EC] dark:bg-[#14100c] text-[#1E160A] dark:text-[#f5ede2] font-sans flex",
        isLiveEditor && "overflow-hidden"
      )}
    >
      {/* Sidebar: altezza viewport, tasti tema/sito/esci sempre visibili in basso */}
      <aside className="hidden md:flex md:w-64 lg:w-72 h-dvh shrink-0 flex-col border-r border-[#E9DCC4] dark:border-[#382b20] bg-white dark:bg-[#1c1611]">
        <div className="shrink-0 p-5 border-b border-[#E9DCC4] dark:border-[#382b20]">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <img
              src="/loghi/Guida-Veneto-e-Trentino.png"
              alt="Davide Apolloni"
              className="w-10 h-10 rounded-full object-cover shadow ring-1 ring-[#E9DCC4] dark:ring-[#382b20]"
            />
            <div className="min-w-0">
              <p className="font-serif text-base font-semibold truncate text-[#1E160A] dark:text-[#f5ede2]">Davide Apolloni</p>
              <p className="text-[10px] uppercase tracking-wider text-[#B22A2A] dark:text-[#f07f82] font-bold">
                Admin Panel
              </p>
            </div>
          </Link>
          {userEmail && (
            <div className="bg-[#F9F4EC] dark:bg-[#251e17] border border-[#E9DCC4] dark:border-[#382b20] rounded-sm p-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C4923A] dark:text-[#a6cf8c] shrink-0" />
              <span className="text-xs truncate text-[#5C4C38] dark:text-[#c7b59f]">{userEmail}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 min-h-0 p-3 overflow-y-auto overscroll-contain">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} className={cn(gi > 0 && "mt-3 pt-3 border-t border-[#E9DCC4] dark:border-[#382b20]")}>
              {group.label && (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#92816A] dark:text-[#9e8b78]">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((it) => {
                  const Icon = it.icon;
                  const isActive = it.exact
                    ? pathname === it.href
                    : pathname === it.href || pathname.startsWith(it.href + "/");
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={cn(
                        "flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors group",
                        isActive
                          ? "bg-[#B22A2A]/10 text-[#9C1C1C] dark:text-[#f28588] border-l-2 border-[#B22A2A] pl-[10px]"
                          : "text-[#5C4C38] dark:text-[#c7b59f] hover:bg-[#F9F4EC] dark:hover:bg-[#251e17] hover:text-[#1E160A] dark:hover:text-[#f5ede2] border-l-2 border-transparent pl-[10px]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="truncate block">{it.label}</span>
                          {it.subtext && (
                            <span className="text-[10px] text-[#92816A] dark:text-[#9e8b78] block font-normal leading-none mt-0.5 group-hover:text-[#7A6655] dark:group-hover:text-[#c7b59f]">
                              {it.subtext}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-[#E9DCC4] dark:border-[#382b20] space-y-2 bg-white dark:bg-[#1c1611]">
          {/* Theme Toggle nella Sidebar Admin */}
          <ThemeToggle variant="admin" />

          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-[#5C4C38] dark:text-[#c7b59f] hover:bg-[#F9F4EC] dark:hover:bg-[#251e17] transition-colors"
            target="_blank"
          >
            <Home className="w-4.5 h-4.5" />
            Vedi sito pubblico ↗
          </Link>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/admin/login";
              });
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-[#9C1C1C] dark:text-[#f28588] hover:bg-[#9C1C1C]/10 transition-colors font-medium cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            Esci
          </button>
        </div>
      </aside>

      {/* Body */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden shrink-0 border-b border-[#E9DCC4] dark:border-[#382b20] bg-white dark:bg-[#1c1611] px-4 py-3 flex items-center justify-between z-30">
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="/loghi/Guida-Veneto-e-Trentino.png"
              alt="Davide Apolloni"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-[#E9DCC4] dark:ring-[#382b20]"
            />
            <span className="font-serif font-semibold text-[#1E160A] dark:text-[#f5ede2]">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" />
            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" }).then(() => {
                  window.location.href = "/admin/login";
                });
              }}
              className="text-sm text-[#9C1C1C] dark:text-[#f28588] font-medium"
            >
              Esci
            </button>
          </div>
        </header>
        {/* Mobile nav (tabs) */}
        <div className="md:hidden shrink-0 border-b border-[#E9DCC4] dark:border-[#382b20] bg-white dark:bg-[#1c1611] overflow-x-auto">
          <div className="flex gap-0.5 px-2 py-2">
            {NAV_FLAT.slice(0, 8).map((it) => {
              const Icon = it.icon;
              const isActive = it.exact
                ? pathname === it.href
                : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  title={it.label}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-sm flex flex-col items-center gap-0.5 text-[10px] font-medium",
                    isActive ? "text-[#9C1C1C] dark:text-[#f28588] bg-[#B22A2A]/10" : "text-[#7A6655] dark:text-[#c7b59f]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {it.label.split(" ")[0]}
                </Link>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "admin-scroll flex-1 min-h-0",
            isLiveEditor ? "overflow-hidden flex flex-col" : "overflow-y-auto overscroll-contain"
          )}
        >
          <main
            className={cn(
              isLiveEditor
                ? "flex-1 min-h-0 p-0 max-w-none overflow-hidden flex flex-col"
                : "p-4 md:p-8 max-w-[1400px] w-full mx-auto"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
