import { Shape } from './Shape.js';

export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super(id, 'ellipse', { cx, cy, rx, ry }); }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ['cx'], ['cy']); }
  override clone(): Ellipse { return this.copyAppearance(new Ellipse(this.id, this.number('cx'), this.number('cy'), this.number('rx'), this.number('ry'))); }
  override summary(): string { return this.styled(`cx=${this.number('cx')} cy=${this.number('cy')} rx=${this.number('rx')} ry=${this.number('ry')}`); }
}
