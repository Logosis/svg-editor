import type { Editor } from '../application/Editor.js';
import type { SvgDocument } from '../model/SvgDocument.js';
import { Command } from './Command.js';
import type { CommandHistory } from './CommandHistory.js';

export abstract class EditCommand extends Command {
  private before?: SvgDocument;
  private after?: SvgDocument;
  private feedback: string[] = [];
  protected abstract apply(editor: Editor): string[];

  override execute(editor: Editor, history: CommandHistory): string[] {
    const before = editor.snapshot();
    try {
      const feedback = this.apply(editor);
      const after = editor.snapshot();
      this.before = before;
      this.after = after;
      this.feedback = feedback;
    } catch (error) {
      editor.restore(before);
      throw error;
    }
    history.record(this);
    return this.feedback;
  }
  undo(editor: Editor): string[] {
    if (!this.before) throw new Error('command has not executed');
    editor.restore(this.before);
    return [`undone: ${this.feedback.join('; ')}`];
  }
  redo(editor: Editor): string[] {
    if (!this.after) throw new Error('command has not executed');
    editor.restore(this.after);
    return [`redone: ${this.feedback.join('; ')}`];
  }
}
