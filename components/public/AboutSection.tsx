"use client";

import React, { useState } from "react";
import { useLang, useT, useLanguage } from "@/lib/i18n/LanguageProvider";
import { tFieldStr, cn } from "@/lib/utils";
import Editable from "@/components/live-edit/Editable";
import EditableIcon from "@/components/live-edit/EditableIcon";
import { stringValues, profileValues, imageValue } from "@/lib/live-edit/helpers";
import { FileText, ChevronRight, GraduationCap, BookOpen, Landmark, Award } from "lucide-react";
import Image from "next/image";
import type { Database, Lang } from "@/types/database.types";

type ProfileT = Database["public"]["Tables"]["profiles"]["Row"] & {
  credentials?: Database["public"]["Tables"]["credentials"]["Row"][];
  contacts?: Database["public"]["Tables"]["contacts"]["Row"][];
};
type CredentialT = Database["public"]["Tables"]["credentials"]["Row"];

export default function AboutSection({
  profile,
  cvItems,
}: {
  profile: ProfileT | null;
  cvItems: Database["public"]["Tables"]["cv_items"]["Row"][];
}) {
  const t = useT();
  const { lang } = useLang();
  const { strings } = useLanguage();
  const [cvOpen, setCvOpen] = React.useState(false); // kept for compat but not needed
  const photo = profile?.photo_url;

  const FALLBACK_CREDS: CredentialT[] = [
    {
      id: "cred_1",
      profile_id: profile?.id || "",
      title_it: "Formazione di Eccellenza",
      title_en: "Excellence in Education",
      description_it: "Laurea e Specializzazione in Storia dell'Arte a Padova, Master in Storia della Letteratura ed Età Moderna.",
      description_en: "Degree and Specialization in Art History in Padua, Master in History of Literature and Modern Era.",
      icon: "GraduationCap",
      sort_order: 1,
      created_at: "",
    },
    {
      id: "cred_2",
      profile_id: profile?.id || "",
      title_it: "Autore & Formatore",
      title_en: "Author & Trainer",
      description_it: "Collaboratore delle case editrici Rizzoli ed Erickson per manuali scolastici e guide per docenti.",
      description_en: "Contributor to Rizzoli and Erickson publishers for school textbooks and teacher guides.",
      icon: "BookOpen",
      sort_order: 2,
      created_at: "",
    },
    {
      id: "cred_3",
      profile_id: profile?.id || "",
      title_it: "Istituzioni Culturali",
      title_en: "Cultural Institutions",
      description_it: "Esperienze di ricerca presso Castelvecchio (Verona), Fondazione Cini (Venezia) ed École du Louvre (Parigi).",
      description_en: "Research experiences at Castelvecchio (Verona), Cini Foundation (Venice), and École du Louvre (Paris).",
      icon: "Landmark",
      sort_order: 3,
      created_at: "",
    },
    {
      id: "cred_4",
      profile_id: profile?.id || "",
      title_it: "Grande Guerra 1915-1918",
      title_en: "Great War 1915-1918",
      description_it: "Specializzato sui luoghi della Prima Guerra Mondiale nell'Altopiano di Asiago, Lavarone e Luserna.",
      description_en: "Specialized in WWI battle sites across the Asiago Plateau, Lavarone, and Luserna.",
      icon: "Award",
      sort_order: 4,
      created_at: "",
    },
  ];

  const creds: CredentialT[] = (Array.isArray((profile as any)?.credentials) && (profile as any).credentials.length > 0)
    ? (profile as any).credentials
    : FALLBACK_CREDS;

  const stripHtml = (s: string) => (s || "").replace(/<[^>]*>/g, "").trim();

  const name = stripHtml(
    `${tFieldStr(profile ?? ({} as any), "first_name", lang)} ${tFieldStr(
      profile ?? ({} as any),
      "last_name",
      lang
    )}`
  );

  const bioLong = tFieldStr(profile ?? ({} as any), "bio_long", lang);
  const bioShort = tFieldStr(profile ?? ({} as any), "bio_short", lang) || t("hero.desc");
  const bioParagraphs = bioLong
    ? bioLong.split(/\n{1,2}|(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean)
    : [bioShort];

  return (
    <section id="chi-sono" className="section relative bg-[#F9F4EC] border-y border-black/5 overflow-hidden">
      <div className="container-app">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-4 sm:gap-8 lg:gap-16 items-start lg:items-center">
          {/* SINISTRA: Foto Profilo / Card Autore Compatta */}
          <div className="w-full">
            <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-3.5 sm:gap-4 lg:gap-0 bg-white lg:bg-transparent p-3 sm:p-4 lg:p-0 rounded-2xl border border-black/8 lg:border-none shadow-xs lg:shadow-none max-w-xl mx-auto lg:max-w-[440px]">
              {/* Box Immagine (Avatar compatto su mobile, ritratto nobile h-[480px] su desktop) */}
              <div className="relative isolate w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 lg:w-full lg:h-[560px] xl:h-[620px] lg:aspect-[4/5] rounded-2xl overflow-visible shadow-sm lg:shadow-none border border-black/10 lg:border-none bg-bg-card shrink-0">
                <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl shadow-sm lg:shadow-xl border border-black/10">
                  <Editable
                    id="profile.photo"
                    label="Foto profilo"
                    kind="image"
                    profileField="photo_url"
                    section="Chi sono"
                    values={imageValue(profile?.photo_url)}
                    as="block"
                    className="w-full h-full relative block"
                  >
                    {photo && (
                      <>
                        <Image
                          src={photo}
                          alt={name || "Davide Apolloni"}
                          fill
                          sizes="(max-width: 1024px) 120px, 440px"
                          className="object-cover object-top"
                        />
                        <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-transparent to-transparent" />
                      </>
                    )}
                  </Editable>
                </div>

                {/* Card esperienza: layout desktop sovrapposto alla foto */}
                <div className="hidden lg:block absolute -bottom-8 -right-8 xl:-bottom-10 xl:-right-10 z-20 w-[210px] xl:w-[250px] rounded-2xl bg-white p-5 xl:p-7 text-[#1E160A] shadow-xl border border-black/10">
                  <Editable
                    id="about.experience_years"
                    label="Anni di esperienza"
                    kind="profile_number"
                    profileField="experience_years"
                    section="Chi sono"
                    values={{ it: String(profile?.experience_years ?? 20), en: String(profile?.experience_years ?? 20) }}
                  >
                    <span className="font-serif text-4xl xl:text-5xl font-bold leading-none block">
                      {profile?.experience_years ?? 20}+
                    </span>
                  </Editable>
                  <Editable
                    id="about.exp_text"
                    label="Descrizione esperienza"
                    kind="string"
                    stringKey="about.expText"
                    section="Chi sono"
                    values={stringValues(
                      strings,
                      "about.expText",
                      "Anni di esperienza nella divulgazione storico-artistica",
                      "Years of experience in cultural and art-history communication"
                    )}
                    as="block"
                    className="mt-3"
                  >
                    <p className="text-lg xl:text-xl leading-snug font-light">{t("about.expText")}</p>
                  </Editable>
                </div>
              </div>

              {/* Intestazione Autore SOLO SU MOBILE (a fianco della foto avatar) */}
              <div className="lg:hidden min-w-0 flex-1">
                <Editable
                  id="about.subtitle.mobile"
                  label="Sottotitolo sezione"
                  kind="string"
                  stringKey="about.subtitle"
                  section="Chi sono"
                  values={stringValues(strings, "about.subtitle")}
                >
                  <span className="eyebrow mb-1 text-[10px] py-0.5 px-2">
                    <GraduationCap className="w-3 h-3" />
                    {t("about.subtitle")}
                  </span>
                </Editable>

                <h2 className="font-serif text-lg xs:text-xl font-bold text-text-main leading-tight truncate">
                  Prof.{" "}
                  <Editable
                    id="about.first_name.mobile"
                    label="Nome (it/en)"
                    kind="profile"
                    profileField="first_name"
                    section="Chi sono"
                    values={profileValues(profile, "first_name")}
                  >
                    <span>{stripHtml(tFieldStr(profile ?? ({} as any), "first_name", lang)) || "Davide"}</span>
                  </Editable>{" "}
                  <Editable
                    id="about.last_name.mobile"
                    label="Cognome (it/en)"
                    kind="profile"
                    profileField="last_name"
                    section="Chi sono"
                    values={profileValues(profile, "last_name")}
                  >
                    <span>{stripHtml(tFieldStr(profile ?? ({} as any), "last_name", lang)) || "Apolloni"}</span>
                  </Editable>
                </h2>

                <Editable
                  id="about.mobileSubtitle"
                  label="Sottotitolo mobile (ruolo/autore)"
                  kind="string"
                  stringKey="about.mobileSubtitle"
                  section="Chi sono"
                  values={stringValues(
                    strings,
                    "about.mobileSubtitle",
                    "Docente di Lettere e Storia · Autore Erickson & Rizzoli",
                    "History & Literature Teacher · Author for Erickson & Rizzoli"
                  )}
                  as="block"
                >
                  <p className="text-[10.5px] xs:text-[11px] text-text-muted font-medium mt-0.5 line-clamp-2">
                    {t("about.mobileSubtitle")}
                  </p>
                </Editable>
              </div>
            </div>
          </div>

          {/* DESTRA: Bio, Credenziali & CV */}
          <div className="min-w-0 w-full max-w-full">
            {/* Intestazione SOLO SU DESKTOP */}
            <div className="hidden lg:block">
              <div className="mb-2">
                <Editable
                  id="about.subtitle"
                  label="Sottotitolo sezione"
                  kind="string"
                  stringKey="about.subtitle"
                  section="Chi sono"
                  values={stringValues(strings, "about.subtitle")}
                >
                  <span className="eyebrow mb-2 sm:mb-3">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {t("about.subtitle")}
                  </span>
                </Editable>
              </div>

              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <Editable
                  id="about.first_name"
                  label="Nome (it/en)"
                  kind="profile"
                  profileField="first_name"
                  section="Chi sono"
                  values={profileValues(profile, "first_name")}
                >
                  <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-text-main leading-tight mb-0">
                    {stripHtml(tFieldStr(profile ?? ({} as any), "first_name", lang))}
                  </h2>
                </Editable>
                <Editable
                  id="about.last_name"
                  label="Cognome (it/en)"
                  kind="profile"
                  profileField="last_name"
                  section="Chi sono"
                  values={profileValues(profile, "last_name")}
                >
                  <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-terracotta leading-tight mb-0">
                    {stripHtml(tFieldStr(profile ?? ({} as any), "last_name", lang))}
                  </h2>
                </Editable>
              </div>
            </div>

            <Editable
              id="about.bio_long"
              label="Biografia lunga"
              kind="profile"
              profileField="bio_long"
              section="Chi sono"
              values={profileValues(profile, "bio_long")}
              as="block"
            >
              <div className="space-y-2 sm:space-y-3.5 text-xs sm:text-base text-text-muted leading-relaxed font-light mb-4 sm:mb-8">
                {bioParagraphs.map((p, i) => (
                  <p key={i}>
                    {p}
                  </p>
                ))}
              </div>
            </Editable>

            {/* CREDENZIALI: Striscia Orizzontale a Scorrimento su Mobile (NON impilate!) / 2x2 su Desktop */}
            {creds.length > 0 && (
              <div className="w-full max-w-full overflow-hidden mb-4 sm:mb-8">
                <div className="flex md:grid md:grid-cols-2 gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x touch-pan-x w-full max-w-full">
                  {creds.slice(0, 4).map((c) => (
                    <div key={c.id} className="w-[220px] xs:w-[240px] shrink-0 snap-start md:w-auto">
                      <CredentialCard credential={c} lang={lang} />
                    </div>
                  ))}
                </div>
                <p className="md:hidden text-center text-[10px] text-text-muted font-medium uppercase tracking-wider mt-1">
                  {lang === "it" ? "← Scorri credenziali →" : "← Swipe credentials →"}
                </p>
              </div>
            )}

            {cvItems.length > 0 && (
              <button
                onClick={() => window.dispatchEvent(new Event("open-cv-modal"))}
                className="btn btn-outline-terracotta w-full sm:w-auto text-center justify-center inline-flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-terracotta" />
                <span>{t("about.btnCv")}</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -mr-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CredentialCard({
  credential,
  lang,
}: {
  credential: CredentialT;
  lang: Lang;
}) {
  const tTitle = tFieldStr(credential as any, "title", lang);
  const tDesc = tFieldStr(credential as any, "description", lang);

  return (
    <div className="bg-white p-3 sm:p-5 rounded-2xl border border-black/10 shadow-xs hover:border-terracotta/40 hover:shadow-sm transition-all duration-300 h-full flex flex-col justify-start">
      <div className="flex items-center gap-2 sm:gap-2.5 mb-1 sm:mb-2">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
          <EditableIcon
            id={`cred-icon-${credential.id}`}
            iconName={credential.icon || "GraduationCap"}
            credentialId={credential.id}
            label={`Icona: ${credential.title_it || "Credenziale"}`}
            className="text-terracotta"
            iconProps={{ className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-terracotta" }}
          />
        </div>
        <Editable
          id={`cred-title-${credential.id}`}
          label={`Credenziale Titolo: ${credential.title_it || "Titolo"}`}
          kind="credential"
          credentialId={credential.id}
          credentialField="title"
          section="Chi sono"
          values={{ it: credential.title_it ?? "", en: credential.title_en ?? "" }}
          as="block"
          className="flex-1 min-w-0"
        >
          <h4 className="font-serif text-sm sm:text-base font-bold text-text-main leading-tight">
            {tTitle}
          </h4>
        </Editable>
      </div>
      <Editable
        id={`cred-desc-${credential.id}`}
        label={`Credenziale Descrizione: ${credential.title_it || "Descrizione"}`}
        kind="credential"
        credentialId={credential.id}
        credentialField="description"
        section="Chi sono"
        values={{ it: credential.description_it ?? "", en: credential.description_en ?? "" }}
        as="block"
      >
        <p className="text-xs sm:text-[0.85rem] text-text-muted leading-relaxed font-light">
          {tDesc}
        </p>
      </Editable>
    </div>
  );
}