import { Plugin } from '@opencode/plugin';
import { loadBundle } from './bundle.mjs';

export default Plugin.define({
  id: 'pstack',
  async setup(ctx) {
    const { skills, agents } = await loadBundle();
    await ctx.skill.transform(editor => {
      for (const skill of skills) editor.add(skill);
    });
    await ctx.agent.transform(editor => {
      for (const definition of agents) {
        // OpenCode 2.0.18's update creates missing agents with native defaults.
        editor.update(definition.id, agent => {
          agent.description ??= definition.description;
          agent.system ??= definition.system;
          agent.mode = definition.mode;
          agent.permissions.push(...structuredClone(definition.permissions));
        });
      }
    });
    await ctx.session.hook('context', ({ tools }) => {
      const subagent = tools.subagent;
      const properties = /** @type {Record<string, import('effect').JsonSchema.JsonSchema> | undefined} */ (subagent?.input.properties);
      const model = properties?.model;
      if (!subagent || !model) return;
      subagent.input = {
        ...subagent.input,
        properties: {
          ...properties,
          model: {
            ...model,
            description: 'Always set model on every subagent call. Pass the exact resolved provider/model reference, including #variant when selected. Explicit selection preserves the intended model, reasoning budget, cost, and review diversity. For pstack workflows, use the resolved role unless the user selected a model for this task. For parent inheritance, pass the actual parent model and variant. When resuming a child, pass that child\'s current model and variant. Never rely on omission or pass inheritance aliases as model IDs. If the reference is unknown, inspect the session before dispatch; do not guess.',
          },
        },
      };
    });
  },
});
