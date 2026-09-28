import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const source = fileURLToPath(new URL('../', import.meta.url));

export function install(destination) {
  const links = [];
  for (const kind of ['skills', 'agents']) {
    for (const entry of readdirSync(join(source, kind))) {
      const origin = join(source, kind, entry);
      if (kind === 'skills' ? !existsSync(join(origin, 'SKILL.md')) : !entry.endsWith('.md')) continue;
      const target = join(resolve(destination), kind, entry);
      try {
        lstatSync(target);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        links.push({ origin, target, kind });
        continue;
      }
      if (!existsSync(target) || realpathSync(target) !== origin) {
        throw new Error(`Installation conflict: ${target}. Preserve it and choose a different scope or resolve the conflict explicitly.`);
      }
    }
  }
  for (const { origin, target, kind } of links) {
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(relative(dirname(target), origin), target, kind === 'skills' ? 'dir' : 'file');
  }
  return links.map(({ target }) => target);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { project: { type: 'string' }, global: { type: 'boolean' } } });
    if (Boolean(values.project) === Boolean(values.global)) throw new Error('Usage: node scripts/install.mjs --project PATH | --global');
    const destination = values.global
      ? join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'opencode')
      : join(resolve(values.project), '.opencode');
    const installed = install(destination);
    console.log(`${installed.length} links created in ${destination}. Keep the source checkout at ${source}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
