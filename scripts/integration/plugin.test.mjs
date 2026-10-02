import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { loadBundle } from '../../plugin/bundle.mjs';
import { Host } from '@opencode/plugin/host';

const exec = promisify(execFile);
const source = fileURLToPath(new URL('../../', import.meta.url));

async function json(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function eventually(read, accept) {
  const deadline = Date.now() + 30_000;
  let value;
  do {
    value = await read();
    if (accept(value)) return value;
    await delay(100);
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for OpenCode: ${JSON.stringify(Array.isArray(value) ? value.map(item => item.id) : value)}`);
}

async function server(t, root, project) {
  const env = { PATH: process.env.PATH, TMPDIR: root, NO_COLOR: '1' };
  for (const [key, name] of Object.entries({ HOME: 'home', XDG_CONFIG_HOME: 'config', XDG_DATA_HOME: 'data', XDG_STATE_HOME: 'state', XDG_CACHE_HOME: 'cache' })) {
    env[key] = join(root, name);
    await mkdir(env[key], { recursive: true });
  }
  const child = spawn('opencode', ['serve', '--hostname', '127.0.0.1', '--port', '0'], { cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  t.after(async () => {
    if (child.exitCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    const kill = setTimeout(() => child.kill('SIGKILL'), 5_000);
    try { await exited; } finally { clearTimeout(kill); }
  });
  await eventually(() => {
    if (child.exitCode !== null) throw new Error(output);
    return /server listening on (http:\/\/\S+)/.test(output) && /server password (\S+)/.test(output);
  }, Boolean);
  const url = /server listening on (http:\/\/\S+)/.exec(output)[1];
  env.OPENCODE_PASSWORD = /server password (\S+)/.exec(output)[1];
  return {
    env,
    async api(method, path, body) {
      const args = ['api', '--server', url, method, path];
      if (body !== undefined) args.push('--data', JSON.stringify(body));
      const { stdout } = await exec('opencode', args, { cwd: project, env, timeout: 30_000, maxBuffer: 4 * 1024 * 1024 });
      return stdout.trim() ? JSON.parse(stdout) : undefined;
    },
  };
}

test('packed native plugin loads globally and per project without discovery links', { timeout: 180_000 }, async t => {
  const root = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'pstack-plugin-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const requests = [];
  const provider = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const input = JSON.parse(body);
    requests.push(input);
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    for (const [delta, finish_reason] of [
      [{ role: 'assistant', content: 'Fixture response.' }, null],
      [{}, 'stop'],
    ]) {
      response.write(`data: ${JSON.stringify({
        id: 'fixture-completion', object: 'chat.completion.chunk', created: 0, model: 'fixture-model',
        choices: [{ index: 0, delta, finish_reason }],
      })}\n\n`);
    }
    response.end('data: [DONE]\n\n');
  });
  provider.listen(0, '127.0.0.1');
  await once(provider, 'listening');
  t.after(() => new Promise(resolve => provider.close(resolve)));
  const baseURL = `http://127.0.0.1:${provider.address().port}/v1`;
  const packed = JSON.parse((await exec('npm', ['pack', '--json', '--pack-destination', root], { cwd: source })).stdout)[0];
  const files = new Set(packed.files.map(file => file.path));
  for (const path of ['index.js', 'plugin/index.mjs', 'agents/comment-sicko.md', 'skills/setup-pstack/scripts/models.mjs', 'skills/poteto-mode/scripts/worktree-audit.sh', 'skills/show-me-your-work/scripts/log.sh', 'skills/poteto-mode/playbooks/opening-a-pr.md', 'LICENSE']) {
    assert.ok(files.has(path), `Missing package file: ${path}`);
  }
  assert.ok([...files].every(path => !path.includes('node_modules/') && !path.startsWith('.opencode/')));
  assert.equal([...files].filter(path => /^skills\/poteto-mode\/playbooks\/[^/]+\.md$/.test(path)).length, 18);
  for (const path of ['playbooks/orchestrate.md', 'playbooks/autonomous-run.md', 'scripts/orch/orch.mjs', 'scripts/orch/store.mjs']) {
    assert.ok(files.has(`skills/poteto-mode/${path}`), `Missing execution asset: ${path}`);
  }
  for (const path of ['playbooks/babysit.md', 'playbooks/shipping.md', 'references/bugbot-triage.md', 'scripts/bootstrap.ts', 'scripts/package.json', 'scripts/bun.lock']) {
    assert.ok(!files.has(`skills/poteto-mode/${path}`), `Retired asset in package: ${path}`);
  }
  assert.ok([...files].every(path => !path.startsWith('skills/poteto-mode/scripts/watch-pr/')));
  const installed = join(root, 'installed');
  await exec('npm', ['install', '--prefix', installed, '--ignore-scripts', '--no-audit', '--no-fund', join(root, packed.filename)], { timeout: 90_000, maxBuffer: 1024 * 1024 });
  const packageRoot = join(installed, 'node_modules/pstack-lite');
  const runStore = join(root, 'execution-run');
  const orch = join(packageRoot, 'skills/poteto-mode/scripts/orch/orch.mjs');
  await exec(process.execPath, [orch, '--store', runStore, 'init'], { cwd: installed });
  const stored = JSON.parse((await exec(process.execPath, [orch, '--store', runStore, 'status'], { cwd: installed })).stdout);
  assert.deepEqual(stored.units, []);
  const operation = async (action, input) => JSON.parse((await exec(process.execPath, [orch, '--store', runStore, ...action.split(' '), '--input', JSON.stringify(input)], { cwd: installed })).stdout);
  await operation('unit add', { id: 'local', track: 'build', source: 'supplied acceptance criterion', brief: 'local-brief.md' });
  await operation('unit start', { id: 'local', worker: 'fixture-leaf' });
  await operation('unit result', { id: 'local', attempt: 1, sha: 'fixture-worker-revision' });
  const receipt = { id: 'local', attempt: 1, verdict: 'unit-test-verified', evidence: 'fixture-receipt', verifier: 'fixture-reviewer' };
  await operation('ledger record', { ...receipt, sha: 'fixture-worker-revision' });
  await operation('unit integrate', { id: 'local', attempt: 1, sha: 'fixture-integrated-revision' });
  await operation('ledger record', { ...receipt, sha: 'fixture-integrated-revision' });
  await operation('unit done', { id: 'local', attempt: 1 });
  assert.deepEqual((await operation('status', {})).counts, { done: 1 });
  assert.notEqual(packageRoot, source);
  assert.equal(fileURLToPath(Host.resolve({ directory: installed, name: 'pstack-lite' }).server), join(packageRoot, 'index.js'));
  const expected = await loadBundle();
  assert.equal(expected.skills.length, 44);
  assert.equal(expected.agents.length, 2);
  assert.equal(expected.skills.filter(skill => skill.autoinvoke === false).length, 43);

  for (const scope of ['global', 'project']) {
    await t.test(`${scope} plugin registration, overrides, reload, and removal`, async t => {
      const home = join(root, scope);
      const project = join(home, 'project');
      const nested = join(project, 'src/nested');
      await mkdir(nested, { recursive: true });
      await exec('git', ['init', '-q', project]);
      const config = scope === 'global' ? join(home, 'config/opencode/opencode.json') : join(project, '.opencode/opencode.json');
      const entry = scope === 'global' ? packageRoot : relative(dirname(config), packageRoot);
      const settings = {
        plugins: [entry],
        permissions: [{ action: 'shell', resource: '*', effect: 'deny' }],
        providers: {
          'pstack-test': {
            package: '@opencode/ai/providers/openai-compatible',
            settings: { baseURL, apiKey: 'fixture-key' },
            models: {
              'team/Coder:latest': { modelID: 'fixture-model', variants: [{ id: 'careful-pass', settings: { temperature: 0 } }] },
            },
          },
        },
      };
      await json(config, settings);
      const runtime = await server(t, home, project);
      const list = async (kind, directory = nested) => (await runtime.api('get', `/api/${kind}?location[directory]=${encodeURIComponent(directory)}`)).data;
      const advertisedSubagent = async () => {
        const start = requests.length;
        const session = (await runtime.api('post', '/api/session', {
          title: 'Tool guidance fixture',
          location: { directory: nested },
          model: { providerID: 'pstack-test', id: 'team/Coder:latest' },
        })).data;
        await runtime.api('post', `/api/session/${session.id}/prompt`, { text: 'Inspect the advertised tools.' });
        const tool = await eventually(() => requests.slice(start).flatMap(request => request.tools ?? [])
          .find(tool => tool.function?.name === 'subagent'), Boolean);
        await runtime.api('post', `/api/experimental/session/${session.id}/wait`);
        return { description: tool.function.description, input: tool.function.parameters };
      };
      const skills = await eventually(async () => {
        const all = await list('skill');
        const plugin = (await list('plugin')).find(item => item.id === 'pstack');
        if (plugin?.state.status === 'failed') throw new Error(JSON.stringify(plugin));
        return all;
      }, all => expected.skills.every(skill => all.some(item => item.id === skill.id))).catch(async error => {
        t.diagnostic(JSON.stringify((await list('plugin')).filter(plugin => plugin.source.type !== 'builtin')));
        const log = await readFile(join(home, 'data/opencode/log/opencode.log'), 'utf8');
        t.diagnostic(log.split('\n').filter(line => line.includes('level=WARN') || line.includes('loading plugin')).join('\n'));
        throw error;
      });
      const plugins = await list('plugin');
      assert.equal(plugins.filter(plugin => plugin.id === 'pstack').length, 1);
      const agents = await list('agent');
      for (const skill of expected.skills) {
        const matches = skills.filter(item => item.id === skill.id);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].path, join(packageRoot, relative(source, skill.path)));
        assert.equal(matches[0].content, skill.content);
        assert.equal(matches[0].autoinvoke, skill.autoinvoke);
      }
      for (const definition of expected.agents) {
        const agent = agents.find(item => item.id === definition.id);
        assert.ok(agent);
        assert.equal(agent.system, definition.system);
        assert.equal(agent.mode, 'subagent');
        assert.equal(agent.model, undefined);
      }
      const sicko = agents.find(agent => agent.id === 'comment-sicko');
      const worker = agents.find(agent => agent.id === 'poteto-agent');
      assert.equal(worker.permissions.filter(rule => ['*', 'shell'].includes(rule.action) && rule.resource === '*').at(-1).effect, 'deny');
      for (const action of ['edit', 'shell', 'subagent']) {
        assert.equal(sicko.permissions.filter(rule => ['*', action].includes(rule.action) && rule.resource === '*').at(-1).effect, 'deny');
      }
      assert.equal(sicko.permissions.filter(rule => ['*', 'read'].includes(rule.action) && rule.resource === '*').at(-1).effect, 'allow');
      const guidedTool = await advertisedSubagent();
      assert.match(guidedTool.input.properties.model.description, /^Always set model on every subagent call\./);
      assert.doesNotMatch(guidedTool.input.properties.model.description, /NEVER set this/);

      const helper = join(packageRoot, 'skills/setup-pstack/scripts/models.mjs');
      const input = join(home, 'confirmed.json');
      const catalog = await list('model');
      const model = catalog.find(model => model.providerID === 'pstack-test' && model.id === 'team/Coder:latest');
      assert.ok(model?.enabled);
      assert.equal(model.modelID, 'fixture-model');
      assert.ok(model.variants.some(variant => variant.id === 'careful-pass'));
      const selection = `${model.providerID}/${model.id}#careful-pass`;
      await json(input, { version: 1, roles: { 'how explorer': selection } });
      await exec(process.execPath, [helper, 'write', '--scope', 'project', '--input', input], { cwd: nested, env: runtime.env });
      const effective = JSON.parse((await exec(process.execPath, [helper, 'read'], { cwd: nested, env: runtime.env })).stdout);
      assert.equal(effective.roles['how explorer'], 'pstack-test/team/Coder:latest#careful-pass');
      assert.deepEqual((await readdir(join(project, '.opencode'))).sort(), scope === 'global' ? ['pstack-models.json'] : ['opencode.json', 'pstack-models.json']);
      await access(join(packageRoot, 'skills/poteto-mode/scripts/worktree-audit.sh'), constants.X_OK);
      await access(join(packageRoot, 'skills/show-me-your-work/scripts/log.sh'), constants.X_OK);
      await access(join(packageRoot, 'skills/interrogate/references/reviewer-prompt.md'));

      await runtime.api('post', '/api/location/reload');
      const reloaded = await eventually(() => list('skill'), all => all.some(skill => skill.id === 'setup-pstack'));
      assert.equal(reloaded.length, skills.length);
      assert.equal((await list('agent')).find(agent => agent.id === 'comment-sicko').permissions.length, sicko.permissions.length);
      assert.deepEqual(await advertisedSubagent(), guidedTool);

      if (scope === 'global') {
        const localConfig = join(project, '.opencode/opencode.json');
        await json(localConfig, { plugins: [entry] });
        await runtime.api('post', '/api/location/reload');
        await eventually(() => list('skill'), all => all.some(skill => skill.id === 'setup-pstack'));
        assert.equal((await list('plugin')).filter(plugin => plugin.id === 'pstack').length, 1);
        assert.equal((await list('agent')).filter(agent => agent.id === 'comment-sicko').length, 1);
        await rm(localConfig);
      }

      settings.agents = { 'poteto-agent': { model: effective.roles['how explorer'], description: 'User description' } };
      await json(config, settings);
      await runtime.api('post', '/api/location/reload');
      const customized = await eventually(() => list('agent'), all => all.some(agent => agent.id === 'poteto-agent' && agent.model));
      assert.deepEqual(customized.find(agent => agent.id === 'poteto-agent').model, { providerID: 'pstack-test', id: 'team/Coder:latest', variant: 'careful-pass' });
      assert.equal(customized.find(agent => agent.id === 'poteto-agent').description, 'User description');

      delete settings.agents;
      settings.plugins = [entry, '-pstack'];
      await json(config, settings);
      await runtime.api('post', '/api/location/reload');
      const originalTool = await advertisedSubagent();
      assert.doesNotMatch(originalTool.input.properties.model.description, /Always set model on every subagent call/);
      assert.deepEqual({
        ...guidedTool.input,
        properties: { ...guidedTool.input.properties, model: originalTool.input.properties.model },
      }, originalTool.input);
      settings.providers['pstack-test'].models['team/Coder:latest'].disabled = true;
      await json(config, settings);
      await runtime.api('post', '/api/location/reload');
      const disabled = await list('skill');
      assert.ok(expected.skills.every(skill => !disabled.some(item => item.id === skill.id)));
      assert.ok((await list('agent')).every(agent => !expected.agents.some(item => item.id === agent.id)));
      assert.ok((await list('model')).every(model => model.providerID !== 'pstack-test' || model.id !== 'team/Coder:latest'));
      const saved = JSON.parse((await exec(process.execPath, [helper, 'read'], { cwd: nested, env: runtime.env })).stdout);
      assert.equal(saved.roles['how explorer'], 'pstack-test/team/Coder:latest#careful-pass');
    });
  }
});
