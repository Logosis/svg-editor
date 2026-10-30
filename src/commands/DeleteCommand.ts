import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class DeleteCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(1); const shape = editor.document.find(this.arg(0));
    editor.document.delete(shape.id); return [`${shape.label} deleted`];
  }
}
