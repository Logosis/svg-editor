import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class SetCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(3); const shape = editor.document.find(this.arg(0));
    shape.set(this.arg(1), this.arg(2));
    return [`${shape.label} updated: ${this.arg(1)}=${JSON.stringify(this.arg(2))}`];
  }
}
