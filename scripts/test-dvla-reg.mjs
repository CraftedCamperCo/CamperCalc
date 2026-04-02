#!/usr/bin/env node
/**
 * Automated DVLA registration lookup test script.
 * Run: npm run test:dvla
 * Or:  node scripts/test-dvla-reg.mjs [reg1] [reg2] ...
 * Requires: EXPO_PUBLIC_DVLA_API_KEY in .env.local (or env)
 *
 * Add test regs to TEST_REGS below or pass as CLI args. Use real UK regs for live API testing.
 * DVLA has rate limits — script waits 500ms between requests.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env.local
try {
  const envPath = resolve(root, '.env.local');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  // .env.local optional
}

const API_KEY = process.env.EXPO_PUBLIC_DVLA_API_KEY;
const DVLA_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

// Add real UK regs here for production API testing. DVLA sandbox regs (AA19AAA etc)
// only work against the sandbox endpoint, not production.
const DEFAULT_REGS = [
  // Paste regs from AutoTrader/other listings, e.g.:
  // 'AB20CDE', 'CD22EFG',
];

async function lookup(reg) {
  const r = reg.trim().toUpperCase().replace(/\s+/g, '');
  if (!r) return { reg, error: 'Empty reg' };
  const res = await fetch(DVLA_URL, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationNumber: r }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { reg: r, status: res.status, error: data?.message || res.statusText };
  return { reg: r, ok: true, make: data.make, model: data.model, colour: data.colour, fuelType: data.fuelType, year: data.yearOfManufacture };
}

async function main() {
  if (!API_KEY) {
    console.error('Missing EXPO_PUBLIC_DVLA_API_KEY. Add to .env.local and run again.');
    process.exit(1);
  }
  const regs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_REGS;
  if (!regs.length) {
    console.log('Usage: npm run test:dvla\n   or: node scripts/test-dvla-reg.mjs REG1 REG2 ...\n');
    console.log('Add regs to DEFAULT_REGS in this script or pass as CLI args.');
    process.exit(0);
  }
  console.log('DVLA Registration Lookup Test\n');
  let passed = 0;
  let failed = 0;
  for (const reg of regs) {
    const result = await lookup(reg);
    const ok = result.ok;
    if (ok) passed++; else failed++;
    console.log(JSON.stringify(result, null, 2));
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`\nDone. ${passed} found, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
