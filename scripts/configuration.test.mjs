import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
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

test('package helper configures a nested project without installing locally or changing personal defaults', t => {
  const { root, project, config } = fixture(t);
  const global = join(config, 'opencode');
  const env = { ...process.env, XDG_CONFIG_HOME: config };
  const script = fileURLToPath(new URL('../skills/setup-pstack/scripts/models.mjs', import.meta.url));
  const paths = locations(project, config);
  updateModels(paths.global, { version: 1, roles: { 'how explorer': 'openai/gpt-6-luna#low' } });
  const personalBefore = readFileSync(paths.global, 'utf8');
  const globalBefore = readdirSync(global, { recursive: true }).sort();
  const nested = join(project, 'src', 'nested');
  mkdirSync(nested, { recursive: true });
  const input = join(root, 'confirmed.json');
  writeFileSync(input, JSON.stringify({ version: 1, roles: { 'how explorer': 'openai/gpt-6-sol#high' } }));
  const run = args => execFileSync(process.execPath, [script, ...args], { cwd: nested, env, encoding: 'utf8' });

  assert.equal(run(['write', '--scope', 'project', '--input', input]).trim(), paths.project);
  const beforeRerun = readFileSync(paths.project, 'utf8');
  run(['write', '--scope', 'project', '--input', input]);
  assert.equal(readFileSync(paths.project, 'utf8'), beforeRerun);
  assert.deepEqual(readdirSync(join(project, '.opencode')), ['pstack-models.json']);
  const effective = JSON.parse(run(['read']));
  assert.equal(effective.paths.project, paths.project);
  assert.equal(effective.roles['how explorer'], 'openai/gpt-6-sol#high');
  assert.equal(effective.roles['bug-fix'], 'openai/gpt-6-sol');
  assert.equal(readFileSync(paths.global, 'utf8'), personalBefore);
  assert.deepEqual(readdirSync(global, { recursive: true }).sort(), globalBefore);

  const otherProject = join(root, 'other-project');
  mkdirSync(otherProject);
  execFileSync('git', ['init', '-q', otherProject]);
  const other = JSON.parse(run(['read', '--directory', otherProject]));
  assert.equal(other.roles['how explorer'], 'openai/gpt-6-luna#low');
  assert.equal(existsSync(join(otherProject, '.opencode')), false);
});
