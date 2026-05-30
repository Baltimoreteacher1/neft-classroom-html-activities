#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  '404.html',
  '_redirects',
  '_headers',
  'robots.txt',
  'sitemap.xml',
  'teacher-tools/index.html',
  'teacher-tools/tools.css',
  'teacher-tools/tools.js',
  'teacher-tools/neftos-command-center/index.html',
  'teacher-tools/neftos-command-center/app.js',
  'teacher-tools/neftos-command-center/styles.css',
  'teacher-tools/neftos-command-center/manifest.json',
  'teacher-tools/neftos-command-center/service-worker.js'
];

const errors = [];
const warnings = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) errors.push(`Missing required deployment file: ${file}`);
}

const htmlFiles = walk(root).filter(path => extname(path) === '.html');
for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf8');
  const rel = file.replace(`${root}/`, '');
  if (!/<!doctype html>/i.test(content)) errors.push(`${rel}: missing <!DOCTYPE html>`);
  if (!content.includes('<meta name="viewport"')) warnings.push(`${rel}: missing viewport meta tag`);
  if (!content.includes('<title>')) warnings.push(`${rel}: missing title tag`);
  const hrefs = [...content.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  const srcs = [...content.matchAll(/src="([^"]+)"/g)].map(match => match[1]);
  [...hrefs, ...srcs]
    .filter(asset => asset.startsWith('/') && !asset.startsWith('//'))
    .filter(asset => !asset.includes('#') && !asset.includes('?'))
    .forEach(asset => {
      const normalized = asset.endsWith('/') ? `${asset}index.html` : asset;
      if (asset.match(/\.(css|js|json|txt|xml|png|jpg|jpeg|webp|svg|ico)$/i) && !existsSync(join(root, normalized))) {
        warnings.push(`${rel}: linked asset not found: ${asset}`);
      }
    });
}

const redirects = existsSync(join(root, '_redirects')) ? readFileSync(join(root, '_redirects'), 'utf8') : '';
redirects.split('\n').forEach((line, index) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) errors.push(`_redirects:${index + 1}: invalid redirect line`);
  if (!parts[0].startsWith('/')) errors.push(`_redirects:${index + 1}: source should start with /`);
  if (!parts[1].startsWith('/')) warnings.push(`_redirects:${index + 1}: destination is not a local route`);
});

if (errors.length) {
  console.error('\nNeft Teacher static deployment validation failed:\n');
  errors.forEach(error => console.error(`ERROR: ${error}`));
  warnings.forEach(warning => console.warn(`WARN: ${warning}`));
  process.exit(1);
}

console.log('\nNeft Teacher static deployment validation passed.');
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    if (name === '.git' || name === 'node_modules' || name === 'dist' || name === '.vite') return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
