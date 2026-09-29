import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../skills/poteto-mode/scripts/worktree-audit.sh', import.meta.url));

function fixture(t, branch = 'main') {
  const root = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'pstack-worktrees-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, 'main checkout');
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const git = (directory, ...args) => execFileSync('git', ['-C', directory, ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  mkdirSync(repo);
  git(repo, 'init', '-q', '-b', branch);
  git(repo, 'config', 'user.name', 'Test');
  git(repo, 'config', 'user.email', 'test@example.invalid');
  writeFileSync(join(repo, 'file.txt'), 'base\n');
  git(repo, 'add', 'file.txt');
  git(repo, 'commit', '-qm', 'base');
  const worktree = name => {
    const path = join(root, `${name} checkout`);
    git(repo, 'worktree', 'add', '-qb', name, path);
    return path;
  };
  const audit = (...args) => {
    const stdout = execFileSync('bash', [script, repo, ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const [header, ...lines] = stdout.trimEnd().split('\n');
    return new Map(lines.map(line => {
      const row = Object.fromEntries(header.split('\t').map((key, i) => [key, line.split('\t')[i]]));
      return [row.WORKTREE, row];
    }));
  };
  return { repo, git, worktree, audit };
}

test('local audit handles paths with spaces and holds tracked and untracked work', t => {
  const { repo, git, worktree, audit } = fixture(t);
  const merged = worktree('merged');
  writeFileSync(join(merged, 'file.txt'), 'integrated\n');
  git(merged, 'commit', '-qam', 'integrated');
  git(repo, 'merge', '--ff-only', 'merged');
  const dirty = worktree('dirty');
  writeFileSync(join(dirty, 'file.txt'), 'unfinished\n');
  const untracked = worktree('untracked');
  writeFileSync(join(untracked, 'notes.txt'), 'keep my notes\n');
  git(repo, 'config', 'status.showUntrackedFiles', 'no');
  const refs = git(repo, 'show-ref');
  const rows = audit();
  assert.equal(rows.size, 3);
  assert.equal(rows.has(repo), false);
  assert.equal(rows.get(merged).IN_BASE, 'YES');
  assert.equal(rows.get(merged).BUCKET, 'verify-session');
  assert.equal(rows.get(merged).LAST_CHAT, 'unknown');
  assert.equal(rows.get(dirty).DIRTY, 'wip:1');
  assert.equal(rows.get(dirty).BUCKET, 'hold-wip');
  assert.equal(rows.get(untracked).DIRTY, 'untracked:1');
  assert.equal(rows.get(untracked).BUCKET, 'hold-untracked');
  assert.equal(git(repo, 'show-ref'), refs);
  assert.equal(git(repo, 'remote'), '');
  assert.equal(readFileSync(join(dirty, 'file.txt'), 'utf8'), 'unfinished\n');
  assert.equal(readFileSync(join(untracked, 'notes.txt'), 'utf8'), 'keep my notes\n');
});

test('missing bases and missing checkouts remain unknown; an explicit local base resolves ancestry', t => {
  const { worktree, audit } = fixture(t, 'trunk');
  const tree = worktree('topic');
  assert.equal(audit().get(tree).IN_BASE, 'unknown');
  assert.equal(audit().get(tree).BUCKET, 'review');
  assert.equal(audit('trunk').get(tree).IN_BASE, 'YES');
  assert.equal(audit('missing-ref').get(tree).IN_BASE, 'unknown');
  rmSync(tree, { recursive: true });
  const missing = audit('trunk').get(tree);
  assert.equal(missing.IN_BASE, 'unknown');
  assert.equal(missing.DIRTY, 'unknown');
  assert.equal(missing.BUCKET, 'review');
});

test('squash-integrated work still requires review when ancestry cannot establish integration', t => {
  const { repo, git, worktree, audit } = fixture(t);
  const tree = worktree('topic');
  writeFileSync(join(tree, 'file.txt'), 'feature\n');
  git(tree, 'commit', '-qam', 'feature');
  git(repo, 'merge', '--squash', 'topic');
  git(repo, 'commit', '-qm', 'squashed feature');
  assert.equal(git(repo, 'diff', 'topic'), '');
  const row = audit().get(tree);
  assert.equal(row.IN_BASE, 'no');
  assert.equal(row.DIRTY, 'clean');
  assert.equal(row.BUCKET, 'review');
});
