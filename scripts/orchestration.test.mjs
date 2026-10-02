import assert from 'node:assert/strict';
import { execFile, execFileSync, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { command } from '../skills/poteto-mode/scripts/orch/store.mjs';

const cli = fileURLToPath(new URL('../skills/poteto-mode/scripts/orch/orch.mjs', import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'pstack-orch-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = join(root, 'run');
  const run = (action, input) => command(store, action, input);
  await run('init');
  const add = (id, depends = []) => run('unit add', { id, track: 'build', source: `brief.txt task ${id}`, brief: join(root, `${id}.md`), depends });
  const record = (id, sha, verdict = 'unit-test-verified', attempt = 1) => run('ledger record', { id, sha, verdict, attempt, evidence: join(root, 'receipt.txt'), verifier: 'reviewer' });
  return { root, store, run, add, record };
}

test('dependencies require verified integration, not a worker success report', async t => {
  const { run, add, record } = await fixture(t);
  await add('a'); await add('b'); await add('c', ['a', 'b']);
  assert.deepEqual((await run('status')).ready, ['a', 'b']);
  await assert.rejects(run('unit start', { id: 'c', worker: 'owner-c' }), /not ready/);
  for (const id of ['a', 'b']) {
    const row = await run('unit start', { id, worker: `owner-${id}` });
    assert.equal(row.attempt, 1);
    await run('unit result', { id, attempt: 1, sha: `${id}-worker` });
    await record(id, `${id}-worker`, 'type-check-only');
    await assert.rejects(run('unit integrate', { id, attempt: 1, sha: `${id}-integrated` }), /not verified/);
    await record(id, `${id}-worker`);
    await run('unit integrate', { id, attempt: 1, sha: `${id}-integrated` });
    await assert.rejects(run('unit done', { id, attempt: 1 }), /acceptance/);
    await record(id, `${id}-integrated`, 'verifier-blocked');
    await assert.rejects(run('unit done', { id, attempt: 1 }), /acceptance/);
    await record(id, `${id}-integrated`);
    await run('unit done', { id, attempt: 1 });
  }
  assert.deepEqual((await run('status')).ready, ['c']);
  assert.equal((await run('unit start', { id: 'c', worker: 'owner-c' })).state, 'running');
});

test('revision changes and replacement attempts reject stale verdicts and results', async t => {
  const { run, add, record } = await fixture(t);
  await add('a');
  await run('unit start', { id: 'a', worker: 'old' });
  await run('unit result', { id: 'a', attempt: 1, sha: 'old' });
  await record('a', 'old');
  await run('unit revise', { id: 'a', attempt: 1, sha: 'new' });
  await assert.rejects(run('ledger check', { id: 'a', sha: 'old' }), /NOT-VERIFIED/);
  await assert.rejects(record('a', 'old'), /current code/);
  await assert.rejects(run('unit integrate', { id: 'a', attempt: 1, sha: 'integrated' }), /not verified/);
  await assert.rejects(run('unit stop', { id: 'a', attempt: 1, state: 'failed', evidence: 'failure' }), /writerStopped/);
  await run('unit stop', { id: 'a', attempt: 1, state: 'failed', evidence: 'failure', writerStopped: true });
  assert.equal((await run('unit start', { id: 'a', worker: 'replacement' })).attempt, 2);
  await assert.rejects(run('unit result', { id: 'a', attempt: 1, sha: 'late' }), /stale/);
  await run('unit result', { id: 'a', attempt: 2, sha: 'replacement' });
  await assert.rejects(record('a', 'replacement', 'unit-test-verified', 1), /stale/);
  await record('a', 'replacement', 'verifier-failed', 2);
  assert.equal((await run('unit list'))[0].state, 'needs-verification');
});

test('completion drain survives interruption; acknowledgment archives and replays idempotently', async t => {
  const { run, add, store } = await fixture(t);
  await add('a');
  await run('unit start', { id: 'a', worker: 'owner' });
  const pointer = await run('inbox push', { unit: 'a', attempt: 1, status: 'code-ready', report: 'receipt.txt' });
  assert.deepEqual(await run('inbox drain'), [pointer]);
  assert.deepEqual(await command(store, 'inbox drain'), [pointer]);
  await run('unit result', { id: 'a', attempt: 1, sha: 'revision' });
  const input = { id: pointer.id, disposition: 'result recorded' };
  const acknowledged = await run('inbox ack', input);
  assert.deepEqual(await command(store, 'inbox ack', input), acknowledged);
  const status = await command(store, 'status');
  assert.deepEqual(status.inbox, []);
  assert.deepEqual(status.processed, [acknowledged]);
  assert.equal(status.units[0].state, 'needs-verification');
});

test('standing orders, gates, initialization, locking, and invalid input preserve state', async t => {
  const { run, store, add } = await fixture(t);
  await run('standing add', { line: 'Preserve local edits.' });
  await run('standing add', { line: 'Preserve local edits.' });
  assert.deepEqual(await run('standing show'), ['Preserve local edits.']);
  await run('gate park', { id: 'choice', question: 'Choose scope?', options: 'a,b', default: 'hold' });
  assert.equal((await run('gate list')).length, 1);
  await run('gate resolve', { id: 'choice', answer: 'a' });
  assert.deepEqual(await run('gate list'), []);
  await add('a');
  const path = join(store, 'state.json');
  const before = await readFile(path, 'utf8');
  await assert.rejects(add('b', ['missing']), /dependencies/);
  assert.equal(await readFile(path, 'utf8'), before);
  await run('init');
  assert.equal(await readFile(path, 'utf8'), before);
  await writeFile(join(store, '.orch.lock'), `${process.pid}:fixture`);
  await assert.rejects(run('status'), /locked/);
  await assert.rejects(run('recover'), /still alive/);
  assert.equal(await readFile(join(store, '.orch.lock'), 'utf8'), `${process.pid}:fixture`);
  const dead = spawnSync(process.execPath, ['-e', '']);
  await writeFile(join(store, '.orch.lock'), `${dead.pid}:fixture`);
  assert.deepEqual(await run('recover'), { recovered: true });
  await run('status');
  assert.ok(!(await readdir(store)).includes('.orch.lock'));
  await writeFile(path, '{broken');
  await assert.rejects(run('init'), SyntaxError);
  assert.equal(await readFile(path, 'utf8'), '{broken');
});

test('CLI works across processes and leaves supplied inputs and Git untouched', async t => {
  const { root, store } = await fixture(t);
  const input = join(root, 'requirements.md');
  const dirty = join(root, 'existing.txt');
  await writeFile(input, '# Requirements\n- [ ] Retain existing behavior.\n');
  await writeFile(dirty, 'user edits\n');
  execFileSync('git', ['init', '-q', root]);
  const before = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  const invoke = (action, value) => JSON.parse(execFileSync(process.execPath, [cli, '--store', store, ...action.split(' '), ...(value ? ['--input', JSON.stringify(value)] : [])], { cwd: root, encoding: 'utf8' }));
  invoke('unit add', { id: 'a', track: 'build', source: input, brief: 'brief.txt' });
  assert.equal(invoke('unit start', { id: 'a', worker: 'leaf' }).attempt, 1);
  assert.equal(invoke('status').units[0].state, 'running');
  assert.equal(await readFile(input, 'utf8'), '# Requirements\n- [ ] Retain existing behavior.\n');
  assert.equal(await readFile(dirty, 'utf8'), 'user edits\n');
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }), before);
  assert.equal(spawnSync(process.execPath, [cli, '--store', store, 'unit', 'start', '--input', '[]']).status, 1);
});

test('real isolated Git workers integrate continuously before dependent work starts', async t => {
  const { root, run, add } = await fixture(t);
  const record = async (id, sha, output) => {
    const evidence = join(root, `${id}-${sha}.json`);
    await writeFile(evidence, `${JSON.stringify({ unit: id, sha, output })}\n`);
    return run('ledger record', { id, attempt: 1, sha, verdict: 'unit-test-verified', evidence, verifier: 'fixture-check' });
  };
  const repo = join(root, 'repo');
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--initial-branch=main', repo]);
  git('config', 'user.name', 'Orch Test'); git('config', 'user.email', 'orch@example.invalid');
  await writeFile(join(repo, 'requirements.txt'), 'a exports 2; b exports 3; c sums both to 5.\n');
  git('add', 'requirements.txt'); git('commit', '-qm', 'fixture');
  await writeFile(join(repo, 'user-notes.txt'), 'unrelated local work\n');
  await add('a'); await add('b'); await add('c', ['a', 'b']);
  for (const id of ['a', 'b']) {
    const checkout = join(root, `worker-${id}`);
    git('worktree', 'add', '-q', '-b', `unit-${id}`, checkout);
    await run('unit start', { id, worker: id, branch: checkout });
  }
  const workers = ['a', 'b'].map(async (id, index) => {
    const checkout = join(root, `worker-${id}`);
    await promisify(execFile)(process.execPath, ['--input-type=module', '-e', `import {writeFile} from 'node:fs/promises'; await writeFile('${id}.mjs', 'export default ${index + 2};\\n');`], { cwd: checkout });
    execFileSync('git', ['-C', checkout, 'add', `${id}.mjs`]);
    execFileSync('git', ['-C', checkout, 'commit', '-qm', `build ${id}`]);
    const sha = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', `import value from './${id}.mjs'; console.log(value);`], { cwd: checkout, encoding: 'utf8' }).trim(), String(index + 2));
    return { id, sha, output: String(index + 2) };
  });
  for (const { id, sha, output } of await Promise.all(workers)) {
    await run('unit result', { id, attempt: 1, sha });
    await record(id, sha, output);
    git('cherry-pick', sha);
    const integrated = git('rev-parse', 'HEAD');
    await run('unit integrate', { id, attempt: 1, sha: integrated });
    const integratedOutput = execFileSync(process.execPath, ['--input-type=module', '-e', `import value from './${id}.mjs'; console.log(value);`], { cwd: repo, encoding: 'utf8' }).trim();
    assert.equal(integratedOutput, id === 'a' ? '2' : '3');
    await record(id, integrated, integratedOutput); await run('unit done', { id, attempt: 1 });
  }
  await run('unit start', { id: 'c', worker: 'coupled-owner', branch: repo });
  await writeFile(join(repo, 'c.mjs'), "import a from './a.mjs'; import b from './b.mjs'; export default a + b;\n");
  git('add', 'c.mjs'); git('commit', '-qm', 'integrate sum');
  const sha = git('rev-parse', 'HEAD');
  await run('unit result', { id: 'c', attempt: 1, sha });
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', "import sum from './c.mjs'; console.log(sum);"], { cwd: repo, encoding: 'utf8' }).trim();
  assert.equal(output, '5');
  await record('c', sha, output); await run('unit integrate', { id: 'c', attempt: 1, sha });
  await record('c', sha, output); await run('unit done', { id: 'c', attempt: 1 });
  assert.deepEqual((await run('status')).counts, { done: 3 });
  assert.equal(await readFile(join(repo, 'user-notes.txt'), 'utf8'), 'unrelated local work\n');
  assert.equal(await readFile(join(repo, 'requirements.txt'), 'utf8'), 'a exports 2; b exports 3; c sums both to 5.\n');
  assert.equal(git('remote'), '');
});
