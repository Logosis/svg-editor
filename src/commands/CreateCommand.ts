import type { Editor } from '../application/Editor.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { EditCommand } from './EditCommand.js';

export class CreateCommand extends EditCommand {
  constructor(args: readonly string[], private readonly factory: ShapeFactory) { super(args); }
  protected override apply(editor: Editor): string[] {
    this.count(2, Infinity);
    const values = this.args.slice(2);
    let containerId: string | undefined;
    // Only a complete trailing pair is syntax; quoted text "in" remains ordinary content.
    if (values.length >= 2 && values.at(-2) === 'in') { containerId = values.at(-1)!; values.splice(-2); }
    const shape = this.factory.create(this.arg(0), this.arg(1), values);
    editor.document.add(shape, containerId);
    return [`${shape.label} created${containerId !== undefined ? ` in g#${containerId}` : ''}`];
  }
}
