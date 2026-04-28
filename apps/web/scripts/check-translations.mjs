import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const filePath = path.resolve("src/lib/translations.ts");
const src = fs.readFileSync(filePath, "utf8");
const startToken = "const translations =";
const start = src.indexOf(startToken);
if (start < 0) throw new Error("translations object not found");
const open = src.indexOf("{", start);
const close = src.indexOf("} as const;", open);
if (open < 0 || close < 0) throw new Error("cannot parse translations object");

const obj = src.slice(open, close + 1);
const translations = new vm.Script(`(${obj})`).runInNewContext();

const locales = Object.keys(translations);
const baseKeys = Object.keys(translations.en ?? {}).sort();
if (!baseKeys.length) throw new Error("en locale is empty");

const issues = [];
for (const locale of locales) {
  if (locale === "en") continue;
  const keys = Object.keys(translations[locale] ?? {}).sort();
  const missing = baseKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !baseKeys.includes(k));
  if (missing.length) issues.push(`[${locale}] missing: ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? " ..." : ""}`);
  if (extra.length) issues.push(`[${locale}] extra: ${extra.slice(0, 20).join(", ")}${extra.length > 20 ? " ..." : ""}`);
}

if (issues.length) {
  console.error("Translation parity check failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Translation parity OK: ${locales.length} locales, ${baseKeys.length} keys`);
