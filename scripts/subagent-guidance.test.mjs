import assert from 'node:assert/strict';
import { test } from 'node:test';
import plugin from '../plugin/index.mjs';

async function contextHook() {
  let hook;
  await plugin.setup({
    skill: { transform: async () => {} },
    agent: { transform: async () => {} },
    session: { hook: async (name, callback) => {
      assert.equal(name, 'context');
      hook = callback;
    } },
  });
  return hook;
}

test('outgoing subagent guidance replaces the restrictive model description without changing validation', async () => {
  const hook = await contextHook();
  const input = {
    type: 'object',
    properties: {
      agent: { type: 'string', description: 'Worker agent' },
      model: { type: 'string', description: 'NEVER set this unless the user explicitly asks for a particular model or variant.' },
      sessionID: { type: 'string' },
    },
    required: ['agent'],
    additionalProperties: false,
  };
  const read = { description: 'Read files', input: { type: 'object' } };
  const tools = { subagent: { description: 'Spawn a worker', input }, read };
  hook({ tools });

  assert.match(tools.subagent.input.properties.model.description, /^Always set model on every subagent call\./);
  assert.match(tools.subagent.input.properties.model.description, /parent inheritance, pass the actual parent model and variant/);
  assert.match(tools.subagent.input.properties.model.description, /resuming a child, pass that child's current model and variant/);
  assert.doesNotMatch(tools.subagent.input.properties.model.description, /unless the user explicitly asks/);
  assert.deepEqual({
    ...tools.subagent.input,
    properties: { ...tools.subagent.input.properties, model: input.properties.model },
  }, input);
  assert.equal(tools.subagent.description, 'Spawn a worker');
  assert.equal(tools.read, read);
  assert.equal(input.properties.model.description, 'NEVER set this unless the user explicitly asks for a particular model or variant.');

  const once = structuredClone(tools);
  hook({ tools });
  assert.deepEqual(tools, once);
});

test('requests without a subagent model field remain unchanged', async () => {
  const hook = await contextHook();
  for (const tools of [
    { read: { description: 'Read files', input: { type: 'object' } } },
    { subagent: { description: 'Custom worker', input: { type: 'object', properties: { agent: { type: 'string' } } } } },
  ]) {
    const before = structuredClone(tools);
    hook({ tools });
    assert.deepEqual(tools, before);
  }
});
