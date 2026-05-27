#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const registryPath = resolve(root, 'data/routes.json');
const redirectsPath = resolve(root, '_redirects');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

validateRegistry(registry);
writeRedirects(registry.redirects || []);

console.log('Generated Cloudflare route files from data/routes.json');

function writeRedirects(redirects) {
  const lines = [
    '# Cloudflare Pages redirects for Neft Hub static site',
    '# Generated from data/routes.json by tools/generate-route-files.mjs',
    '# Format: [source] [destination] [status]',
    ''
  ];

  for (const redirect of redirects) {
    lines.push(`${redirect.source} ${redirect.destination} ${redirect.status || 301}`);
  }

  lines.push('');
  writeFileSync(redirectsPath, lines.join('\n'), 'utf8');
}

function validateRegistry(value) {
  const errors = [];
  const ids = new Set();
  const paths = new Set();

  if (!Array.isArray(value.routes)) errors.push('routes must be an array');
  if (!Array.isArray(value.redirects)) errors.push('redirects must be an array');

  for (const route of value.routes || []) {
    if (!route.id) errors.push('route missing id');
    if (!route.title) errors.push(`${route.id || 'unknown route'} missing title`);
    if (!route.path || !route.path.startsWith('/')) errors.push(`${route.id || 'unknown route'} has invalid path`);
    if (!Array.isArray(route.family) || route.family.length === 0) errors.push(`${route.id || 'unknown route'} missing family array`);
    if (ids.has(route.id)) errors.push(`duplicate route id: ${route.id}`);
    if (paths.has(route.path)) errors.push(`duplicate route path: ${route.path}`);
    ids.add(route.id);
    paths.add(route.path);
  }

  for (const redirect of value.redirects || []) {
    if (!redirect.source?.startsWith('/')) errors.push(`invalid redirect source: ${redirect.source}`);
    if (!redirect.destination?.startsWith('/')) errors.push(`invalid redirect destination for ${redirect.source}`);
    if (![301, 302, 307, 308].includes(Number(redirect.status || 301))) errors.push(`invalid redirect status for ${redirect.source}`);
  }

  if (errors.length) {
    console.error('Route registry validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
}
