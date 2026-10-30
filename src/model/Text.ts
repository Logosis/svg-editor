import { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export class Text extends Shape {
  private content: string;
  constructor(id: string, x: number, y: number, text: string) {
    super(id, 'text', { x, y });
    this.content = Validation.xmlText(text);
  }
  override get text(): string { return this.content; }
  override set(name: string, value: string): void {
    if (name === 'text') this.content = Validation.xmlText(value);
    else super.set(name, value);
  }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ['x'], ['y']); }
  override clone(): Text { return this.copyAppearance(new Text(this.id, this.number('x'), this.number('y'), this.text)); }
  override summary(): string { return this.styled(`(${this.number('x')},${this.number('y')}) ${JSON.stringify(this.text)}`); }
}
