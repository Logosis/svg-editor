import type { Editor } from '../application/Editor.js';
import { EditCommand } from './EditCommand.js';
export class UngroupCommand extends EditCommand {
  constructor(args: readonly string[]) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(1); editor.document.ungroup(this.arg(0)); return [`g#${this.arg(0)} ungrouped`];
  }
}
