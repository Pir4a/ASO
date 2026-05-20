"use client";

import { useCallback, useEffect, useRef } from "react";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";

/**
 * Minimal contenteditable rich-text editor for the Backoffice.
 *
 * Why hand-rolled? CDC XVI.6 requires a small toolbar (bold / italic / link /
 * color) on a single admin field. A full TipTap/Lexical install would be
 * massive overkill, so we expose `document.execCommand` (deprecated yet still
 * shipping in every browser) through a tiny toolbar.
 *
 * The output is HTML; consumers should run it through `sanitizeRichText`
 * before rendering with `dangerouslySetInnerHTML`. We also sanitize at save
 * time inside the component to keep storage clean.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastEmittedRef = useRef<string>("");

  // Sync `value` -> DOM when the prop changes externally (e.g. after load).
  // We avoid touching the DOM while the user is actively typing — that would
  // collapse the caret. The guard compares against the last value we emitted.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (value === lastEmittedRef.current) return;
    node.innerHTML = sanitizeRichText(value);
    lastEmittedRef.current = value;
  }, [value]);

  const emit = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const html = sanitizeRichText(node.innerHTML);
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      const node = ref.current;
      if (!node) return;
      node.focus();
      // execCommand is deprecated but still ubiquitously supported. It's the
      // smallest possible API to ship formatting without a heavy library.
      document.execCommand(command, false, arg);
      emit();
    },
    [emit],
  );

  const onCreateLink = useCallback(() => {
    const url = window.prompt("URL du lien (https://… ou /chemin)");
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    exec("createLink", trimmed);
    // execCommand creates <a href> but doesn't set rel/target. Patch the most
    // recently focused anchor inside our editor so external links get safe rel.
    const node = ref.current;
    if (node) {
      node.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (/^https?:\/\//i.test(href)) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      });
      emit();
    }
  }, [exec, emit]);

  const onApplyColor = useCallback(
    (color: string) => {
      exec("foreColor", color);
    },
    [exec],
  );

  const isEmpty = !value || sanitizeRichText(value).replace(/<[^>]+>/g, "").trim() === "";

  return (
    <div className="rounded-lg border border-foreground/10 bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <div
        role="toolbar"
        aria-label="Mise en forme"
        className="flex flex-wrap items-center gap-1 border-b border-foreground/10 px-2 py-1.5"
      >
        <ToolbarButton onClick={() => exec("bold")} title="Gras (Ctrl+B)">
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italique (Ctrl+I)">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton onClick={onCreateLink} title="Insérer un lien">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
            <path d="M6.5 9.5 9.5 6.5M6.5 6.5 4.5 4.5a2 2 0 0 0-2.83 2.83L4 9.66M9.5 6.5l2 2a2 2 0 0 1-2.83 2.83L6.34 12" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("removeFormat")}
          title="Effacer la mise en forme"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
            <path d="M4 4h8M6 4l-2 8M9 4l-2 8M3 13h10" />
          </svg>
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-foreground/15" aria-hidden="true" />
        <label className="inline-flex items-center gap-1.5 text-xs text-foreground/60">
          <span>Couleur</span>
          <input
            type="color"
            aria-label="Couleur du texte"
            onChange={(e) => onApplyColor(e.target.value)}
            className="h-6 w-7 cursor-pointer rounded border border-foreground/15 bg-white p-0"
          />
        </label>
      </div>
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel ?? "Éditeur de texte"}
          onInput={emit}
          onBlur={emit}
          className="min-h-[90px] px-3 py-2 text-sm text-foreground outline-none [&_a]:text-primary [&_a]:underline"
        />
        {isEmpty && placeholder ? (
          <p
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2 text-sm text-foreground/35"
          >
            {placeholder}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid h-7 min-w-[28px] cursor-pointer place-items-center rounded-md px-1.5 text-xs text-foreground/75 transition hover:bg-foreground/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}
