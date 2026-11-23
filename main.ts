// news-image-20261122 — hand the day's news picture to /output/entry.png.
//
// The judged artifact is only that one image: a 1024x1024 poster of the news of Sunday,
// 22 November 2026. The grader runs this program with no network, so it copies the poster
// that the agent rendered in this repository; poster.html is the source it was rendered from.
//
// Local run:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SOURCE = join(BOT_DIR, 'entry.png');
const TARGET = join(OUTPUT_DIR, 'entry.png');

function checkImage(path: string): void {
  const bytes = readFileSync(path);
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!jpeg && !png) throw new Error('entry.png is neither a JPEG nor a PNG');
  if (bytes.length > 1048576) throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB cap`);
  // Both accepted formats start with a dimension header; reject a poster of the wrong size.
  const w = jpeg ? readJpegWidth(bytes) : bytes.readUInt32BE(16);
  const h = jpeg ? readJpegHeight(bytes) : bytes.readUInt32BE(20);
  if (w > 1024 || h > 1024) throw new Error(`entry.png is ${w}x${h}, over the 1024x1024 cap`);
}

function readJpegWidth(bytes: Buffer): number {
  let offset = 2;
  while (offset < bytes.length - 9) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return bytes.readUInt16BE(offset + 7);
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error('JPEG header has no SOF marker');
}

function readJpegHeight(bytes: Buffer): number {
  let offset = 2;
  while (offset < bytes.length - 9) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return bytes.readUInt16BE(offset + 5);
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error('JPEG header has no SOF marker');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
checkImage(SOURCE);
copyFileSync(SOURCE, TARGET);
console.log(`Handed in the 22 November 2026 news image (${readFileSync(TARGET).length} bytes)`);
