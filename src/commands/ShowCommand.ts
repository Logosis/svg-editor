import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class ShowCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  override execute(editor: Editor): string[] {
    this.count(1); const shape = editor.document.find(this.arg(0));
    const attrs = Object.entries(shape.attributes()).filter(([key]) => key !== 'id').map(([key, value]) => `  ${key}=${JSON.stringify(value)}`);
    return [`${shape.label}  parent=${editor.document.parentLabel(shape)}`, ...attrs,
      ...(shape.text !== undefined ? [`  text=${JSON.stringify(shape.text)}`] : [])];
  }
}
