#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'locales');

const merge = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const branch = target[key] && typeof target[key] === 'object' ? target[key] : {};
      target[key] = merge(branch, value);
    } else {
      target[key] = value;
    }
  }
  return target;
};

const input = JSON.parse(readFileSync(0, 'utf8'));
for (const [code, block] of Object.entries(input)) {
  const path = join(LOCALES, `${code}.json`);
  const current = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(path, `${JSON.stringify(merge(current, block), null, 2)}\n`, 'utf8');
  console.log(`${code}.json actualizado`);
}
