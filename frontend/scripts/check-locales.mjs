#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(ROOT, 'src', 'locales');
const SRC_DIR = join(ROOT, 'src');

const REQUIRED = ['es', 'en'];
const REFERENCE = 'es';
const EXCLUDED = ['LanguageContext.jsx'];

const load = (code) => JSON.parse(readFileSync(join(LOCALES_DIR, `${code}.json`), 'utf8'));

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value, path)
      : [[path, value]];
  });

const placeholders = (value) => {
  const text = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).sort();
};

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    if (EXCLUDED.some((name) => full.endsWith(name))) return [];
    return /\.(jsx?|tsx?)$/.test(entry) ? [full] : [];
  });

const errors = [];
const warnings = [];

const available = readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''));

for (const code of REQUIRED) {
  if (!available.includes(code)) errors.push(`falta el archivo de idioma: ${code}.json`);
}

const maps = Object.fromEntries(available.map((code) => [code, new Map(flatten(load(code)))]));
const reference = maps[REFERENCE];

for (const code of available) {
  const map = maps[code];
  const required = REQUIRED.includes(code);
  const report = required ? errors : warnings;

  for (const [key, referenceValue] of reference) {
    if (!map.has(key)) {
      if (required) report.push(`${code}: falta la clave "${key}"`);
      continue;
    }
    const value = map.get(key);
    if (Array.isArray(referenceValue) !== Array.isArray(value)) {
      report.push(`${code}: "${key}" cambia de tipo respecto a ${REFERENCE}`);
    } else if (Array.isArray(referenceValue) && referenceValue.length !== value.length) {
      warnings.push(`${code}: "${key}" tiene ${value.length} elementos y ${REFERENCE} ${referenceValue.length}`);
    }
    const expected = placeholders(referenceValue).join(',');
    const found = placeholders(value).join(',');
    if (expected !== found) {
      report.push(`${code}: "${key}" usa {${found}} y ${REFERENCE} usa {${expected}}`);
    }
    if (typeof value === 'string' && value.trim() === '') {
      report.push(`${code}: "${key}" está vacía`);
    }
  }

  for (const key of map.keys()) {
    if (!reference.has(key)) warnings.push(`${code}: clave huérfana "${key}"`);
  }
}

const USAGE = /\b(?:t|tList)\(\s*['"]([\w.]+)['"]|labelKey:\s*['"]([\w.]+)['"]/g;
const used = new Set();
for (const file of walk(SRC_DIR)) {
  for (const match of readFileSync(file, 'utf8').matchAll(USAGE)) {
    used.add(match[1] || match[2]);
  }
}

const referenceKeys = [...reference.keys()];
for (const key of used) {
  if (!reference.has(key) && !referenceKeys.some((candidate) => candidate.startsWith(`${key}.`))) {
    errors.push(`código: t('${key}') no existe en ${REFERENCE}.json`);
  }
}

const total = reference.size;
console.log(`Claves de referencia (${REFERENCE}): ${total}`);
for (const code of available) {
  const covered = referenceKeys.filter((key) => maps[code].has(key)).length;
  const percentage = total ? ((covered / total) * 100).toFixed(1) : '0.0';
  const suffix = REQUIRED.includes(code) ? '' : ' — opcional, cae a es';
  console.log(`  ${code}: ${covered}/${total} (${percentage}%)${suffix}`);
}
console.log(`Claves usadas en el código: ${used.size}`);

if (warnings.length) {
  console.log(`\nAvisos (${warnings.length}):`);
  for (const warning of warnings.slice(0, 30)) console.log(`  - ${warning}`);
  if (warnings.length > 30) console.log(`  … y ${warnings.length - 30} más`);
}

if (errors.length) {
  console.error(`\nErrores (${errors.length}):`);
  for (const error of errors.slice(0, 60)) console.error(`  - ${error}`);
  if (errors.length > 60) console.error(`  … y ${errors.length - 60} más`);
  process.exit(1);
}

console.log('\nTraducciones consistentes.');
