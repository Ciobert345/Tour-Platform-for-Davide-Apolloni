import React from "react";
import { cn } from "@/lib/utils";

const MARKDOWN_LINK_RE =
  /\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/|#)[^\s)]*)\)/gi;

const SPAN_OPEN_RE = /<span\s+style\s*=\s*(["'])(.*?)\1\s*>/is;
const SPAN_OPEN_LOOSE_RE = /<span\b[^>]*>/i;
const SPAN_CLOSE_RE = /<\/span\s*>/i;
const BR_RE = /<br\s*\/?>/i;

/** Decodifica entità rimaste nel testo da vecchi salvataggi o importazioni. */
function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  let result = value;
  for (let pass = 0; pass < 3; pass++) {
    const decoded = result.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code) => {
      const key = String(code).toLowerCase();
      if (key.startsWith("#x")) return String.fromCodePoint(parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCodePoint(parseInt(key.slice(1), 10));
      return named[key] ?? entity;
    });
    if (decoded === result) break;
    result = decoded;
  }
  return result;
}

const FONT_MAP: Record<string, string> = {
  "serif-italic":
    "font-family: var(--font-serif, 'Cormorant Garamond'), 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500;",
  "serif":
    "font-family: var(--font-serif, 'Cormorant Garamond'), 'Playfair Display', Georgia, serif; font-style: normal; font-weight: 400;",
  "sans":
    "font-family: var(--font-sans, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
};

function resolveFontKeyword(fontVal: string): string {
  const clean = fontVal.trim().replace(/;$/, "");
  if (FONT_MAP[clean]) return FONT_MAP[clean];
  return fontVal;
}

function parseSpanStyle(styleAttr: string): {
  style: React.CSSProperties;
  className: string;
} {
  const styleObj: React.CSSProperties = {};
  let extraCls = "";
  if (!styleAttr) return { style: styleObj, className: extraCls };

  const declarations = styleAttr.split(";").filter((d) => d.trim());
  for (const decl of declarations) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    let prop = decl.slice(0, idx).trim().toLowerCase();
    let val = decl.slice(idx + 1).trim();
    if (!prop || !val) continue;

    if (prop === "font-family" || prop === "font") {
      const resolved = resolveFontKeyword(val);
      const subDecls = resolved.split(";").filter((d) => d.trim());
      for (const sd of subDecls) {
        const si = sd.indexOf(":");
        if (si === -1) continue;
        const sp = sd.slice(0, si).trim().toLowerCase();
        const sv = sd.slice(si + 1).trim();
        const camel = sp.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as any;
        (styleObj as any)[camel] = sv;
      }
    } else {
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as any;
      (styleObj as any)[camel] = val;
    }
  }
  return { style: styleObj, className: extraCls };
}

type Token =
  | { type: "text"; value: string }
  | { type: "link"; text: string; href: string }
  | { type: "br" }
  | { type: "span"; styleAttr: string; content: string };

function searchSpanClose(input: string, fromIdx: number): number {
  let depth = 1;
  let i = fromIdx;
  const len = input.length;
  const openRe = new RegExp(SPAN_OPEN_LOOSE_RE.source, "gi");
  const closeRe = new RegExp(SPAN_CLOSE_RE.source, "gi");
  while (i < len && depth > 0) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const oM = openRe.exec(input);
    const cM = closeRe.exec(input);
    if (!cM) break;
    if (oM && oM.index < cM.index) {
      depth++;
      i = oM.index + oM[0].length;
    } else {
      depth--;
      if (depth === 0) return cM.index;
      i = cM.index + cM[0].length;
    }
  }
  return -1;
}

function tokenizeRichText(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;

  const tryMatch = (re: RegExp, start: number): RegExpExecArray | null => {
    const str = input.slice(start);
    const m = re.exec(str);
    return m && m.index === 0 ? m : null;
  };

  while (i < len) {
    const brM = tryMatch(BR_RE, i);
    if (brM) {
      tokens.push({ type: "br" });
      i += brM[0].length;
      continue;
    }

    const spanOpenM = tryMatch(SPAN_OPEN_RE, i);
    if (spanOpenM) {
      const openLen = spanOpenM[0].length;
      const styleAttr = spanOpenM[2];
      const closeIdx = searchSpanClose(input, i + openLen);
      if (closeIdx !== -1) {
        const closeLen = input.slice(closeIdx).match(SPAN_CLOSE_RE)?.[0].length ?? 7;
        const inner = input.slice(i + openLen, closeIdx);
        tokens.push({ type: "span", styleAttr, content: inner });
        i = closeIdx + closeLen;
        continue;
      }
    }

    const linkM = tryMatch(MARKDOWN_LINK_RE, i);
    if (linkM) {
      tokens.push({ type: "link", text: linkM[1], href: linkM[2] });
      i += linkM[0].length;
      continue;
    }

    let nextSpecial = len;
    const brRe = new RegExp(BR_RE.source, "gi");
    brRe.lastIndex = i + 1;
    const brN = brRe.exec(input);
    if (brN) nextSpecial = Math.min(nextSpecial, brN.index);

    const soRe = /<span\s+style\s*=\s*/gi;
    soRe.lastIndex = i + 1;
    const soN = soRe.exec(input);
    if (soN) nextSpecial = Math.min(nextSpecial, soN.index);

    const scRe = new RegExp(SPAN_CLOSE_RE.source, "gi");
    scRe.lastIndex = i + 1;
    const scN = scRe.exec(input);
    if (scN) nextSpecial = Math.min(nextSpecial, scN.index);

    const lkRe = new RegExp(MARKDOWN_LINK_RE.source, "gi");
    lkRe.lastIndex = i + 1;
    const lkN = lkRe.exec(input);
    if (lkN) nextSpecial = Math.min(nextSpecial, lkN.index);

    const textVal = input.slice(i, nextSpecial);
    if (textVal) tokens.push({ type: "text", value: textVal });
    i = nextSpecial;
  }
  return tokens;
}

function renderTokens(
  tokens: Token[],
  baseKey: string,
  linkOptions?: RenderWithLinksOptions
): React.ReactNode {
  const out: React.ReactNode[] = [];
  let k = 0;
  for (const tok of tokens) {
    if (tok.type === "text") {
      out.push(decodeHtmlEntities(tok.value));
    } else if (tok.type === "br") {
      out.push(<br key={`${baseKey}-br-${k++}`} />);
    } else if (tok.type === "link") {
      const isExternal = /^https?:\/\//i.test(tok.href);
      out.push(
        <a
          key={`${baseKey}-a-${k++}`}
          href={tok.href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={cn(
            "underline underline-offset-3 decoration-1 hover:opacity-80 transition-all text-inherit font-medium cursor-pointer",
            linkOptions?.className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {decodeHtmlEntities(tok.text)}
        </a>
      );
    } else if (tok.type === "span") {
      const { style } = parseSpanStyle(tok.styleAttr);
      const inner = renderTokens(
        tokenizeRichText(tok.content),
        `${baseKey}-sp-in-${k}`,
        linkOptions
      );
      out.push(
        <span key={`${baseKey}-sp-${k++}`} style={style}>
          {inner}
        </span>
      );
    }
  }
  if (out.length === 0) return "";
  if (out.length === 1) return out[0];
  return <React.Fragment>{out}</React.Fragment>;
}

export interface RenderWithLinksOptions {
  className?: string;
}

export function renderWithLinks(
  text: string | null | undefined,
  options?: RenderWithLinksOptions
): React.ReactNode {
  if (!text || typeof text !== "string") return text ?? null;
  const hasSpan = /<span/i.test(text);
  const hasBr = /<br/i.test(text);
  if (!hasSpan && !hasBr && (!text.includes("[") || !text.includes("](") || !text.includes(")"))) {
    return text;
  }
  const tokens = tokenizeRichText(text);
  return renderTokens(tokens, "rwl", options);
}

export function renderRichInline(
  text: string | null | undefined,
  options?: RenderWithLinksOptions
): React.ReactNode {
  return renderWithLinks(text, options);
}

/**
 * Attraversa ricorsivamente un albero di nodi/elementi React e converte
 * tutte le stringhe di testo contenenti link markdown [testo](url) in elementi `<a>` navigabili.
 */
export function parseMarkdownLinksInNode(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === "boolean" || typeof node === "number") {
    return node;
  }

  if (typeof node === "string") {
    return renderWithLinks(node);
  }

  if (Array.isArray(node)) {
    return node.map((child, idx) => (
      <React.Fragment key={idx}>
        {parseMarkdownLinksInNode(child)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    // Evitiamo di modificare il contenuto di elementi interattivi o media già strutturati
    const tag = typeof node.type === "string" ? node.type.toLowerCase() : "";
    if (
      tag === "a" ||
      tag === "button" ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "option" ||
      tag === "svg" ||
      tag === "path" ||
      tag === "image" ||
      tag === "video" ||
      tag === "iframe" ||
      tag === "code" ||
      tag === "pre"
    ) {
      return node;
    }

    const props = node.props as Record<string, any> | undefined;
    if (props && "children" in props && props.children !== undefined) {
      return React.cloneElement(node, {
        ...props,
        children: parseMarkdownLinksInNode(props.children),
      });
    }

    return node;
  }

  return node;
}

export function stripSpanFormatting(text: string): string {
  if (!text) return text;
  let out = text;
  let prev: string;
  do {
    prev = out;
    out = out
      .replace(new RegExp(SPAN_OPEN_LOOSE_RE.source, "gi"), "")
      .replace(new RegExp(SPAN_CLOSE_RE.source, "gi"), "");
  } while (out !== prev);
  return out;
}

export function stripMarkdownLinks(text: string): string {
  if (!text) return text;
  return text.replace(MARKDOWN_LINK_RE, "$1");
}

export function stripBrTags(text: string): string {
  if (!text) return text;
  return text.replace(new RegExp(BR_RE.source, "gi"), " ");
}

export function stripAllFormatting(text: string): string {
  if (!text) return text;
  return stripBrTags(stripSpanFormatting(stripMarkdownLinks(text)));
}
