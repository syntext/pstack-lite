import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent, Skill } from '@opencode/plugin';
import { parse } from 'yaml';

/** @param {string} path */
async function markdown(path) {
  const text = await readFile(path, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`Missing frontmatter: ${path}`);
  return { data: parse(match[1]), content: match[2].trim() };
}

export async function loadBundle() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  /** @type {Skill.Info[]} */
  const skills = [];
  for (const entry of await readdir(join(root, 'skills'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(root, 'skills', entry.name, 'SKILL.md');
    let document;
    try {
      document = await markdown(path);
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') continue;
      throw error;
    }
    const { data, content } = document;
    skills.push({
      id: Skill.ID.make(entry.name),
      name: Skill.Name.make(data.name ?? entry.name),
      description: data.description,
      autoinvoke: data.metadata?.['opencode/autoinvoke'] ?? true,
      path: /** @type {Skill.Info['path']} */ (path),
      content,
    });
  }
  const agents = [];
  for (const filename of await readdir(join(root, 'agents'))) {
    if (!filename.endsWith('.md')) continue;
    const { data, content } = await markdown(join(root, 'agents', filename));
    agents.push({
      id: Agent.ID.make(basename(filename, '.md')),
      description: /** @type {string} */ (data.description),
      mode: /** @type {Agent.Info['mode']} */ (data.mode),
      system: content,
      permissions: /** @type {Agent.Info['permissions']} */ (data.permissions ?? []),
    });
  }
  return { skills, agents };
}
