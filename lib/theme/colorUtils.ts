/**
 * Utilities per il contrasto intelligente dei colori (Contrast-Aware Engine)
 * Adatta automaticamente colori del testo e di elementi grafici (badge, banner, icone)
 * scelti dall'amministratore, garantendo leggibilità ottimale sia in Light che in Dark Mode.
 */

// Mappature dedicate per la palette brand di Davide Apolloni
const BRAND_DARK_ADAPTATIONS: Record<string, string> = {
  // Marroni e testi scuri brand -> avorio/crema caldo luminoso
  "#1e160a": "#f5ede2",
  "#241a12": "#f5ede2",
  "#2b2018": "#f5ede2",
  "#18100a": "#f5ede2",
  "#000000": "#f5ede2",
  "#111111": "#f5ede2",
  "#222222": "#f5ede2",
  "#333333": "#f5ede2",
  "#3d2e1a": "#ede0cf",
  "#4d3a2b": "#e5d3be",
  "#5c4c38": "#ded0bc",
  "#72553f": "#dbc8b4",
  "#7a6655": "#d9c8b5",
  "#7a5828": "#edd09e",

  // Terracotta / Cremisi -> Terracotta brillante e leggibile su fondo scuro
  "#9c1c1c": "#f07f82",
  "#93161a": "#f28285",
  "#b22a2a": "#f5878a",
  "#4d1a10": "#f59a9c",

  // Bronzo antico / Oro caldo -> Oro caldo radioso
  "#a87e3c": "#ebc57f",
  "#c4923a": "#f2cf85",
  "#8a6428": "#f0ce88",

  // Verde oliva / Foresta -> Salvia chiaro e luminoso
  "#4a6535": "#a6cf8c",
  "#5d7250": "#b1d49e",
  "#3e4d34": "#a8d294",
  "#936f52": "#d9b396",

  // Blu Adriatico -> Celeste alpino / mare chiaro
  "#3d6e90": "#8bc0e0",
  "#537385": "#9bc6de",
  "#47596a": "#9ec4dc",
};

/** Normalizza hex a 6 caratteri minuscoli */
function normalizeHex(hex: string): string | null {
  let clean = hex.trim().toLowerCase();
  if (!clean.startsWith("#")) return null;
  clean = clean.slice(1);
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length === 6) {
    return `#${clean}`;
  }
  return null;
}

/** Estrae RGB (0..255) da hex */
function hexToRgb(hex: string): [number, number, number] | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const num = parseInt(norm.slice(1), 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Converte RGB (0..255) in HEX */
function rgbToHex(r: number, g: number, b: number): string {
  const toH = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

/** Converte RGB in HSL */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

/** Converte HSL in RGB */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

/** Calcola la luminanza relativa WCAG (0..1) */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calcola l'equivalente cromatico ottimizzato per Dark Mode di qualsiasi colore scelto.
 * Se è presente nella palette brand, restituisce l'adattamento calibrato.
 * Altrimenti aumenta la luminosità preservando tonalità e saturazione per garantire contrasto WCAG AA/AAA.
 */
export function getAdaptiveDarkColor(colorStr: string): string {
  if (!colorStr) return colorStr;
  const norm = normalizeHex(colorStr);
  if (norm && BRAND_DARK_ADAPTATIONS[norm]) {
    return BRAND_DARK_ADAPTATIONS[norm];
  }

  if (norm) {
    const rgb = hexToRgb(norm);
    if (!rgb) return colorStr;
    const [h, s, l] = rgbToHsl(...rgb);

    // Se il colore è già chiaro su sfondo scuro (luminanza sufficiente), lascialo
    if (l >= 0.65) return norm;

    // Se è molto scuro, scalalo verso un valore luminoso (es. 0.72)
    // Se è completamente acromatico (nero/grigio scuro), rendilo un caldo avorio
    if (s < 0.08) {
      return "#f5ede2";
    }

    const newLightness = Math.max(0.70, l + 0.35);
    const [newR, newG, newB] = hslToRgb(h, Math.min(s, 0.85), Math.min(newLightness, 0.85));
    return rgbToHex(newR, newG, newB);
  }

  // Se non è hex (es. rgb/nome colore comune)
  const lower = colorStr.toLowerCase().trim();
  if (lower === "black" || lower === "#000") return "#f5ede2";
  if (lower === "white" || lower === "#fff") return "#ffffff";

  return colorStr;
}

/**
 * Assicura che un colore chiaro (es. bianco o giallo chiarissimo) scelto dall'utente
 * rimanga leggibile anche su carta o sfondi chiari in Light Mode.
 */
export function getAdaptiveLightColor(colorStr: string): string {
  if (!colorStr) return colorStr;
  const norm = normalizeHex(colorStr);
  if (norm) {
    const rgb = hexToRgb(norm);
    if (!rgb) return colorStr;
    const [h, s, l] = rgbToHsl(...rgb);

    // Se il colore è troppo chiaro per lo sfondo chiaro (es. bianco puro o giallo sbiadito)
    if (l > 0.85) {
      if (s < 0.1) return "#2b2018"; // quasi bianco -> marrone scuro brand
      const [newR, newG, newB] = hslToRgb(h, s, 0.45);
      return rgbToHex(newR, newG, newB);
    }
    return norm;
  }
  const lower = colorStr.toLowerCase().trim();
  if (lower === "white" || lower === "#fff") return "#2b2018";
  return colorStr;
}

/**
 * Genera uno stile CSS inline reattivo per badge/chip con colore configurato dall'amministratore.
 * Assicura che l'etichetta abbia un contrasto nitido ed elegante sia su sfondo chiaro che scuro.
 */
export function getAdaptiveBadgeStyle(
  colorHex: string | null | undefined,
  fallback = "#9C1C1C"
): { style: React.CSSProperties; className: string } {
  const c = colorHex || fallback;
  const darkC = getAdaptiveDarkColor(c);
  const lightC = getAdaptiveLightColor(c);

  return {
    className: "badge-adaptive",
    style: {
      backgroundColor: `${c}1A`,
      borderColor: `${c}33`,
      color: `var(--badge-color-current, ${lightC})`,
      ["--badge-color-light" as any]: lightC,
      ["--badge-color-dark" as any]: darkC,
    },
  };
}
