import { Command } from './Command.js';
export class HelpCommand extends Command {
  constructor(args: readonly string[], private readonly syntax: readonly string[]) { super(args); }
  override execute(): string[] { this.count(0); return [...this.syntax]; }
}
