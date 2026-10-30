import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
import type { CommandHistory } from './CommandHistory.js';
export class SaveCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  override execute(editor: Editor, history: CommandHistory): string[] {
    this.count(0, 1); const result = editor.save(this.args[0]); history.barrier(); return result;
  }
}
