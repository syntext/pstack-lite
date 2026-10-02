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

test('bundled defaults pin Luna Fast workers, Sol judgment, and ordered three-model panels', t => {
  const { project, config } = fixture(t);
  const luna = 'openai/gpt-6-luna-fast#xhigh';
  const sol = 'openai/gpt-6.1-sol#max';
  const panel = [sol, 'openai/gpt-6-astra#max', luna];
  assert.deepEqual(resolveModels(project, config).roles, {
    'feature, refactoring': luna,
    'bug-fix': luna,
    'perf-issue': luna,
    'hillclimb': luna,
    'judgment and prose': sol,
    'hardest tasks': sol,
    'how explorer': luna,
    'how explainer': sol,
    'why investigators': luna,
    'why synthesizer': sol,
    'reflect tooling': sol,
    'reflect judgment, divergent, synthesizer': sol,
    'arena runners': panel,
    'arena cross-judge pool': panel,
    'swarm workers': luna,
    'interrogate reviewers': panel,
  });
});

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
  assert.equal(result.roles['bug-fix'], 'openai/gpt-6-luna-fast#xhigh');
  assert.deepEqual(result.roles['arena runners'], ['openai/gpt-6-luna', 'auto', 'openai/gpt-6-luna']);
});

test('saved model choices preserve provider, alias, local-model, and variant references without live availability', t => {
  const { project, config } = fixture(t);
  const paths = locations(project, config);
  updateModels(paths.global, { version: 1, roles: {
    'how explorer': 'ollama/gemma3:4b',
    'hardest tasks': 'openrouter/anthropic/claude-sonnet-4.5#deep-review',
    'arena runners': ['anthropic/claude-sonnet-4-5'],
  } });
  const overrides = { version: 1, roles: {
    'feature, refactoring': 'custom/team/My.Model:latest#future_budget',
    'arena runners': [
      'vllm/Qwen/Qwen3-Coder-30B-A3B-Instruct',
      'openai/coding-default#fast',
      'openai/gpt-6-astra#none',
      'inherit-parent',
      'auto',
      'openai/coding-default#fast',
    ],
  } };
  updateModels(paths.project, overrides);
  assert.deepEqual(JSON.parse(readFileSync(paths.project, 'utf8')), overrides);
  const result = resolveModels(project, config);
  assert.equal(result.roles['how explorer'], 'ollama/gemma3:4b');
  assert.equal(result.roles['hardest tasks'], 'openrouter/anthropic/claude-sonnet-4.5#deep-review');
  assert.equal(result.roles['feature, refactoring'], 'custom/team/My.Model:latest#future_budget');
  assert.deepEqual(result.roles['arena runners'], overrides.roles['arena runners']);
});

test('model selections are opaque strings; OpenCode owns reference and availability validation', t => {
  const { project, config } = fixture(t);
  const path = locations(project, config).project;
  const selections = [
    'catalog-alias', 'provider/model with spaces#custom variant',
    'provider/model#future#syntax', ' provider/model ', '',
  ];
  for (const selection of selections) {
    const overrides = { version: 1, roles: { 'bug-fix': selection, 'arena runners': [selection] } };
    updateModels(path, overrides);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), overrides);
    const result = resolveModels(project, config);
    assert.equal(result.roles['bug-fix'], selection);
    assert.deepEqual(result.roles['arena runners'], [selection]);
  }
});

test('versioned GPT model references resolve from project files and survive updates', t => {
  const { project, config } = fixture(t);
  const path = locations(project, config).project;
  const overrides = { version: 1, roles: {
    'bug-fix': 'openai/gpt-6.1-sol#high',
    'arena runners': ['openai/gpt-6-sol', 'openai/gpt-6.1-sol#high', 'openai/gpt-6.1-sol'],
  } };
  mkdirSync(join(project, '.opencode'));
  writeFileSync(path, JSON.stringify(overrides));
  const result = resolveModels(project, config);
  assert.equal(result.roles['bug-fix'], overrides.roles['bug-fix']);
  assert.deepEqual(result.roles['arena runners'], overrides.roles['arena runners']);

  updateModels(path, overrides);
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), overrides);
  const script = fileURLToPath(new URL('../skills/setup-pstack/scripts/models.mjs', import.meta.url));
  const output = execFileSync(process.execPath, [script, 'read', '--directory', project, '--role', 'bug-fix'], {
    env: { ...process.env, XDG_CONFIG_HOME: config }, encoding: 'utf8',
  });
  assert.equal(JSON.parse(output), 'openai/gpt-6.1-sol#high');
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
    { version: 1, roles: { 'bug-fix': ['openai/gpt-6-sol'] } },
    { version: 1, roles: { unknown: 'openai/gpt-6-sol' } },
    ...[
      null, 42, true, { model: 'provider/model' },
    ].map(selection => ({ version: 1, roles: { 'bug-fix': selection } })),
    { version: 1, roles: { 'arena runners': ['auto', null] } },
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
  writeFileSync(input, JSON.stringify({ version: 1, roles: { 'how explorer': 'local/coder#careful-pass' } }));
  const run = args => execFileSync(process.execPath, [script, ...args], { cwd: nested, env, encoding: 'utf8' });

  assert.equal(run(['write', '--scope', 'project', '--input', input]).trim(), paths.project);
  const beforeRerun = readFileSync(paths.project, 'utf8');
  run(['write', '--scope', 'project', '--input', input]);
  assert.equal(readFileSync(paths.project, 'utf8'), beforeRerun);
  assert.deepEqual(readdirSync(join(project, '.opencode')), ['pstack-models.json']);
  const effective = JSON.parse(run(['read']));
  assert.equal(effective.paths.project, paths.project);
  assert.equal(effective.roles['how explorer'], 'local/coder#careful-pass');
  assert.equal(effective.roles['bug-fix'], 'openai/gpt-6-luna-fast#xhigh');
  assert.equal(readFileSync(paths.global, 'utf8'), personalBefore);
  assert.deepEqual(readdirSync(global, { recursive: true }).sort(), globalBefore);

  const otherProject = join(root, 'other-project');
  mkdirSync(otherProject);
  execFileSync('git', ['init', '-q', otherProject]);
  const other = JSON.parse(run(['read', '--directory', otherProject]));
  assert.equal(other.roles['how explorer'], 'openai/gpt-6-luna#low');
  assert.equal(existsSync(join(otherProject, '.opencode')), false);
});
