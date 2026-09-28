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
  },
});
