import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
import type { CommandHistory } from './CommandHistory.js';
export class RedoCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  override execute(editor: Editor, history: CommandHistory): string[] {
    this.count(0); void editor.document; return history.redo(editor);
  }
}
