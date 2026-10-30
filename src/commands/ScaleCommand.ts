import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class ScaleCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(2); const shape = editor.document.find(this.arg(0));
    const factor = this.number(1, 'scale factor'); shape.scale(factor);
    return [`${shape.label} scaled by ${factor}`];
  }
}
