import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { command } from './store.mjs';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { store: { type: 'string' }, input: { type: 'string' }, 'input-file': { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help) {
    console.log('node orch.mjs --store <directory> <command> [--input <JSON> | --input-file <file>]\nCommands: init, recover, status, unit add/list/start/result/revise/stop/integrate/done, ledger record/check, inbox push/drain/ack, standing add/show, gate park/list/resolve\nOutput is JSON. inbox drain is read-only; acknowledge after recording effects. recover requires a dead lock owner.');
  } else {
    const directory = values.store ?? process.env.ORCH_STORE;
    if (!directory) throw new Error('set --store <directory> or ORCH_STORE');
    if (values.input && values['input-file']) throw new Error('choose input or input-file');
    const input = JSON.parse(values['input-file'] ? await readFile(values['input-file'], 'utf8') : values.input ?? '{}');
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('input must be a JSON object');
    console.log(JSON.stringify(await command(directory, positionals.join(' '), input), null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
