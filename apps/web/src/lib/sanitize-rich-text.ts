/**
 * Minimal HTML sanitizer for admin-authored rich text on the homepage.
 *
 * Why hand-rolled (no external dep)?
 * - The source is an authenticated admin Backoffice user (low threat surface).
 * - The accepted tag set is intentionally tiny (bold / italic / link / colored
 *   span) so a whitelist pass is sufficient.
 *
 * Allowed tags:    b, strong, i, em, a, span, br
 * Allowed attrs:   href, target, rel  (on <a>);  style  (on <a> and <span>,
 *                  restricted to a single `color: <safe-value>` declaration)
 *
 * Everything else is stripped. Output is safe to inject via
 * dangerouslySetInnerHTML inside a generic block element — the surrounding
 * `<html dir>` attribute keeps RTL locales (ar / he) rendering correctly.
 */

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "a", "span", "br"]);

// Allowed attributes per tag. `style` is further filtered below.
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "style"]),
  span: new Set(["style"]),
};

// Color values we accept inside `style="color: …"`. Keeps the surface area
// small (named colors, #rgb / #rrggbb, rgb()/rgba() with simple integer args).
const COLOR_VALUE = /^(?:#(?:[0-9a-f]{3}|[0-9a-f]{6})|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)|[a-z]+)$/i;

function sanitizeStyle(raw: string): string | null {
  // Only allow a single `color: <value>` declaration. Anything else is dropped.
  const match = /(?:^|;)\s*color\s*:\s*([^;]+?)\s*(?:;|$)/i.exec(raw);
  if (!match) return null;
  const value = match[1].trim();
  if (!COLOR_VALUE.test(value)) return null;
  return `color: ${value}`;
}

function sanitizeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  // Block javascript:, data:, vbscript: and other dangerous schemes. Allow
  // relative URLs, http(s), mailto, tel.
  if (/^\s*(?:javascript|data|vbscript):/i.test(value)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (!/^(?:https?|mailto|tel):/i.test(value)) return null;
  }
  return value;
}

function sanitizeAttributes(tag: string, attrsRaw: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return "";
  const out: string[] = [];
  // Match name="value" / name='value' / name=value / boolean attr.
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`<>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrsRaw)) !== null) {
    const name = m[1].toLowerCase();
    if (!allowed.has(name)) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (name === "style") {
      const safe = sanitizeStyle(value);
      if (safe) out.push(`style="${safe}"`);
      continue;
    }
    if (name === "href") {
      const safe = sanitizeHref(value);
      if (safe) out.push(`href="${escapeAttr(safe)}"`);
      continue;
    }
    if (name === "target") {
      const v = value.toLowerCase();
      if (v === "_blank" || v === "_self") out.push(`target="${v}"`);
      continue;
    }
    if (name === "rel") {
      // Only keep recognised tokens.
      const tokens = value
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => ["noopener", "noreferrer", "nofollow"].includes(t));
      if (tokens.length > 0) out.push(`rel="${tokens.join(" ")}"`);
      continue;
    }
  }
  // Ensure rel safety on external _blank links.
  if (tag === "a") {
    const hasTargetBlank = /target="_blank"/.test(out.join(" "));
    const hasRel = out.some((a) => a.startsWith("rel="));
    if (hasTargetBlank && !hasRel) out.push('rel="noopener noreferrer"');
  }
  return out.length ? " " + out.join(" ") : "";
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Returns a sanitized HTML string. Unknown tags are dropped (their text
 * contents are preserved). If `input` is empty/nullish, returns an empty
 * string.
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  // Strip every tag that isn't on the whitelist (comments, scripts, anything
  // we don't recognise) while keeping the inner text. We walk the string
  // tag-by-tag rather than relying on DOMParser so this is safe to use in a
  // Server Component (Node) as well as the browser.
  const TAG_RE = /<\/?\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|<!--[\s\S]*?-->/g;
  let out = "";
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(input)) !== null) {
    out += escapeText(input.slice(lastIndex, m.index));
    lastIndex = m.index + m[0].length;
    // HTML comment: drop entirely.
    if (m[0].startsWith("<!--")) continue;
    const tag = (m[1] ?? "").toLowerCase();
    const isClosing = /^<\s*\//.test(m[0]);
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (isClosing) {
      // Void-ish tags don't get a closing form.
      if (tag === "br") continue;
      out += `</${tag}>`;
    } else {
      const attrsRaw = m[2] ?? "";
      const selfClosing = /\/\s*$/.test(attrsRaw);
      const attrs = sanitizeAttributes(tag, attrsRaw);
      if (tag === "br") {
        out += "<br />";
      } else if (selfClosing) {
        out += `<${tag}${attrs} />`;
      } else {
        out += `<${tag}${attrs}>`;
      }
    }
  }
  out += escapeText(input.slice(lastIndex));
  return out;
}
