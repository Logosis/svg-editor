import { ShapeFactory } from '../model/ShapeFactory.js';
import type { Command } from '../commands/Command.js';
import { InitCommand } from '../commands/InitCommand.js';
import { ReadCommand } from '../commands/ReadCommand.js';
import { SaveCommand } from '../commands/SaveCommand.js';
import { CanvasCommand } from '../commands/CanvasCommand.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { FrontCommand } from '../commands/FrontCommand.js';
import { BackCommand } from '../commands/BackCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';

export class CommandRegistry {
  private readonly entries = new Map<string, { syntax: string; build: (args: readonly string[]) => Command }>();
  constructor(factory = new ShapeFactory()) {
    this.register('init', 'init [w] [h]', args => new InitCommand(args));
    this.register('read', 'read <file.svg>', args => new ReadCommand(args));
    this.register('save', 'save [file.svg]', args => new SaveCommand(args));
    this.register('canvas', 'canvas [w h]', args => new CanvasCommand(args));
    this.register('create', 'create <type> <id> [params...] [in <containerId>]', args => new CreateCommand(args, factory));
    this.register('delete', 'delete <id>', args => new DeleteCommand(args));
    this.register('move', 'move <id> <dx> <dy>', args => new MoveCommand(args));
    this.register('scale', 'scale <id> <factor>', args => new ScaleCommand(args));
    this.register('set', 'set <id> <attr> <value>', args => new SetCommand(args));
    this.register('group', 'group <newGid> <id1> [id2...]', args => new GroupCommand(args));
    this.register('ungroup', 'ungroup <gid>', args => new UngroupCommand(args));
    this.register('addto', 'addto <gid> <id>', args => new AddToCommand(args));
    this.register('front', 'front <id>', args => new FrontCommand(args));
    this.register('back', 'back <id>', args => new BackCommand(args));
    this.register('tree', 'tree [id]', args => new TreeCommand(args));
    this.register('show', 'show <id>', args => new ShowCommand(args));
    this.register('undo', 'undo', args => new UndoCommand(args));
    this.register('redo', 'redo', args => new RedoCommand(args));
    this.register('help', 'help', args => new HelpCommand(args, this.help()));
  }
  private register(name: string, syntax: string, build: (args: readonly string[]) => Command): void { this.entries.set(name, { syntax, build }); }
  private help(): string[] {
    return [...Array.from(this.entries.values(), entry => entry.syntax), '', 'Shape parameters:',
      '  rect <id> <x> <y> <w> <h> [fill]', '  circle <id> <cx> <cy> <r> [fill]',
      '  ellipse <id> <cx> <cy> <rx> <ry> [fill]', '  line <id> <x1> <y1> <x2> <y2> [stroke]',
      '  text <id> <x> <y> "content"', '  g <id>',
      'Set: fill / stroke / stroke-width, own geometry attributes, text content via text.',
      'All create forms accept trailing in <containerId>. Ctrl+C / Ctrl+D exits; EOF ends a script.'];
  }
  create(tokens: readonly string[]): Command {
    const name = tokens[0]!;
    const entry = this.entries.get(name);
    if (!entry) throw new Error(`unknown command: ${name}`);
    return entry.build(tokens.slice(1));
  }
}
