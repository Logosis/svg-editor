import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
import type { CommandHistory } from './CommandHistory.js';
export class CanvasCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  override execute(editor: Editor, history: CommandHistory): string[] {
    this.count(0, 2);
    if (this.args.length > 0) { this.count(2); editor.document.resize(this.number(0, 'width'), this.number(1, 'height')); history.barrier(); }
    return [`canvas ${editor.document.width}x${editor.document.height}`];
  }
}
