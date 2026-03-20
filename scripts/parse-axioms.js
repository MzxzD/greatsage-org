#!/usr/bin/env node
/**
 * parse-axioms.js — Fetch AXIOMS.md from janet-seed (GitHub) and emit axioms.json
 *
 * Source of truth: janet-seed/constitution/AXIOMS.md on GitHub
 * Run: node scripts/parse-axioms.js
 * Config: AXIOMS_SOURCE_URL env var or default below
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://raw.githubusercontent.com/MzxzD/JANET/main/core/JanetOS/janet-seed/constitution/AXIOMS.md';
const FALLBACK_LOCAL = path.join(__dirname, '..', '..', 'Janet-Projects', 'JanetOS', 'janet-seed', 'constitution', 'AXIOMS.md');
const SOURCE_URL = process.env.AXIOMS_SOURCE_URL || DEFAULT_URL;
const OUT_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(OUT_DIR, 'axioms.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function fetchLocal(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

async function fetchSource() {
  try {
    const md = await fetchUrl(SOURCE_URL);
    return { md, source: SOURCE_URL };
  } catch (err) {
    if (fs.existsSync(FALLBACK_LOCAL)) {
      console.warn('GitHub fetch failed, using local:', FALLBACK_LOCAL);
      return { md: fetchLocal(FALLBACK_LOCAL), source: 'file:' + FALLBACK_LOCAL };
    }
    throw err;
  }
}

function parseAxioms(md) {
  const axioms = [];
  const lines = md.split('\n');
  let i = 0;

  // Match: ## N. Title
  const axiomHeader = /^##\s+(\d+)\.\s+(.+)$/;
  // Match: **"quote"**
  const quoteLine = /^\*\*"(.+)"\*\*$/;
  // Match: *description*
  const descLine = /^\*(.+)\*$/;

  while (i < lines.length) {
    const m = lines[i].match(axiomHeader);
    if (m) {
      const id = parseInt(m[1], 10);
      const title = m[2].trim();
      let quote = '';
      let description = '';

      i++;
      if (i < lines.length && lines[i].trim() === '') i++;

      if (i < lines.length) {
        const q = lines[i].match(quoteLine);
        if (q) {
          quote = q[1].trim();
          i++;
          if (i < lines.length && lines[i].trim() === '') i++;
        }
      }

      if (i < lines.length) {
        const d = lines[i].match(descLine);
        if (d) {
          description = d[1].trim();
          i++;
        }
      }

      axioms.push({ id, title, quote, description });
    } else {
      i++;
    }
  }

  return axioms;
}

function parseAmendmentLog(md) {
  const log = [];
  const start = md.indexOf('### Amendment Log');
  if (start === -1) return log;
  const block = md.slice(start);
  const re = /-\s+\*\*(\d{4}-\d{2}-\d{2})\*\*:\s+(.+?)(?=\n-|\n\n|$)/gs;
  let m;
  while ((m = re.exec(block)) !== null) {
    log.push({ date: m[1], entry: m[2].trim() });
  }
  return log;
}

function parseRelationships(md) {
  const start = md.indexOf('## 🔗 Axiom Relationships');
  if (start === -1) return '';
  const end = md.indexOf('---', start);
  const block = end > start ? md.slice(start, end) : md.slice(start);
  return block.replace(/^## 🔗 Axiom Relationships\s*\n/, '').trim();
}

function extractVersion(md) {
  const m = md.match(/Amendment Log[\s\S]*?\*\*(\d{4}-\d{2}-\d{2})\*\*/);
  return m ? m[1] : null;
}

async function main() {
  console.log('Fetching AXIOMS.md from:', SOURCE_URL);
  const { md, source } = await fetchSource();
  const axioms = parseAxioms(md);
  const amendmentLog = parseAmendmentLog(md);
  const relationships = parseRelationships(md);
  const version = extractVersion(md) || amendmentLog[0]?.date || 'unknown';

  const out = {
    source,
    fetchedAt: new Date().toISOString(),
    version,
    axioms,
    relationships,
    amendmentLog,
  };

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', axioms.length, 'axioms to', OUT_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
