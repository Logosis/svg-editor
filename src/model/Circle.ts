import { Shape } from './Shape.js';

export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, r: number) { super(id, 'circle', { cx, cy, r }); }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ['cx'], ['cy']); }
  override clone(): Circle { return this.copyAppearance(new Circle(this.id, this.number('cx'), this.number('cy'), this.number('r'))); }
  override summary(): string { return this.styled(`cx=${this.number('cx')} cy=${this.number('cy')} r=${this.number('r')}`); }
}
