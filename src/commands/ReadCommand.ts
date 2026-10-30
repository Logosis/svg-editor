import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
import type { CommandHistory } from './CommandHistory.js';
export class ReadCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  override execute(editor: Editor, history: CommandHistory): string[] {
    this.count(1); const result = editor.read(this.arg(0)); history.barrier(); return result;
  }
}
