import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class AddToCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(2); const shape = editor.document.find(this.arg(1));
    editor.document.addTo(this.arg(0), shape.id); return [`${shape.label} moved into g#${this.arg(0)}`];
  }
}
