import fs from 'fs';

if (!fs.existsSync('.next/standalone')) {
  console.error('Error: .next/standalone does not exist. Ensure output: "standalone" is set in next.config.');
  process.exit(1);
}

const targets = [
  ['.next/static', '.next/standalone/.next/static'],
  ['public', '.next/standalone/public'],
];

for (const [src, dest] of targets) {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: ${src} does not exist, skipping.`);
    continue;
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Copied ${src} -> ${dest}`);
}
