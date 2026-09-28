import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const defaults = JSON.parse(readFileSync(new URL('../references/default-models.json', import.meta.url), 'utf8'));
const reference = /^openai\/gpt-6-(astra|sol|luna)(?:#(none|low|medium|high|xhigh|max))?$/;

export function validate(config) {
  if (!config || config.version !== 1 || !config.roles || Array.isArray(config.roles) || typeof config.roles !== 'object') {
    throw new Error('Expected {"version":1,"roles":{...}}');
  }
  for (const key of Object.keys(config)) {
    if (!['version', 'roles'].includes(key)) throw new Error(`Unknown configuration key: ${key}`);
  }
  for (const [role, value] of Object.entries(config.roles)) {
    if (!Object.hasOwn(defaults.roles, role)) throw new Error(`Unknown role: ${role}`);
    if (Array.isArray(defaults.roles[role]) !== Array.isArray(value)) throw new Error(`Wrong selection shape for ${role}`);
    const selections = Array.isArray(value) ? value : [value];
    if (!selections.length) throw new Error(`Empty panel: ${role}`);
    for (const selection of selections) {
      if (typeof selection !== 'string' || (!['inherit-parent', 'auto'].includes(selection) && !reference.test(selection))) {
        throw new Error(`Invalid model reference for ${role}: ${JSON.stringify(selection)}`);
      }
      if (selection === 'openai/gpt-6-astra#none') throw new Error('Astra does not advertise the none variant');
    }
  }
  return config;
}

export function locations(directory = process.cwd(), configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')) {
  let root = resolve(directory);
  try {
    root = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    for (let current = root; ; current = dirname(current)) {
      if (existsSync(join(current, '.opencode'))) { root = current; break; }
      if (dirname(current) === current) break;
    }
  }
  return {
    global: join(resolve(configHome), 'opencode', 'pstack-models.json'),
    project: join(root, '.opencode', 'pstack-models.json'),
  };
}

function readConfig(path) {
  try {
    return validate(JSON.parse(readFileSync(path, 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, roles: {} };
    throw new Error(`${path}: ${error.message}`);
  }
}

export function resolveModels(directory, configHome) {
  const paths = locations(directory, configHome);
  const global = readConfig(paths.global);
  const project = readConfig(paths.project);
  return { version: 1, paths, roles: { ...defaults.roles, ...global.roles, ...project.roles } };
}

export function updateModels(path, updates) {
  validate(updates);
  const current = readConfig(path);
  const result = validate({ version: 1, roles: { ...current.roles, ...updates.roles } });
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
  return result;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({ options: {
      directory: { type: 'string', default: process.cwd() },
      scope: { type: 'string' }, input: { type: 'string' }, role: { type: 'string' },
    }, allowPositionals: true });
    const command = positionals[0] || 'read';
    if (positionals.length > 1) throw new Error('Expected one command: read or write');
    if (command === 'read') {
      const result = resolveModels(values.directory);
      if (values.role && !Object.hasOwn(result.roles, values.role)) throw new Error(`Unknown role: ${values.role}`);
      console.log(JSON.stringify(values.role ? result.roles[values.role] : result, null, 2));
    } else if (command === 'write' && ['project', 'global'].includes(values.scope) && values.input) {
      const path = locations(values.directory)[values.scope];
      updateModels(path, JSON.parse(readFileSync(resolve(values.input), 'utf8')));
      console.log(path);
    } else {
      throw new Error('Usage: models.mjs read [--directory PATH] [--role NAME] | write --scope project|global --input JSON [--directory PATH]');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
