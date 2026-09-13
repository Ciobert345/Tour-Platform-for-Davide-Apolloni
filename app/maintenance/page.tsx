import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sito in preparazione",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div
      style={{ all: "initial", display: "block" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Davide Apolloni — Guida Turistica Veneto e Trentino</title>
<meta name="robots" content="noindex, nofollow">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Source+Sans+3:wght@400;500;600&display=swap');

  :root{
    --cream: #F6F1E7;
    --cream-deep: #EFE7D6;
    --ink: #2B231D;
    --ink-soft: #6B5F52;
    --burgundy: #7A1F2A;
    --burgundy-deep: #591620;
    --gold: #A8823C;
    --gold-soft: #C9A968;
    --line: rgba(122,31,42,0.18);
  }

  *{ box-sizing: border-box; }

  html, body{
    margin: 0;
    padding: 0;
    height: 100%;
  }

  body{
    background: var(--cream);
    color: var(--ink);
    font-family: 'Source Sans 3', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  body::before{
    content: "";
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, rgba(122,31,42,0.06), transparent 40%),
      radial-gradient(circle at 85% 80%, rgba(168,130,60,0.08), transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(122,31,42,0.03), transparent 60%);
    pointer-events: none;
  }

  body::after{
    content: "";
    position: fixed;
    inset: 0;
    border: 1px solid var(--line);
    margin: 18px;
    pointer-events: none;
  }

  .corner{
    position: fixed;
    width: 26px;
    height: 26px;
    border: 1px solid var(--gold-soft);
    opacity: 0.55;
    pointer-events: none;
  }
  .corner.tl{ top: 30px; left: 30px; border-right: none; border-bottom: none; }
  .corner.tr{ top: 30px; right: 30px; border-left: none; border-bottom: none; }
  .corner.bl{ bottom: 30px; left: 30px; border-right: none; border-top: none; }
  .corner.br{ bottom: 30px; right: 30px; border-left: none; border-top: none; }

  .wrap{
    position: relative;
    max-width: 620px;
    width: 100%;
    padding: 64px 32px;
    text-align: center;
  }

  .crest-ring{
    width: 216px;
    height: 216px;
    margin: 0 auto 36px;
    border-radius: 50%;
    border: 1px solid var(--gold-soft);
    padding: 8px;
    position: relative;
  }

  .crest-ring::before{
    content: "";
    position: absolute;
    inset: -9px;
    border-radius: 50%;
    border: 1px dashed rgba(168,130,60,0.35);
  }

  .crest{
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cream-deep);
    box-shadow: 0 8px 24px rgba(89,22,32,0.10);
    overflow: hidden;
  }

  .crest img{
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .crest-fallback{
    font-family: 'Fraunces', serif;
    font-size: 26px;
    letter-spacing: 0.06em;
    color: var(--burgundy);
  }

  .kicker{
    font-size: 13px;
    letter-spacing: 0.14em;
    color: var(--ink-soft);
    margin: 0 0 14px;
  }

  .kicker-link{
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid rgba(122,31,42,0.35);
    padding-bottom: 1px;
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  .kicker-link:hover{
    color: var(--burgundy);
    border-bottom-color: var(--burgundy);
  }

  h1{
    font-family: 'Fraunces', serif;
    font-weight: 500;
    font-size: clamp(2.1rem, 5vw, 3rem);
    line-height: 1.15;
    margin: 0 0 20px;
    color: var(--ink);
  }

  p.lead{
    font-size: 1.05rem;
    line-height: 1.65;
    color: var(--ink-soft);
    max-width: 480px;
    margin: 0 auto 36px;
  }

  .divider{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 auto 36px;
  }
  .divider .bar{
    width: 46px;
    height: 1px;
    background: var(--gold);
  }
  .divider .diamond{
    width: 7px;
    height: 7px;
    background: var(--gold);
    transform: rotate(45deg);
  }

  .contact{
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.95rem;
    color: var(--ink-soft);
  }

  .contact a{
    color: var(--burgundy);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }

  .contact a:hover{
    border-bottom-color: var(--burgundy);
  }

  .contact strong{
    color: var(--ink);
    font-weight: 600;
  }

  footer{
    margin-top: 48px;
    font-size: 0.78rem;
    color: var(--ink-soft);
    letter-spacing: 0.03em;
  }

  @media (max-width: 480px){
    .wrap{ padding: 48px 20px; }
    body::after{ margin: 10px; }
    .corner{ display: none; }
    .crest-ring{ width: 168px; height: 168px; }
  }
</style>
</head>
<body>

  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="wrap">

    <div class="crest-ring">
      <div class="crest">
        <img src="/loghi/Guida-Veneto-e-Trentino.png" alt="Davide Apolloni — Guida Turistica" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=&quot;crest-fallback&quot;>DA</span>';">
      </div>
    </div>

    <p class="kicker">Davide Apolloni · <a href="https://portaleprofessioni.ministeroturismo.gov.it/tour-guides/details/17064" target="_blank" rel="noopener" class="kicker-link">Guida Turistica Autorizzata</a></p>

    <h1>Il nostro sito è in preparazione</h1>

    <p class="lead">
      Stiamo curando ogni dettaglio.<br>
      Il sito sarà online a breve, nel frattempo, scrivetemi
      per organizzare la vostra visita.
    </p>

    <div class="divider">
      <span class="bar"></span>
      <span class="diamond"></span>
      <span class="bar"></span>
    </div>

    <div class="contact">
      <div><strong>Email</strong> · <a href="mailto:guidaturistica@davideapolloni.it">guidaturistica@davideapolloni.it</a></div>
    </div>

    <footer>&copy; 2026 Davide Apolloni — Guida Turistica, Veneto e Trentino</footer>

  </div>

</body>
</html>
        `.trim(),
      }}
    />
  );
}
