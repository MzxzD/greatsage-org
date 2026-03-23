#!/usr/bin/env node
/**
 * Lumina Accessibility Test — axe-core + Playwright
 * Runs WCAG 2.1 Level A/AA checks on greatsage.org pages
 */
import { AxeBuilder } from '@axe-core/playwright';
import * as playwright from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const BASE = process.env.LUMINA_A11Y_URL || 'http://localhost:8765';
const PAGES = [
  { name: 'index', url: `${BASE}/index.html` },
  { name: 'understand', url: `${BASE}/understand.html` },
];

function formatViolation(v) {
  const nodes = v.nodes.slice(0, 3).map(n => n.html?.slice(0, 80) || n.target?.join(', ')).join('; ');
  return `  [${v.impact}] ${v.id}: ${v.help}\n    → ${nodes}`;
}

async function run() {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();

  const allViolations = [];
  const allIncomplete = [];
  let passCount = 0;

  for (const page of PAGES) {
    const pwPage = await context.newPage();
    try {
      await pwPage.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.warn(`  ⚠ Could not load ${page.name}: ${e.message}`);
      await pwPage.close();
      continue;
    }

    const results = await new AxeBuilder({ page: pwPage })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    const violations = results.violations || [];
    const incomplete = results.incomplete || [];

    allViolations.push(...violations.map(v => ({ ...v, page: page.name })));
    allIncomplete.push(...incomplete.map(i => ({ ...i, page: page.name })));
    passCount += results.passes?.length || 0;

    await pwPage.close();
  }

  await browser.close();

  // Report
  console.log('\n═══ Lumina Accessibility Report (axe-core) ═══\n');
  console.log(`Pages tested: ${PAGES.length}`);
  console.log(`Rules passed: ${passCount}\n`);

  if (allViolations.length > 0) {
    console.log('❌ VIOLATIONS:\n');
    const byId = {};
    allViolations.forEach(v => {
      const key = v.id;
      if (!byId[key]) byId[key] = { ...v, pages: new Set() };
      byId[key].pages.add(v.page);
    });
    Object.values(byId).forEach(v => {
      console.log(`[${v.impact}] ${v.id}: ${v.help}`);
      console.log(`  WCAG: ${(v.tags || []).filter(t => t.startsWith('wcag')).join(', ')}`);
      console.log(`  Pages: ${[...v.pages].join(', ')}`);
      v.nodes?.slice(0, 2).forEach(n => console.log(`  → ${(n.html || n.target?.join(', ')).slice(0, 100)}`));
      console.log('');
    });
  } else {
    console.log('✅ No violations found.\n');
  }

  if (allIncomplete.length > 0) {
    console.log('⚠️  INCOMPLETE (manual review):');
    allIncomplete.forEach(i => console.log(`  - ${i.id}: ${i.help}`));
    console.log('');
  }

  process.exit(allViolations.length > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Lumina a11y test failed:', e);
  process.exit(1);
});
