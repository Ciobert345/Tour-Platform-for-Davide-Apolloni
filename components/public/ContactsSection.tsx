"use client";

import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import Editable from "@/components/live-edit/Editable";
import { stringValues } from "@/lib/live-edit/helpers";
import { tFieldStr } from "@/lib/utils";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { Mail, Phone, MapPin, Clock, AlertTriangle, Sparkles, MessageCircle } from "lucide-react";
import type { Database, Lang } from "@/types/database.types";

type ProfileT = Database["public"]["Tables"]["profiles"]["Row"] | null;
type ContactT = Database["public"]["Tables"]["contacts"]["Row"];

export default function ContactsSection({
  profile,
  contacts,
}: {
  profile: ProfileT;
  contacts: ContactT[];
}) {
  const t = useT();
  const { lang } = useLang();
  const { strings } = useLanguage();

  const FALLBACK_CONTACTS: ContactT[] = [
    {
      id: "cnt_email",
      profile_id: profile?.id || "",
      type: "email",
      label_it: "Email Principale",
      label_en: "Primary Email",
      value: "guidaturistica@davideapolloni.it",
      sort_order: 1,
      created_at: "",
    },
    {
      id: "cnt_phone",
      profile_id: profile?.id || "",
      type: "phone",
      label_it: "Telefono / Cellulare",
      label_en: "Phone / Mobile",
      value: "+39 347 0000000",
      sort_order: 2,
      created_at: "",
    },
    {
      id: "cnt_whatsapp",
      profile_id: profile?.id || "",
      type: "whatsapp",
      label_it: "WhatsApp Rapido",
      label_en: "WhatsApp Chat",
      value: "+39 347 0000000",
      sort_order: 3,
      created_at: "",
    },
  ];

  const contactList = (contacts && contacts.length > 0) ? contacts : FALLBACK_CONTACTS;

  return (
    <section
      id="contatti"
      className="scroll-mt-24 relative overflow-hidden"
      style={{
        backgroundColor: "var(--color-terracotta-dark)",
        color: "var(--text-white)",
      }}
    >
      {/* Decoro sfondo — stessa palette di ExclusiveSection */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none"
        style={{ backgroundColor: "var(--color-terracotta)", opacity: 0.15 }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[160px] pointer-events-none"
        style={{ backgroundColor: "var(--color-stone)", opacity: 0.15 }}
      />

      <div className="container-app py-8 sm:py-14 md:py-24 relative z-10">
        <div className="text-center mb-6 sm:mb-12 md:mb-16">
          <Editable
            id="contacts.subtitle"
            label="Sottotitolo contatti"
            kind="string"
            stringKey="contacts.subtitle"
            section="Contatti"
            values={stringValues(strings, "contacts.subtitle")}
          >
            <span
              className="eyebrow-dark mb-1.5 sm:mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest font-medium border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: "rgba(222, 197, 165, 0.3)",
                color: "var(--color-stone)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-stone)" }} />
              <span>{t("contacts.subtitle")}</span>
            </span>
          </Editable>
          <Editable
            id="contacts.title"
            label="Titolo contatti"
            kind="string"
            stringKey="contacts.title"
            section="Contatti"
            values={stringValues(strings, "contacts.title")}
            as="block"
          >
            <h2
              className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-[3.5rem] font-bold mt-1 mb-2 sm:mb-4 leading-[1.12]"
              style={{ color: "var(--text-white)" }}
            >
              {t("contacts.title")}
            </h2>
          </Editable>
          <div className="section-divider my-2.5 sm:my-4">
            <span className="w-12 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.4)" }} />
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-stone)" }} />
            <span className="w-12 h-px" style={{ backgroundColor: "rgba(222, 197, 165, 0.4)" }} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 sm:gap-8 md:gap-10 items-stretch max-w-5xl mx-auto">
          {/* CARD CONTATTI */}
          <div
            className="backdrop-blur-md border rounded-2xl p-4 sm:p-8 md:p-10 shadow-md"
            style={{
              backgroundColor: "rgba(36, 26, 18, 0.45)",
              borderColor: "rgba(222, 197, 165, 0.2)",
            }}
          >
            <Editable
              id="contacts.heading"
              label="Titolo riquadro contatti"
              kind="string"
              stringKey="contacts.heading"
              section="Contatti"
              values={stringValues(strings, "contacts.heading")}
              as="block"
            >
              <h3
                className="font-serif text-lg sm:text-2xl md:text-3xl font-bold mb-3.5 sm:mb-6"
                style={{ color: "var(--text-white)" }}
              >
                {t("contacts.heading", lang === "it" ? "Recapiti & Disponibilità" : "Contact Details")}
              </h3>
            </Editable>
            <ul className="space-y-2.5 sm:space-y-4">
              {contactList.map((c) => (
                <ContactRow key={c.id} c={c} />
              ))}
              <li
                className="flex items-start gap-3 sm:gap-4 pt-3 sm:pt-4 border-t mt-3.5 sm:mt-6"
                style={{ borderColor: "rgba(222, 197, 165, 0.2)" }}
              >
                <span
                  className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(222, 197, 165, 0.1)", color: "var(--color-stone)" }}
                >
                  <EditableIcon
                    id="contacts.hours.icon"
                    iconName={strings["contacts.hours.icon"]?.it || "Clock"}
                    stringKey="contacts.hours.icon"
                    label="Icona Orari"
                    iconProps={{ className: "w-4 h-4 sm:w-5 sm:h-5", style: { color: "var(--color-stone)" } }}
                  />
                </span>
                <div>
                  <Editable
                    id="contacts.hours"
                    label="Etichetta orari"
                    kind="string"
                    stringKey="contacts.hours"
                    section="Contatti"
                    values={stringValues(strings, "contacts.hours")}
                  >
                    <p
                      className="text-[10.5px] sm:text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-stone)" }}
                    >
                      {t("contacts.hours")}
                    </p>
                  </Editable>
                  <Editable
                    id="contacts.hoursD"
                    label="Descrizione orari e disponibilità"
                    kind="string"
                    stringKey="contacts.hoursD"
                    section="Contatti"
                    values={stringValues(strings, "contacts.hoursD")}
                    as="block"
                  >
                    <p
                      className="text-xs sm:text-sm mt-0.5 leading-relaxed font-light"
                      style={{ color: "rgba(247, 240, 227, 0.8)" }}
                    >
                      {t("contacts.hoursD")}
                    </p>
                  </Editable>
                </div>
              </li>
              <li className="flex items-start gap-3 sm:gap-4">
                <span
                  className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(222, 197, 165, 0.1)", color: "var(--color-terracotta)" }}
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "var(--color-terracotta)" }} />
                </span>
                <div>
                  <Editable
                    id="contacts.area"
                    label="Etichetta zona operativa"
                    kind="string"
                    stringKey="contacts.area"
                    section="Contatti"
                    values={stringValues(strings, "contacts.area")}
                  >
                    <p
                      className="text-[10.5px] sm:text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-stone)" }}
                    >
                      {t("contacts.area")}
                    </p>
                  </Editable>
                  <Editable
                    id="profile.operating_area"
                    label="Zona operativa (it/en)"
                    kind="profile"
                    profileField="operating_area"
                    section="Contatti"
                    values={{
                      it: profile?.operating_area_it || "Regione Veneto e Provincia Autonoma di Trento",
                      en: profile?.operating_area_en || "Veneto Region & Autonomous Province of Trentino",
                    }}
                    as="block"
                  >
                    <p
                      className="text-xs sm:text-sm mt-0.5 leading-relaxed font-light"
                      style={{ color: "rgba(247, 240, 227, 0.8)" }}
                    >
                      {profile?.operating_area_it && lang === "it"
                        ? profile.operating_area_it
                        : profile?.operating_area_en ??
                        (lang === "it"
                          ? "Regione Veneto e Provincia Autonoma di Trento"
                          : "Veneto Region & Autonomous Province of Trentino")}
                    </p>
                  </Editable>
                </div>
              </li>
            </ul>
          </div>

          {/* BOX INFO CONTATTO DIRETTO */}
          <div
            className="rounded-2xl p-4 sm:p-8 md:p-10 shadow-lg border flex flex-col justify-between relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-dark) 100%)",
              borderColor: "rgba(222, 197, 165, 0.2)",
              color: "var(--text-white)",
            }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-14 -left-6 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative">
              <div className="mb-3 sm:mb-5">
                <Editable
                  id="contacts.info"
                  label="Badge nota importante"
                  kind="string"
                  stringKey="contacts.info"
                  section="Contatti"
                  values={stringValues(strings, "contacts.info")}
                >
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-xs"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "var(--text-white)" }}
                  >
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: "var(--color-stone)" }} />
                    {t("contacts.info")}
                  </div>
                </Editable>
              </div>

              <Editable
                id="contacts.boxTitle"
                label="Domanda / Titolo box contatti"
                kind="string"
                stringKey="contacts.boxTitle"
                section="Contatti"
                values={stringValues(strings, "contacts.boxTitle")}
                as="block"
              >
                <h4
                  className="font-serif text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 leading-tight"
                  style={{ color: "var(--text-white)" }}
                >
                  {t("contacts.boxTitle")}
                </h4>
              </Editable>

              <Editable
                id="contacts.boxDesc"
                label="Testo risposta box contatti"
                kind="string"
                stringKey="contacts.boxDesc"
                section="Contatti"
                values={stringValues(strings, "contacts.boxDesc")}
                as="block"
              >
                <p
                  className="leading-relaxed mb-2.5 sm:mb-4 font-light text-xs sm:text-base"
                  style={{ color: "rgba(247, 240, 227, 0.85)" }}
                >
                  {t("contacts.boxDesc")}
                </p>
              </Editable>

              <Editable
                id="contacts.boxNote"
                label="Nota per gruppi numerosi"
                kind="string"
                stringKey="contacts.boxNote"
                section="Contatti"
                values={stringValues(strings, "contacts.boxNote")}
                as="block"
              >
                <p
                  className="leading-relaxed mb-4 sm:mb-6 font-light text-xs sm:text-sm"
                  style={{ color: "rgba(247, 240, 227, 0.8)" }}
                >
                  {t("contacts.boxNote")}
                </p>
              </Editable>
            </div>

            <div className="relative pt-1 sm:pt-2">
              <Editable
                id="contacts.cta"
                label="Testo pulsante contatti"
                kind="string"
                stringKey="contacts.cta"
                section="Contatti"
                values={stringValues(strings, "contacts.cta")}
                as="block"
              >
                <a
                  href="#prenota"
                  className="btn w-full justify-center shadow-md font-bold py-2 sm:py-3 text-xs sm:text-sm"
                  style={{ backgroundColor: "var(--bg-main)", color: "var(--color-terracotta)" }}
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {t("contacts.cta")}
                </a>
              </Editable>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Riga singolo contatto */
function ContactRow({ c }: { c: ContactT }) {
  const { lang } = useLang();
  const label = tFieldStr(c as any, "label", lang);
  const val = c.value;
  let href = "#";
  let Icon = Mail;

  switch (c.type) {
    case "email":
      href = `mailto:${val}`;
      Icon = Mail;
      break;
    case "phone":
      href = `tel:${val.replace(/[\s-]/g, "")}`;
      Icon = Phone;
      break;
    case "whatsapp":
      href = `https://wa.me/${val.replace(/\D/g, "")}`;
      Icon = MessageCircle;
      break;
    default:
      Icon = MapPin;
  }

  return (
    <li>
      <div className="flex items-start gap-3 sm:gap-4 py-0.5 sm:py-1">
        <span
          className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(222, 197, 165, 0.1)", color: "var(--color-stone)" }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <Editable
            id={`cnt-label-${c.id}`}
            label={`Etichetta contatto (${c.type})`}
            kind="contact"
            contactId={c.id}
            contactField="label"
            section="Contatti"
            values={{ it: c.label_it ?? "", en: c.label_en ?? "" }}
          >
            <p
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              style={{ color: "rgba(247, 240, 227, 0.5)" }}
            >
              {label}
            </p>
          </Editable>
          <Editable
            id={`cnt-val-${c.id}`}
            label={`Valore contatto (${c.type})`}
            kind="contact"
            contactId={c.id}
            contactField="value"
            section="Contatti"
            values={{ it: val, en: val }}
            as="block"
          >
            <a
              href={href}
              className="text-xs xs:text-sm sm:text-lg font-medium break-all xs:break-words transition-colors block mt-0.5 text-white hover:[color:var(--color-stone)]"
              target={c.type === "whatsapp" ? "_blank" : undefined}
              rel={c.type === "whatsapp" ? "noopener noreferrer" : undefined}
            >
              {val}
            </a>
          </Editable>
        </div>
      </div>
    </li>
  );
}