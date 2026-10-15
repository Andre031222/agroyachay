import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "locales");
const locales = ["es", "en", "qu", "ay"];
const data = Object.fromEntries(locales.map((l) => [l, JSON.parse(readFileSync(join(dir, `${l}.json`), "utf8"))]));
const reference = Object.keys(data.es);
const placeholders = (s) => (String(s).match(/\{[a-z_]+\}/g) ?? []).sort().join(",");
let failures = 0;

for (const locale of locales) {
  const keys = new Set(Object.keys(data[locale]));
  const missing = reference.filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !(k in data.es));
  const empty = [...keys].filter((k) => typeof data[locale][k] !== "string" || data[locale][k].trim() === "");
  const mismatched = reference.filter((k) => keys.has(k) && placeholders(data[locale][k]) !== placeholders(data.es[k]));
  for (const [label, list] of [["missing", missing], ["extra", extra], ["empty", empty], ["placeholder mismatch", mismatched]]) {
    if (list.length) {
      failures += list.length;
      console.error(`${locale}: ${label} (${list.length}): ${list.slice(0, 20).join(", ")}`);
    }
  }
  console.log(`${locale}: ${keys.size} keys`);
}

if (failures) {
  console.error(`i18n check failed with ${failures} problem(s).`);
  process.exit(1);
}
console.log("i18n check passed: all locales share the same keys and placeholders.");
