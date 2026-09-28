import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { install } from './install.mjs';
import { locations, resolveModels, updateModels } from '../skills/setup-pstack/scripts/models.mjs';

function fixture(t) {
  const root = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'pstack-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, 'project');
  const config = join(root, 'config');
  mkdirSync(project);
  execFileSync('git', ['init', '-q', project]);
  return { root, project, config };
}

test('nested project resolution overlays roles and replaces panels without reordering', t => {
  const { project, config } = fixture(t);
  const paths = locations(project, config);
  updateModels(paths.global, { version: 1, roles: {
    'how explorer': 'openai/gpt-6-luna#high',
    'hardest tasks': 'openai/gpt-6-astra#max',
    'arena runners': ['openai/gpt-6-astra', 'openai/gpt-6-sol'],
  } });
  updateModels(paths.project, { version: 1, roles: {
    'how explorer': 'inherit-parent',
    'arena runners': ['openai/gpt-6-luna', 'auto', 'openai/gpt-6-luna'],
  } });
  const nested = join(project, 'src', 'deep');
  mkdirSync(nested, { recursive: true });
  const result = resolveModels(nested, config);
  assert.equal(result.paths.project, paths.project);
  assert.equal(result.roles['how explorer'], 'inherit-parent');
  assert.equal(result.roles['hardest tasks'], 'openai/gpt-6-astra#max');
  assert.equal(result.roles['bug-fix'], 'openai/gpt-6-sol');
  assert.deepEqual(result.roles['arena runners'], ['openai/gpt-6-luna', 'auto', 'openai/gpt-6-luna']);
});

test('setup reruns preserve other roles and are idempotent; invalid updates leave files intact', t => {
  const { project, config } = fixture(t);
  const path = locations(project, config).project;
  updateModels(path, { version: 1, roles: { 'hardest tasks': 'inherit-parent' } });
  const update = { version: 1, roles: { 'bug-fix': 'openai/gpt-6-sol#high' } };
  updateModels(path, update);
  const before = readFileSync(path, 'utf8');
  updateModels(path, update);
  assert.equal(readFileSync(path, 'utf8'), before);
  assert.equal(JSON.parse(before).roles['hardest tasks'], 'inherit-parent');
  for (const invalid of [
    { version: 2, roles: {} },
    { version: 1, roles: { 'arena runners': [] } },
    { version: 1, roles: { 'bug-fix': 'gpt-6-sol-high' } },
    { version: 1, roles: { 'bug-fix': ['openai/gpt-6-sol'] } },
    { version: 1, roles: { 'hardest tasks': 'openai/gpt-6-astra#none' } },
    { version: 1, roles: { unknown: 'openai/gpt-6-sol' } },
  ]) {
    assert.throws(() => updateModels(path, invalid));
    assert.equal(readFileSync(path, 'utf8'), before);
  }
  writeFileSync(path, '{broken');
  assert.throws(() => resolveModels(project, config), /pstack-models.json/);
  assert.throws(() => updateModels(path, update), /pstack-models.json/);
  assert.equal(readFileSync(path, 'utf8'), '{broken');
});

test('non-Git projects resolve the nearest .opencode and worktrees use their own root', t => {
  const { root, project, config } = fixture(t);
  const plain = join(root, 'plain');
  const nested = join(plain, 'src');
  mkdirSync(join(plain, '.opencode'), { recursive: true });
  mkdirSync(nested);
  assert.equal(locations(nested, config).project, join(plain, '.opencode/pstack-models.json'));
  execFileSync('git', ['-C', project, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture']);
  const worktree = join(root, 'linked');
  execFileSync('git', ['-C', project, 'worktree', 'add', '-q', '--detach', worktree]);
  assert.equal(locations(worktree, config).project, join(worktree, '.opencode/pstack-models.json'));
});

test('installation is repeatable, preserves unrelated files and supports linked CLI execution', t => {
  const { project, config } = fixture(t);
  const destination = join(project, '.opencode');
  mkdirSync(destination);
  writeFileSync(join(destination, 'opencode.json'), '{"model":"user/model"}\n');
  assert.ok(install(destination).length > 2);
  assert.deepEqual(install(destination), []);
  assert.equal(readFileSync(join(destination, 'opencode.json'), 'utf8'), '{"model":"user/model"}\n');
  const script = join(destination, 'skills/setup-pstack/scripts/models.mjs');
  const result = JSON.parse(execFileSync(process.execPath, [script, 'read', '--directory', project, '--role', 'how explorer'], {
    encoding: 'utf8', env: { ...process.env, XDG_CONFIG_HOME: config },
  }));
  assert.equal(result, 'openai/gpt-6-luna');
  assert.equal(realpathSync(join(destination, 'agents/comment-sicko.md')), fileURLToPath(new URL('../agents/comment-sicko.md', import.meta.url)));
  assert.ok(existsSync(join(destination, 'skills/poteto-mode/scripts/watch-pr/watch-pr')));
});

test('installation conflicts are detected before creating any links', t => {
  const { project } = fixture(t);
  const destination = join(project, '.opencode');
  mkdirSync(join(destination, 'agents'), { recursive: true });
  const path = join(destination, 'agents/poteto-agent.md');
  writeFileSync(path, 'user-owned agent');
  assert.throws(() => install(destination), /Installation conflict/);
  assert.equal(readFileSync(path, 'utf8'), 'user-owned agent');
  assert.equal(existsSync(join(destination, 'skills')), false);
});

test('checkout-wide discovery links are recognized as an existing installation', t => {
  const { project } = fixture(t);
  const destination = join(project, '.opencode');
  mkdirSync(destination);
  for (const kind of ['skills', 'agents']) {
    symlinkSync(fileURLToPath(new URL(`../${kind}`, import.meta.url)), join(destination, kind), 'dir');
  }
  assert.deepEqual(install(destination), []);
});

test('dangling same-name links are conflicts before any installation writes', t => {
  const { project } = fixture(t);
  const destination = join(project, '.opencode');
  mkdirSync(join(destination, 'agents'), { recursive: true });
  symlinkSync('/missing/pstack-agent.md', join(destination, 'agents/poteto-agent.md'));
  assert.throws(() => install(destination), /Installation conflict/);
  assert.equal(existsSync(join(destination, 'skills')), false);
});
