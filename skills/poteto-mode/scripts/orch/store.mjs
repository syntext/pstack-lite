import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/** @typedef {{id: string, track: string, source: string, brief: string, depends: string[], state: string, attempt: number, worker: string, branch: string, sha: string, integratedSha: string, stops: {attempt: number, state: string, evidence: string}[]}} Unit */
/** @typedef {{unit: string, attempt: number, sha: string, verdict: string, evidence: string, verifier: string}} Verdict */
/** @typedef {{id: string, unit: string, attempt: number, status: string, report: string, disposition?: string}} Pointer */
/** @typedef {{id: string, question: string, options: string, default: string, answer?: string}} Gate */
/** @typedef {{version: number, units: Unit[], ledger: Verdict[], inbox: Pointer[], processed: Pointer[], gates: Gate[], standing: string[]}} State */
/** @typedef {Record<string, unknown>} Input */

const verdicts = ['live-verified', 'unit-test-verified', 'type-check-only', 'verifier-blocked', 'verifier-failed'];
const terminal = ['done', 'abandoned'];

/** @param {Input} input @param {string} key */
function text(input, key) {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} must be a nonempty string`);
  return value;
}

/** @param {Input} input @param {string} key */
function optional(input, key) {
  return input[key] === undefined ? '' : text(input, key);
}

/** @param {Input} input */
function attempt(input) {
  if (!Number.isSafeInteger(input.attempt) || Number(input.attempt) < 1) throw new Error('attempt must be a positive integer');
  return Number(input.attempt);
}

/** @param {State} state @param {Input} input */
function unit(state, input) {
  const found = state.units.find(row => row.id === text(input, 'id'));
  if (!found) throw new Error('unit not found');
  return found;
}

/** @param {Unit} row @param {Input} input */
function current(row, input) {
  if (row.attempt !== attempt(input)) throw new Error('stale worker attempt');
}

/** @param {State} state @param {Unit} row */
function ready(state, row) {
  return row.depends.every(id => state.units.find(item => item.id === id)?.state === 'done');
}

/** @param {State} state */
function summary(state) {
  const counts = /** @type {Record<string, number>} */ ({});
  for (const row of state.units) counts[row.state] = (counts[row.state] ?? 0) + 1;
  return { counts, ready: state.units.filter(row => row.state === 'pending' && ready(state, row)).map(row => row.id), openGates: state.gates.filter(row => row.answer === undefined), units: state.units, ledger: state.ledger, inbox: state.inbox, processed: state.processed, standing: state.standing };
}

/** @param {string} path @param {string} contents */
async function atomicWrite(path, contents) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

/** @param {string} directory */
async function lock(directory) {
  const path = join(directory, '.orch.lock');
  const token = `${process.pid}:${randomUUID()}`;
  try {
    const handle = await open(path, 'wx');
    try { await handle.writeFile(token); } finally { await handle.close(); }
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'EEXIST') throw error;
    throw new Error(`store is locked: ${path}; never steal a live writer's lock`);
  }
  return async () => {
    if (await readFile(path, 'utf8') === token) await unlink(path);
  };
}

/** @param {string} directory @param {string} action @param {Input} [input] */
export async function command(directory, action, input = {}) {
  const root = resolve(directory);
  if (action === 'recover') {
    const recovery = join(root, '.orch.recovery');
    const handle = await open(recovery, 'wx');
    try {
      const path = join(root, '.orch.lock');
      const token = await readFile(path, 'utf8');
      const pid = Number(token.split(':')[0]);
      if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('invalid lock owner');
      try { process.kill(pid, 0); throw new Error('lock owner is still alive'); }
      catch (error) { if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ESRCH') throw error; }
      if (await readFile(path, 'utf8') !== token) throw new Error('lock changed during recovery');
      await unlink(path);
      return { recovered: true };
    } finally { await handle.close(); await unlink(recovery); }
  }
  if (action === 'init') await mkdir(root, { recursive: true });
  const release = await lock(root);
  try {
    const path = join(root, 'state.json');
    /** @type {State} */
    let state;
    try {
      state = /** @type {State} */ (JSON.parse(await readFile(path, 'utf8')));
      if (state.version !== 1 || !['units', 'ledger', 'inbox', 'processed', 'gates', 'standing'].every(key => Array.isArray(/** @type {Record<string, unknown>} */ (/** @type {unknown} */ (state))[key]))) throw new Error('invalid store');
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT' || action !== 'init') throw error;
      state = /** @type {State} */ ({ version: 1, units: [], ledger: [], inbox: [], processed: [], gates: [], standing: [] });
    }
    const result = apply(state, action, input);
    if (!['status', 'unit list', 'ledger check', 'inbox drain', 'standing show', 'gate list'].includes(action)) await atomicWrite(path, `${JSON.stringify(state, null, 2)}\n`);
    if (action === 'status') await atomicWrite(join(root, 'status.md'), `# Orchestrate status\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`);
    return result;
  } finally { await release(); }
}

/** @param {State} state @param {string} action @param {Input} input @returns {unknown} */
function apply(state, action, input) {
  switch (action) {
    case 'init': return { initialized: true };
    case 'status': return summary(state);
    case 'unit list': return state.units;
    case 'unit add': {
      const id = text(input, 'id');
      if (state.units.some(row => row.id === id)) throw new Error('duplicate unit');
      const depends = input.depends ?? [];
      if (!Array.isArray(depends) || depends.some(value => typeof value !== 'string' || !state.units.some(row => row.id === value)) || new Set(depends).size !== depends.length) throw new Error('dependencies must be distinct existing units; add in dependency order');
      const row = { id, track: text(input, 'track'), source: text(input, 'source'), brief: text(input, 'brief'), depends, state: 'pending', attempt: 0, worker: '', branch: '', sha: '', integratedSha: '', stops: [] };
      state.units.push(row);
      return row;
    }
    case 'unit start': {
      const row = unit(state, input);
      if (!['pending', 'failed', 'blocked'].includes(row.state) || !ready(state, row)) throw new Error('unit is not ready');
      row.worker = text(input, 'worker');
      row.branch = optional(input, 'branch');
      row.attempt++;
      row.state = 'running';
      row.sha = '';
      row.integratedSha = '';
      return row;
    }
    case 'unit result': {
      const row = unit(state, input);
      current(row, input);
      if (row.state !== 'running') throw new Error('unit is not running');
      row.sha = text(input, 'sha');
      row.state = 'needs-verification';
      return row;
    }
    case 'unit revise': {
      const row = unit(state, input);
      current(row, input);
      if (!['needs-verification', 'verified'].includes(row.state)) throw new Error('cannot revise active or integrated work; create a follow-up unit');
      row.sha = text(input, 'sha');
      row.state = 'needs-verification';
      return row;
    }
    case 'unit stop': {
      const row = unit(state, input);
      current(row, input);
      const next = text(input, 'state');
      if (!['failed', 'blocked', 'abandoned'].includes(next) || terminal.includes(row.state) || row.state === 'integrated') throw new Error('invalid stop state');
      const evidence = text(input, 'evidence');
      if (input.writerStopped !== true) throw new Error('confirm writerStopped only after stopping or fencing the writer');
      row.state = next;
      row.stops.push({ attempt: row.attempt, state: next, evidence });
      return row;
    }
    case 'ledger record': {
      const row = unit(state, input);
      current(row, input);
      const sha = text(input, 'sha');
      if (sha !== (row.state === 'integrated' || row.state === 'done' ? row.integratedSha : row.sha) || !['needs-verification', 'verified', 'integrated', 'done'].includes(row.state)) throw new Error('verdict does not match the current code state');
      const verdict = text(input, 'verdict');
      if (!verdicts.includes(verdict)) throw new Error('invalid verdict');
      const receipt = { unit: row.id, attempt: row.attempt, sha, verdict, evidence: text(input, 'evidence'), verifier: text(input, 'verifier') };
      state.ledger.push(receipt);
      if (!['integrated', 'done'].includes(row.state)) row.state = ['live-verified', 'unit-test-verified'].includes(verdict) ? 'verified' : 'needs-verification';
      if (row.state === 'done' && !['live-verified', 'unit-test-verified'].includes(verdict)) row.state = 'integrated';
      return receipt;
    }
    case 'ledger check': {
      const row = unit(state, input);
      const sha = text(input, 'sha');
      if (sha !== (row.state === 'integrated' || row.state === 'done' ? row.integratedSha : row.sha)) throw new Error('NOT-VERIFIED');
      const receipt = state.ledger.findLast(item => item.unit === row.id && item.attempt === row.attempt && item.sha === sha);
      if (!receipt) throw new Error('NOT-VERIFIED');
      return receipt;
    }
    case 'unit integrate': {
      const row = unit(state, input);
      current(row, input);
      if (row.state !== 'verified') throw new Error('unit is not verified');
      row.integratedSha = text(input, 'sha');
      row.state = 'integrated';
      return row;
    }
    case 'unit done': {
      const row = unit(state, input);
      current(row, input);
      const receipt = state.ledger.findLast(item => item.unit === row.id && item.attempt === row.attempt && item.sha === row.integratedSha);
      if (row.state !== 'integrated' || !receipt || !['live-verified', 'unit-test-verified'].includes(receipt.verdict)) throw new Error('integrated acceptance checks have not passed');
      row.state = 'done';
      return row;
    }
    case 'inbox push': {
      const pointer = { id: randomUUID(), unit: text(input, 'unit'), attempt: attempt(input), status: text(input, 'status'), report: text(input, 'report') };
      if (!state.units.some(row => row.id === pointer.unit)) throw new Error('unit not found');
      state.inbox.push(pointer);
      return pointer;
    }
    case 'inbox drain': return state.inbox;
    case 'inbox ack': {
      const id = text(input, 'id');
      const old = state.processed.find(row => row.id === id);
      if (old) return old;
      const index = state.inbox.findIndex(row => row.id === id);
      if (index < 0) throw new Error('pointer not found');
      const pointer = { ...state.inbox[index], disposition: text(input, 'disposition') };
      state.processed.push(pointer);
      state.inbox.splice(index, 1);
      return pointer;
    }
    case 'standing show': return state.standing;
    case 'standing add': {
      const line = text(input, 'line');
      if (!state.standing.includes(line)) state.standing.push(line);
      return state.standing;
    }
    case 'gate park': {
      const id = text(input, 'id');
      const gate = { id, question: text(input, 'question'), options: text(input, 'options'), default: text(input, 'default') };
      state.gates = [...state.gates.filter(row => row.id !== id), gate];
      return gate;
    }
    case 'gate list': return state.gates.filter(row => row.answer === undefined);
    case 'gate resolve': {
      const gate = state.gates.find(row => row.id === text(input, 'id'));
      if (!gate) throw new Error('gate not found');
      gate.answer = text(input, 'answer');
      return gate;
    }
    default: throw new Error(`unknown command: ${action}`);
  }
}
