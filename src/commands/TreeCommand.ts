import type { Editor } from '../application/Editor.js';
import type { Shape } from '../model/Shape.js';
import { Command } from './Command.js';
export class TreeCommand extends Command {
  constructor(args: readonly string[]) { super(args); }
  private render(shape: Shape, prefix: string, last: boolean): string[] {
    return [`${prefix}${last ? '└── ' : '├── '}${shape.summary()}`,
      ...shape.children.flatMap((child, index, all) => this.render(child, `${prefix}${last ? '    ' : '│   '}`, index === all.length - 1))];
  }
  override execute(editor: Editor): string[] {
    this.count(0, 1);
    const document = editor.document;
    if (this.args.length) {
      const shape = document.find(this.arg(0));
      return [shape.summary(), ...shape.children.flatMap((child, index, all) => this.render(child, '', index === all.length - 1))];
    }
    return [`svg (${document.width}x${document.height})`, ...document.children.flatMap((child, index, all) => this.render(child, '', index === all.length - 1))];
  }
}
