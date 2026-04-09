#!/usr/bin/env node
/**
 * Export Janet Halo animation as a looping GIF (loading spinner).
 * Uses Playwright to capture frames, gifenc to encode.
 *
 * Usage: npm run export-jack-gif
 * Output: greatsage-web/janet-halo-loading.gif
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const capturePath = 'file://' + join(rootDir, 'gif-capture.html');
const outputPath = join(rootDir, 'janet-halo-loading.gif');

const FPS = 20;
const DURATION_MS = 2500; // ~2.5 seconds for a few full rotations
const FRAME_DELAY_MS = 1000 / FPS;
const NUM_FRAMES = Math.ceil((DURATION_MS / 1000) * FPS);

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 400, height: 400 });
  await page.goto(capturePath, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-ready="true"]', { timeout: 3000 });

  const overlay = page.locator('.janet-jack-overlay');
  const box = await overlay.boundingBox();
  if (!box) throw new Error('Overlay not found');

  const width = Math.round(box.width);
  const height = Math.round(box.height);
  console.log(`Capturing ${NUM_FRAMES} frames at ${width}x${height} (${FPS} fps)...`);

  const frames = [];
  for (let i = 0; i < NUM_FRAMES; i++) {
    const buf = await overlay.screenshot({ type: 'png' });
    frames.push(buf);
    await page.waitForTimeout(FRAME_DELAY_MS);
  }
  await browser.close();

  console.log('Encoding GIF...');
  const gif = GIFEncoder();
  let palette = null;

  for (let i = 0; i < frames.length; i++) {
    const { data } = await sharp(frames[i])
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const rgba = new Uint8ClampedArray(data);

    if (i === 0) {
      palette = quantize(rgba, 128);
    }
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, width, height, {
      palette,
      delay: Math.round(FRAME_DELAY_MS / 10),
    });
  }
  gif.finish();

  writeFileSync(outputPath, Buffer.from(gif.bytes()));
  console.log('Written:', outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
