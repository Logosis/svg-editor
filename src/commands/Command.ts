import type { Editor } from '../application/Editor.js';
import { Validation } from '../model/Validation.js';
import type { CommandHistory } from './CommandHistory.js';

export abstract class Command {
  protected constructor(protected readonly args: readonly string[]) {}
  abstract execute(editor: Editor, history: CommandHistory): string[];
  protected count(min: number, max = min): void {
    if (this.args.length < min || this.args.length > max) throw new Error('invalid command arguments. use help for syntax');
  }
  protected arg(index: number): string {
    const arg = this.args[index];
    if (arg === undefined) throw new Error('missing argument. use help for syntax');
    return arg;
  }
  protected number(index: number, name = 'number'): number { return Validation.number(this.arg(index), name); }
}
