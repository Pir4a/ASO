"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const HISTORY_KEY = "althea.search.history";
const HISTORY_LIMIT = 8;

type SearchQueryInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeHistory(items: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(items.slice(0, HISTORY_LIMIT)),
  );
}

export function SearchQueryInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className,
}: SearchQueryInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => item.toLowerCase().includes(q));
  }, [history, value]);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form) return;

    const onSubmit = () => {
      const query = (input.value || "").trim();
      if (!query) return;
      const next = [
        query,
        ...history.filter((h) => h.toLowerCase() !== query.toLowerCase()),
      ].slice(0, HISTORY_LIMIT);
      setHistory(next);
      writeHistory(next);
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [history]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />

      {open && suggestions.length > 0 ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-foreground/10 bg-white shadow-lg">
          <ul className="max-h-56 overflow-y-auto py-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setValue(suggestion);
                    setOpen(false);
                  }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
