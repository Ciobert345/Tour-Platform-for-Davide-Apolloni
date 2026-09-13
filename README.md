<p align="center">
  <img src="public/loghi/Guida-Veneto-e-Trentino.png" alt="Davide Apolloni — Guida Turistica Autorizzata Veneto e Trentino" width="200" />
</p>

<h1 align="center">Davide Apolloni — Tour Platform</h1>

<p align="center">
  Sito web professionale per Davide Apolloni, Guida Turistica Autorizzata specializzata nel Veneto e in Trentino.<br/>
  Costruito con Next.js 14, Supabase e TypeScript.
</p>

---

## Contesto e motivazione

Davide Apolloni è uno storico dell'arte e guida turistica autorizzata che opera tra il Veneto e il Trentino. Il suo lavoro spazia dalle visite guidate nelle città d'arte — Venezia, Padova, Verona, Vicenza, Treviso, Trento — agli itinerari nei castelli trentini, nelle ville palladiane della Riviera del Brenta, e sui siti della Grande Guerra sugli Altipiani di Asiago, Lavarone e Luserna.

Il sito nasce con l'obiettivo di offrire uno strumento digitale completo e autonomo: non una semplice vetrina statica, ma una piattaforma gestibile interamente da Davide in modo indipendente, senza dipendenze da agenzie esterne o CMS generalisti. Ogni contenuto — testi, immagini, tour, eventi, recensioni, modulo di prenotazione — è modificabile direttamente dall'area amministrativa integrata nel sito.

---

## Funzionalita principali

### Sito pubblico

- **Hero section** con presentazione, qualifiche e call-to-action alla prenotazione
- **Percorsi guidati** suddivisi per categoria (Cultura e Storia, Architettura, Grande Guerra, etc.), con card dettagliate per ogni luogo
- **Esperienze esclusive** con sezione dedicata ai tour privati su misura e alle visite speciali fuori orario
- **Prossime partenze** con calendario eventi e disponibilita posti in tempo reale
- **Modulo di prenotazione** avanzato con pre-compilazione automatica in base al tour o evento selezionato
- **Sezione media** per rassegna stampa, interviste e materiali video
- **Recensioni** dei clienti con valutazione
- **Informazioni pratiche** su modalita di trasporto, lingue disponibili e condizioni di servizio
- **Bilingue italiano / inglese** con traduzione automatica dei contenuti tramite AI (Google Translate API) e sistema di lingua persistente

### Area amministrativa

Accessibile all'indirizzo `/admin`, protetta da autenticazione Supabase Auth:

| Sezione | Contenuto gestibile |
|---|---|
| Luoghi | Nome, descrizione, immagine, tag, durata, categorie tour associate |
| Categorie tour | Nome, colore, icona, flag esclusivita |
| Eventi | Date, posti disponibili, stato, luoghi collegati |
| Prenotazioni | Ricezione e gestione delle richieste di prenotazione |
| Recensioni | Approvazione e visualizzazione delle recensioni |
| Galleria | Upload e gestione immagini |
| Testi del sito | Editor live per tutti i testi (titoli, descrizioni, CTA) con anteprima in tempo reale |
| Curriculum | Upload e aggiornamento del CV in PDF |
| Banner | Messaggi e avvisi temporanei nella homepage |
| Note legali | Privacy policy, cookie policy, termini di servizio |
| Profilo | Impostazioni account guida |

### Live editor

Il sistema di live editing consente di modificare ogni stringa di testo del sito direttamente dalla pagina pubblica, con le modifiche che si riflettono immediatamente in italiano e in inglese senza ricaricare la pagina.

---

## Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguaggio | TypeScript |
| Database e Auth | Supabase (PostgreSQL + Row Level Security) |
| Stile | Tailwind CSS con design system personalizzato |
| Icone | Lucide React |
| Immagini | Next.js Image con ottimizzazione automatica (AVIF/WebP) |
| Traduzione | Google Translate API (via route handler interno) |
| Deploy | Vercel (configurazione pronta) |

---

## Architettura

```
app/
  page.tsx              # Homepage pubblica (SSR con dati Supabase)
  admin/                # Area amministrativa (15+ sezioni)
  api/
    translate/          # Route handler per traduzione AI
    ...

components/
  public/               # Sezioni della homepage (Hero, Tours, Events, ...)
  admin/                # Componenti del pannello admin
  live-edit/            # Sistema di editing inline in-page

lib/
  i18n/                 # LanguageProvider, hook useLang/useT
  data/                 # Query Supabase (public.ts, admin.ts)
  live-edit/            # Logica salvataggio modifiche live
  imageUtils.ts         # Ottimizzazione URL immagini esterne
  supabase/             # Client Supabase (server e browser)

types/
  database.types.ts     # Tipi generati automaticamente da Supabase
```

---

## Avvio in sviluppo

**Prerequisiti:** Node.js >= 18, un progetto Supabase attivo.

1. Clona la repository e installa le dipendenze:

```bash
git clone https://github.com/Ciobert345/Tour-Platform-for-Davide-Apolloni.git
cd Tour-Platform-for-Davide-Apolloni
npm install
```

2. Copia il file di esempio delle variabili d'ambiente e compila con le credenziali Supabase:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_TRANSLATE_API_KEY=...
```

3. (Opzionale) Rigenera i tipi TypeScript dal database:

```bash
npm run gen-types
```

4. Avvia il server di sviluppo:

```bash
npm run dev
```

Il sito e disponibile su `http://localhost:3000`. L'area admin si trova su `http://localhost:3000/admin`.

---

## Comandi disponibili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run start` | Avvia il server di produzione |
| `npm run typecheck` | Verifica i tipi TypeScript senza compilare |
| `npm run gen-types` | Rigenera i tipi dal database Supabase |

---

## Note sul design

Il design segue una palette terracotta/pietra ispirata ai colori del paesaggio veneto e trentino. Le scelte tipografiche (serif per i titoli, sans-serif leggero per i testi) richiamano un'estetica editoriale e culturale, coerente con il profilo professionale della guida. Le immagini esterne (Unsplash e CDN) sono ottimizzate automaticamente in WebP/AVIF con placeholder a bassa risoluzione per eliminare il flash di caricamento.

---

## Sviluppatore

Sito progettato e sviluppato da **Robert Ciobanu** per conto di Davide Apolloni.
