import Link from "next/link";
import { fetchDashboardStats } from "@/lib/data/admin";
import {
  CalendarCheck,
  MessageSquare,
  CalendarDays,
  Star,
  Map as MapIcon,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { cn, formatDate, renderStars } from "@/lib/utils";

import AdminTutorial from "@/components/admin/AdminTutorial";
import MaintenanceToggle from "@/components/admin/MaintenanceToggle";

/* ============================================================
   DASHBOARD ADMIN — Server Component
   ============================================================ */
export default async function AdminDashboard() {
  // Fallback se Supabase non è raggiungibile (mancano env.local)
  const stats = await fetchDashboardStats().catch((err) => {
    console.warn("[AdminDashboard] fetch fallito:", err.message);
    return {
      newBookings: 0, pendingReviews: 0, upcomingEvents: 0,
      totalApprovedReviews: 0, totalPlaces: 0, totalEvents: 0,
      bookingsByMonth: [], latestBookings: [], latestReviews: [],
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1E160A] font-serif">
            Dashboard
          </h1>
          <p className="text-sm text-[#5C4C38] mt-1">
            Panoramica in tempo reale delle richieste, delle recensioni e del calendario
          </p>
        </div>
        
      </div>

      {/* Tutorial */}
      <AdminTutorial
        title="Benvenuto nel pannello di controllo Davide Apolloni"
        description="Da qui puoi monitorare le richieste in arrivo dai visitatori, moderare le recensioni e gestire tutte le sezioni del sito."
        badge="Guida Dashboard"
        steps={[
          {
            title: "1. Modifica Testi & Profilo",
            description: "Usa l'Editor Live per modificare al volo qualsiasi testo, foto, biografia, contatti, FAQ e curriculum.",
            badge: "Editor Live",
          },
          {
            title: "2. Gestione Tour, Luoghi & Eventi",
            description: "Crea e organizza le mete del Veneto e Trentino, le categorie e le date delle visite a calendario.",
            badge: "Destinazioni",
          },
          {
            title: "3. Prenotazioni & Recensioni",
            description: "Rispondi ai visitatori che hanno compilato il modulo e approva le testimonianze ricevute.",
            badge: "Interazioni",
          },
        ]}
        tips={[
          "Clicca sulle schede statistiche in alto per accedere rapidamente alle sezioni corrispondenti.",
          "Le richieste contrassegnate come 'Nuova' richiedono una risposta entro 24-48 ore.",
        ]}
        defaultOpen={false}
      />

      {/* ======== Modalita Manutenzione ======== */}
      <MaintenanceToggle />

      {/* ======== Stat cards ======== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Nuove richieste"
          value={stats.newBookings}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="terracotta"
          actionHref="/admin/bookings"
        />
        <StatCard
          label="Recensioni in attesa"
          value={stats.pendingReviews}
          icon={<MessageSquare className="w-5 h-5" />}
          color="olive"
          highlight={stats.pendingReviews > 0}
          actionHref="/admin/reviews"
        />
        <StatCard
          label="Prossimi eventi"
          value={stats.upcomingEvents}
          icon={<CalendarDays className="w-5 h-5" />}
          color="adria"
          actionHref="/admin/events"
        />
        <StatCard
          label="Recensioni approvate"
          value={stats.totalApprovedReviews}
          icon={<Star className="w-5 h-5" />}
          color="stone"
          actionHref="/admin/reviews"
        />
      </div>

      {/* ======== Righe tabella ======== */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Ultime prenotazioni */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-stone/40 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone/30 flex items-center justify-between">
            <h2 className="font-semibold text-[#1E160A] flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#9C1C1C]" />
              Ultime richieste ricevute
            </h2>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-[#9C1C1C] hover:underline flex items-center gap-0.5"
            >
              Vedi tutte <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.latestBookings.length === 0 ? (
            <EmptyState label="Ancora nessuna richiesta" />
          ) : (
            <div className="divide-y divide-[#F0E8D6]">
              {stats.latestBookings.map((b: any) => (
                <div
                  key={b.id}
                  className="px-5 py-3.5 hover:bg-[#F9F4EC] transition-colors flex items-start gap-4"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      b.status === "new"
                        ? "bg-[#9C1C1C]/10 text-[#9C1C1C]"
                        : b.status === "confirmed"
                          ? "bg-[#4A6535]/15 text-[#4A6535]"
                          : "bg-stone/30 text-[#8A6E3E]"
                    )}
                  >
                    <CalendarCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-[#1E160A] truncate">{b.full_name}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-[#5C4C38] truncate">
                      {b.email}
                      {b.phone && <> · {b.phone}</>}
                      {b.preferred_destination && (
                        <> · <MapIcon className="w-3 h-3 inline -mt-0.5" /> {b.preferred_destination}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#92816A] flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatDate(b.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ultime recensioni */}
        <div className="bg-white rounded-sm border border-stone/40 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone/30 flex items-center justify-between">
            <h2 className="font-semibold text-[#1E160A] flex items-center gap-2">
              <Star className="w-4.5 h-4.5 text-[#C4923A]" />
              Recensioni recenti
            </h2>
            <Link
              href="/admin/reviews"
              className="text-xs font-bold text-[#4A6535] hover:underline flex items-center gap-0.5"
            >
              Tutte <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.latestReviews.length === 0 ? (
            <EmptyState label="Ancora nessuna recensione" />
          ) : (
            <div className="divide-y divide-[#F0E8D6]">
              {stats.latestReviews.map((r: any) => (
                <div key={r.id} className="px-5 py-3.5 hover:bg-[#F9F4EC] transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-[#1E160A] truncate mr-2">
                      {r.author_name}
                    </p>
                    <span className="text-[#C4923A] text-sm">{renderStars(r.rating)}</span>
                  </div>
                  <p className="text-xs text-[#5C4C38] line-clamp-2 leading-relaxed mb-2">
                    {r.review_text}
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#92816A]">{formatDate(r.submitted_at)}</span>
                    {r.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-[#9C1C1C] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> In attesa
                      </span>
                    ) : r.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-[#4A6535] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Approvata
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#92816A] font-semibold">
                        Respinta
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-gradient-to-r from-[#244D68] to-[#3D6E90] text-white rounded-sm p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold mb-2">
            Sito pubblico
          </p>
          <p className="font-serif text-xl md:text-2xl font-semibold">
            Hai bisogno di modificare contenuti, date o approvare una recensione?
          </p>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Dal menu a sinistra puoi gestire in modo completo ogni sezione del
            sito. Tutti i cambiamenti si riflettono istantaneamente sul sito pubblico
            e sono salvati in modo sicuro nel database.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub: Stat card
   ============================================================ */
function StatCard({
  label, value, icon, color, actionHref, highlight,
}: {
  label: string; value: number; icon: React.ReactNode;
  color: "terracotta" | "olive" | "adria" | "stone";
  actionHref?: string; highlight?: boolean;
}) {
  const palettes = {
    terracotta: { bg: "bg-[#9C1C1C]/10", text: "text-[#9C1C1C]", ring: "ring-[#9C1C1C]/30" },
    olive:      { bg: "bg-[#4A6535]/10", text: "text-[#4A6535]", ring: "ring-[#4A6535]/30" },
    adria:      { bg: "bg-[#3D6E90]/10", text: "text-[#244D68]", ring: "ring-[#3D6E90]/30" },
    stone:      { bg: "bg-[#E8D5A8]/40", text: "text-[#8A6E3E]", ring: "ring-[#C4923A]/30" },
  } as const;
  const p = palettes[color];

  const content = (
    <div className={cn(
      "bg-white rounded-sm border border-stone/40 shadow-sm p-5 transition-all hover:-translate-y-0.5 hover:shadow-md h-full",
      highlight && `ring-2 ${p.ring}`
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center", p.bg, p.text)}>
          {icon}
        </div>
        {highlight && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9C1C1C] text-white uppercase tracking-wider animate-pulse">
            Nuovo
          </span>
        )}
      </div>
      <p className="text-3xl md:text-4xl font-bold text-[#1E160A] font-serif leading-none">
        {value.toLocaleString("it-IT")}
      </p>
      <p className="text-sm text-[#5C4C38] mt-2">{label}</p>
    </div>
  );

  if (actionHref) return <Link href={actionHref} className="block group">{content}</Link>;
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new:       "bg-[#9C1C1C]/10 text-[#9C1C1C] border-[#9C1C1C]/20",
    contacted: "bg-[#3D6E90]/10 text-[#244D68] border-[#3D6E90]/20",
    confirmed: "bg-[#4A6535]/10 text-[#4A6535] border-[#4A6535]/25",
    archived:  "bg-[#E8D5A8]/40 text-[#8A6E3E] border-[#C4923A]/20",
  };
  const labels: Record<string, string> = {
    new: "Nuova", contacted: "Contattata", confirmed: "Confermata", archived: "Archiviata",
  };
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm",
      map[status] || "bg-[#F0E8D6] text-[#5C4C38] border-[#E9DCC4]"
    )}>
      {labels[status] || status}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-5 py-12 text-center text-sm text-[#92816A]">
      {label}
    </div>
  );
}
