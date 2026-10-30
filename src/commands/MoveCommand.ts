import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class MoveCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(3); const shape = editor.document.find(this.arg(0));
    const dx = this.number(1, 'dx'); const dy = this.number(2, 'dy');
    shape.move(dx, dy); return [`${shape.label} moved by (${dx},${dy})`];
  }
}
