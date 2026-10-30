import { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export class Group extends Shape {
  private readonly items: Shape[] = [];
  constructor(id: string) { super(id, 'g', {}); }
  override get isContainer(): boolean { return true; }
  override get children(): readonly Shape[] { return [...this.items]; }

  contains(shape: Shape): boolean {
    return this === shape || this.items.some(child => child === shape || (child instanceof Group && child.contains(shape)));
  }

  insert(shape: Shape, index = this.items.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this))) throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    if (this.contains(shape)) throw new Error(`shape already in container: ${shape.id}`);
    if (index < 0 || index > this.items.length) throw new Error('invalid child index');
    this.items.splice(index, 0, shape);
  }

  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index === -1) throw new Error(`shape not in container: ${shape.id}`);
    this.items.splice(index, 1);
    return index;
  }

  override move(dx: number, dy: number): void {
    Validation.number(dx, 'dx');
    Validation.number(dy, 'dy');
    // Validate the whole subtree before touching any original child.
    for (const child of this.items) child.clone().move(dx, dy);
    for (const child of this.items) child.move(dx, dy);
  }

  override scale(factor: number): void {
    Validation.factor(factor);
    for (const child of this.items) child.clone().scale(factor);
    for (const child of this.items) child.scale(factor);
  }

  override clone(): Group {
    const target = this.copyAppearance(new Group(this.id));
    for (const child of this.items) target.insert(child.clone());
    return target;
  }
  override summary(): string { return this.styled(''); }
}
