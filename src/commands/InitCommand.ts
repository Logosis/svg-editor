import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
import type { CommandHistory } from './CommandHistory.js';
export class InitCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  override execute(editor: Editor, history: CommandHistory): string[] {
    this.count(0, 2); const result = editor.init(this.args.length > 0 ? this.number(0, 'width') : 800, this.args.length > 1 ? this.number(1, 'height') : 600);
    history.barrier(); return result;
  }
}
