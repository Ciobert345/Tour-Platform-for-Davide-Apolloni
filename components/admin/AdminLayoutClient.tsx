"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCog2,
  GraduationCap,
  Tags,
  Bus,
  Map as MapIcon,
  CalendarDays,
  MessageSquare,
  CalendarCheck,
  Info,
  Languages,
  LogOut,
  Home,
  ShieldCheck,
  MousePointerClick,
  Layers,
  Images,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
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
  { href: "/admin/events", label: "Eventi / Calendario", icon: CalendarDays },
  { href: "/admin/reviews", label: "Recensioni", icon: MessageSquare },
  { href: "/admin/bookings", label: "Prenotazioni", icon: CalendarCheck },
  {
    href: "/admin/legal",
    label: "Documenti Legali",
    icon: Shield,
    subtext: "Privacy · Termini · Cookie Policy",
  },
];

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
        "min-h-screen bg-[#F9F4EC] text-[#1E160A] font-sans flex",
        isLiveEditor && "h-screen overflow-hidden"
      )}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-[#E9DCC4] bg-white">
        <div className="p-5 border-b border-[#E9DCC4]">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B22A2A] to-[#4A6535] flex items-center justify-center text-white shadow">
              <span className="font-serif text-lg font-bold">D</span>
            </div>
            <div className="min-w-0">
              <p className="font-serif text-base font-semibold truncate">Davide Apolloni</p>
              <p className="text-[10px] uppercase tracking-wider text-[#B22A2A] font-bold">
                Admin Panel
              </p>
            </div>
          </Link>
          {userEmail && (
            <div className="bg-[#F9F4EC] border border-[#E9DCC4] rounded-sm p-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4A6535] shrink-0" />
              <span className="text-xs truncate text-[#5C4C38]">{userEmail}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((it) => {
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
                    ? "bg-[#B22A2A]/10 text-[#9C1C1C] border-l-2 border-[#B22A2A] pl-[10px]"
                    : "text-[#5C4C38] hover:bg-[#F9F4EC] hover:text-[#1E160A] border-l-2 border-transparent pl-[10px]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="truncate block">{it.label}</span>
                    {(it as any).subtext && (
                      <span className="text-[10px] text-[#92816A] block font-normal leading-none mt-0.5 group-hover:text-[#7A6655]">
                        {(it as any).subtext}
                      </span>
                    )}
                  </div>
                </div>
                {(it as any).badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#B22A2A]/20 text-[#9C1C1C] shrink-0">
                    {(it as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#E9DCC4] space-y-1.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-[#5C4C38] hover:bg-[#F9F4EC] transition-colors"
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-[#9C1C1C] hover:bg-[#9C1C1C]/5 transition-colors font-medium"
          >
            <LogOut className="w-4.5 h-4.5" />
            Esci
          </button>
        </div>
      </aside>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Mobile top bar */}
        <header className="md:hidden border-b border-[#E9DCC4] bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B22A2A] to-[#4A6535] flex items-center justify-center text-white">
              <span className="font-serif text-base font-bold">D</span>
            </div>
            <span className="font-serif font-semibold">Admin</span>
          </Link>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/admin/login";
              });
            }}
            className="text-sm text-[#9C1C1C] font-medium"
          >
            Esci
          </button>
        </header>
        {/* Mobile nav (tabs) */}
        <div className="md:hidden border-b border-[#E9DCC4] bg-white overflow-x-auto">
          <div className="flex gap-0.5 px-2 py-2">
            {NAV.slice(0, 8).map((it) => {
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
                    isActive ? "text-[#9C1C1C] bg-[#B22A2A]/10" : "text-[#7A6655]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {it.label.split(" ")[0]}
                </Link>
              );
            })}
          </div>
        </div>

        <main
          className={cn(
            "flex-1",
            isLiveEditor
              ? "p-0 max-w-none overflow-hidden flex flex-col min-h-0"
              : "p-4 md:p-8 max-w-[1400px] w-full mx-auto"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
