import type { Editor } from '../application/Editor.js';
import type { EditCommand } from './EditCommand.js';

export class CommandHistory {
  private readonly done: EditCommand[] = [];
  private readonly undone: EditCommand[] = [];
  private blocked = false;
  record(command: EditCommand): void { this.done.push(command); this.undone.length = 0; this.blocked = false; }
  barrier(): void { this.done.length = 0; this.undone.length = 0; this.blocked = true; }
  undo(editor: Editor): string[] {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.done.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo(editor);
    this.done.pop(); this.undone.push(command);
    return result;
  }
  redo(editor: Editor): string[] {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.undone.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo(editor);
    this.undone.pop(); this.done.push(command);
    return result;
  }
}
