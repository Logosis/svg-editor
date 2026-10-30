import { Shape } from './Shape.js';

export class Line extends Shape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) { super(id, 'line', { x1, y1, x2, y2 }); }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ['x1', 'x2'], ['y1', 'y2']); }
  override clone(): Line { return this.copyAppearance(new Line(this.id, this.number('x1'), this.number('y1'), this.number('x2'), this.number('y2'))); }
  override summary(): string { return this.styled(`(${this.number('x1')},${this.number('y1')}) -> (${this.number('x2')},${this.number('y2')})`); }
}
