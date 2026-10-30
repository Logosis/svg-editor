import { Shape } from './Shape.js';

export class Rect extends Shape {
  constructor(id: string, x: number, y: number, width: number, height: number) { super(id, 'rect', { x, y, width, height }); }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ['x'], ['y']); }
  override clone(): Rect { return this.copyAppearance(new Rect(this.id, this.number('x'), this.number('y'), this.number('width'), this.number('height'))); }
  override summary(): string { return this.styled(`x=${this.number('x')} y=${this.number('y')} w=${this.number('width')} h=${this.number('height')}`); }
}
