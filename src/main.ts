import { createInterface } from 'node:readline';
import { Editor } from './application/Editor.js';
import { CommandProcessor } from './cli/CommandProcessor.js';
import { NodeFileStore } from './infrastructure/NodeFileStore.js';
import { SvgCodec } from './infrastructure/SvgCodec.js';

const processor = new CommandProcessor(new Editor(new NodeFileStore(), new SvgCodec()));
const terminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const input = createInterface({ input: process.stdin, output: terminal ? process.stdout : undefined, terminal, crlfDelay: Infinity });
console.log("svg-editor 0.1 — type 'help' for commands");
input.setPrompt('svg> ');
if (terminal) input.prompt();
input.on('line', line => {
  const result = processor.process(line);
  for (const output of result.lines) {
    if (result.failed) console.error(output);
    else console.log(output);
  }
  if (result.failed && !terminal) process.exitCode = 1;
  if (terminal) input.prompt();
});
input.on('SIGINT', () => input.close());
