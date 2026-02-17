#!/usr/bin/env node

const { spawn } = require('node:child_process');

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const maxOldSpaceSizeMb = toInt(
  process.env.NEXT_BUILD_MAX_OLD_SPACE ?? process.env.MAX_OLD_SPACE_SIZE,
  2048,
);

// Next 16 can build with Turbopack or webpack. On low-memory servers Turbopack
// can be more memory-hungry. Default to webpack, but allow override.
// Set `NEXT_BUILD_BUNDLER=turbopack` to use Turbopack.
const bundler = (process.env.NEXT_BUILD_BUNDLER ?? 'webpack').toLowerCase();

// Avoid noisy telemetry during CI/server deploys.
if (process.env.NEXT_TELEMETRY_DISABLED === undefined) {
  process.env.NEXT_TELEMETRY_DISABLED = '1';
}

let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next');
} catch (e) {
  console.error('Could not resolve Next.js CLI. Did you run `yarn install`?');
  console.error(e);
  process.exit(1);
}

const additionalArgs = process.argv.slice(2);
const bundlerFlag = bundler === 'turbopack' || bundler === 'turbo' ? '--turbopack' : '--webpack';
const args = [
  `--max-old-space-size=${maxOldSpaceSizeMb}`,
  nextBin,
  'build',
  bundlerFlag,
  ...additionalArgs,
];

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
