import type { Editor } from '../application/Editor.js';
import { CommandHistory } from '../commands/CommandHistory.js';
import { CommandRegistry } from './CommandRegistry.js';
import { Tokenizer } from './Tokenizer.js';

export class CommandProcessor {
  private readonly history = new CommandHistory();
  constructor(private readonly editor: Editor, private readonly registry = new CommandRegistry(), private readonly tokenizer = new Tokenizer()) {}
  process(line: string): { lines: string[]; failed: boolean } {
    try {
      const tokens = this.tokenizer.tokenize(line);
      return { lines: tokens.length ? this.registry.create(tokens).execute(this.editor, this.history) : [], failed: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { lines: [`error: ${message.replace(/[\r\n\u2028\u2029]+/g, ' ')}`], failed: true };
    }
  }
}
