import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const TARGET_NODE_VERSION = '20.19.0';
const TARGET_NPM_VERSION = '10.8.2';
const currentNodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);

function resolveCommand(command) {
  if (process.platform !== 'win32') {
    return command;
  }

  if (command === 'npm' || command === 'npx') {
    return `${command}.cmd`;
  }

  return command;
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

function runStep(label, command, args) {
  console.log(`=== ${label} ===`);
  const resolvedCommand = resolveCommand(command);
  const result =
    process.platform === 'win32'
      ? spawnSync([resolvedCommand, ...args].map(quoteArg).join(' '), {
          stdio: 'inherit',
          shell: true
        })
      : spawnSync(resolvedCommand, args, { stdio: 'inherit' });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpmStep(label, args) {
  if (currentNodeMajor === 20) {
    runStep(label, 'npm', args);
    return;
  }

  runStep(label, 'npx', [
    '--yes',
    '-p',
    `node@${TARGET_NODE_VERSION}`,
    '-p',
    `npm@${TARGET_NPM_VERSION}`,
    'npm',
    ...args
  ]);
}

function runNodeStep(label, args) {
  if (currentNodeMajor === 20) {
    runStep(label, 'node', args);
    return;
  }

  runStep(label, 'npx', ['--yes', '-p', `node@${TARGET_NODE_VERSION}`, 'node', ...args]);
}

runNpmStep('Quality gate', ['run', 'ci:check']);
runNpmStep('Coverage gate', ['run', 'test:coverage']);
runNpmStep('Pack dry-run', ['pack', '--dry-run']);

const binPath = new URL('../dist/mcp.js', import.meta.url);
const firstLine = fs.readFileSync(binPath, 'utf8').split('\n', 1)[0] ?? '';

if (firstLine !== '#!/usr/bin/env node') {
  console.error('dist/mcp.js is missing the expected shebang.');
  process.exit(1);
}

runNodeStep('CLI smoke test', ['dist/mcp.js', '--version']);

console.log('=== All checks passed. Ready to publish. ===');
console.log('Run: npm publish --access public');
