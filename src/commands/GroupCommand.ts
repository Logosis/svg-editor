import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class GroupCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(2, Infinity); const group = editor.document.group(this.arg(0), this.args.slice(1));
    return [`${group.label} created with ${group.children.length} children`];
  }
}
