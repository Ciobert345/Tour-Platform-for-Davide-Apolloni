import React from "react";
import {
  GraduationCap, Landmark, Castle, Mountain, Bike, Calendar, MapPin,
  Clock, Mail, Phone, Hourglass, Sparkles, Star, Award, Heart, Camera,
  BookOpen, Palette, Music, Compass, Map, Globe, Sun, Trees, Footprints,
  Plane, Sailboat, Church, Crown, Shield, History, Ticket, Coffee,
  Utensils, Wine, Car, Bus, CheckCircle2, Info, Flame, Zap, Lightbulb,
  Eye, HelpCircle, Users, Building, Flag, Moon, Library, Quote, Send,
  Play, FileText, ChevronRight, CalendarDays, CircleDollarSign,
  MessageSquare, ShieldCheck, Bookmark, Navigation, PenTool, Feather,
  type LucideProps,
} from "lucide-react";

export type IconCategory =
  | "Cultura & Arte"
  | "Natura & Viaggi"
  | "Storia & Luoghi"
  | "Attività & Servizi"
  | "Riconoscimenti & Simboli";

export const AVAILABLE_ICONS: Record<
  string,
  { label: string; category: IconCategory; component: React.ComponentType<LucideProps> }
> = {
  // Cultura & Arte
  GraduationCap: { label: "Laurea / Accademia", category: "Cultura & Arte", component: GraduationCap },
  Landmark: { label: "Monumento / Museo", category: "Cultura & Arte", component: Landmark },
  BookOpen: { label: "Libro / Letteratura", category: "Cultura & Arte", component: BookOpen },
  Library: { label: "Biblioteca", category: "Cultura & Arte", component: Library },
  Palette: { label: "Arte / Pittura", category: "Cultura & Arte", component: Palette },
  Music: { label: "Musica / Opera", category: "Cultura & Arte", component: Music },
  History: { label: "Storia", category: "Cultura & Arte", component: History },
  Building: { label: "Edificio Storico", category: "Cultura & Arte", component: Building },
  PenTool: { label: "Scrittura / Autore", category: "Cultura & Arte", component: PenTool },
  Feather: { label: "Piuma / Letteratura", category: "Cultura & Arte", component: Feather },
  FileText: { label: "Documento / CV", category: "Cultura & Arte", component: FileText },

  // Natura & Viaggi
  Mountain: { label: "Montagna / Alpi", category: "Natura & Viaggi", component: Mountain },
  Compass: { label: "Bussola / Navigazione", category: "Natura & Viaggi", component: Compass },
  Navigation: { label: "Rotta / Itinerario", category: "Natura & Viaggi", component: Navigation },
  MapPin: { label: "Posizione / Luogo", category: "Natura & Viaggi", component: MapPin },
  Map: { label: "Mappa / Territorio", category: "Natura & Viaggi", component: Map },
  Globe: { label: "Mondo / Geografia", category: "Natura & Viaggi", component: Globe },
  Sun: { label: "Sole / Tramonto", category: "Natura & Viaggi", component: Sun },
  Moon: { label: "Luna / Notturna", category: "Natura & Viaggi", component: Moon },
  Trees: { label: "Natura / Boschi", category: "Natura & Viaggi", component: Trees },
  Footprints: { label: "Passeggiata / Trekking", category: "Natura & Viaggi", component: Footprints },
  Plane: { label: "Viaggio / Aereo", category: "Natura & Viaggi", component: Plane },
  Sailboat: { label: "Barca / Riviera", category: "Natura & Viaggi", component: Sailboat },

  // Storia & Luoghi
  Castle: { label: "Castello / Fortezza", category: "Storia & Luoghi", component: Castle },
  Church: { label: "Chiesa / Basilica", category: "Storia & Luoghi", component: Church },
  Shield: { label: "Scudo / Grande Guerra", category: "Storia & Luoghi", component: Shield },
  Hourglass: { label: "Clessidra / Slow Tourism", category: "Storia & Luoghi", component: Hourglass },
  Crown: { label: "Corona / Nobiltà", category: "Storia & Luoghi", component: Crown },
  Flag: { label: "Bandiera / Nazione", category: "Storia & Luoghi", component: Flag },
  ShieldCheck: { label: "Sicurezza / Verificato", category: "Storia & Luoghi", component: ShieldCheck },

  // Attività & Servizi
  Bike: { label: "Bicicletta / Cicloturismo", category: "Attività & Servizi", component: Bike },
  Car: { label: "Auto / Trasporto", category: "Attività & Servizi", component: Car },
  Bus: { label: "Bus / Gruppi", category: "Attività & Servizi", component: Bus },
  Camera: { label: "Fotografia / Media", category: "Attività & Servizi", component: Camera },
  Play: { label: "Video / Play", category: "Attività & Servizi", component: Play },
  Ticket: { label: "Biglietto / Accesso", category: "Attività & Servizi", component: Ticket },
  Coffee: { label: "Caffè / Pausa", category: "Attività & Servizi", component: Coffee },
  Utensils: { label: "Ristorazione / Pranzi", category: "Attività & Servizi", component: Utensils },
  Wine: { label: "Vino / Degustazione", category: "Attività & Servizi", component: Wine },
  Calendar: { label: "Calendario / Date", category: "Attività & Servizi", component: Calendar },
  CalendarDays: { label: "Giorni / Programma", category: "Attività & Servizi", component: CalendarDays },
  Clock: { label: "Orologio / Orari", category: "Attività & Servizi", component: Clock },
  Phone: { label: "Telefono / Chiamate", category: "Attività & Servizi", component: Phone },
  Mail: { label: "Email / Contatto", category: "Attività & Servizi", component: Mail },
  Send: { label: "Invia / Messaggio", category: "Attività & Servizi", component: Send },
  Users: { label: "Gruppi / Persone", category: "Attività & Servizi", component: Users },

  // Riconoscimenti & Simboli
  Sparkles: { label: "Scintille / Esclusivo", category: "Riconoscimenti & Simboli", component: Sparkles },
  Star: { label: "Stella / Recensioni", category: "Riconoscimenti & Simboli", component: Star },
  Award: { label: "Premio / Riconoscimento", category: "Riconoscimenti & Simboli", component: Award },
  Heart: { label: "Cuore / Passione", category: "Riconoscimenti & Simboli", component: Heart },
  CheckCircle2: { label: "Spunta / Verificato", category: "Riconoscimenti & Simboli", component: CheckCircle2 },
  Info: { label: "Informazione / Avviso", category: "Riconoscimenti & Simboli", component: Info },
  Flame: { label: "Fiamma / Ultimi posti", category: "Riconoscimenti & Simboli", component: Flame },
  Zap: { label: "Fulmine / Novità", category: "Riconoscimenti & Simboli", component: Zap },
  Lightbulb: { label: "Lampadina / Idee", category: "Riconoscimenti & Simboli", component: Lightbulb },
  Eye: { label: "Occhio / Visione", category: "Riconoscimenti & Simboli", component: Eye },
  HelpCircle: { label: "Domanda / FAQ", category: "Riconoscimenti & Simboli", component: HelpCircle },
  Quote: { label: "Citazione / Virgolette", category: "Riconoscimenti & Simboli", component: Quote },
  CircleDollarSign: { label: "Prezzo / Offerta", category: "Riconoscimenti & Simboli", component: CircleDollarSign },
  Bookmark: { label: "Segnalibro / Salva", category: "Riconoscimenti & Simboli", component: Bookmark },
  MessageSquare: { label: "Commento / Recensione", category: "Riconoscimenti & Simboli", component: MessageSquare },
};

export const ICON_CATEGORIES: IconCategory[] = [
  "Cultura & Arte",
  "Natura & Viaggi",
  "Storia & Luoghi",
  "Attività & Servizi",
  "Riconoscimenti & Simboli",
];

export function renderIconByName(
  iconName: string | null | undefined,
  props: LucideProps = {},
  Fallback: React.ComponentType<LucideProps> = Info
): React.ReactElement {
  if (!iconName) return <Fallback {...props} />;
  const found = AVAILABLE_ICONS[iconName];
  if (found) {
    const Comp = found.component;
    return <Comp {...props} />;
  }
  return <Fallback {...props} />;
}

