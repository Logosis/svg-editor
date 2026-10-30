import { Group } from './Group.js';
import type { Shape } from './Shape.js';
import type { MarkupWriter } from './MarkupWriter.js';
import { Validation } from './Validation.js';

export class SvgDocument {
  private root = new Group('__canvas__');
  private canvasWidth: number;
  private canvasHeight: number;
  private readonly metadata = new Map<string, string>();

  constructor(width = 800, height = 600) {
    this.canvasWidth = Validation.number(width, 'canvas width', Number.MIN_VALUE);
    this.canvasHeight = Validation.number(height, 'canvas height', Number.MIN_VALUE);
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return this.root.children; }
  get count(): number { return this.all().length; }
  resize(width: number, height: number): void {
    const w = Validation.number(width, 'canvas width', Number.MIN_VALUE);
    const h = Validation.number(height, 'canvas height', Number.MIN_VALUE);
    this.canvasWidth = w;
    this.canvasHeight = h;
    // Resizing resets the coordinate system to match the new canvas.
    this.metadata.delete('viewBox');
  }
  preserve(name: string, value: string): void { this.metadata.set(name, Validation.xmlText(value)); }

  all(): Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => { result.push(shape); shape.children.forEach(visit); };
    this.children.forEach(visit);
    return result;
  }
  find(id: string): Shape {
    const shape = this.all().find(item => item.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const shape = this.all().find(item => item.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parent(shape: Shape): Group {
    const parent = [this.root, ...this.all()].find(item => item instanceof Group && item.children.includes(shape));
    if (!(parent instanceof Group)) throw new Error(`no parent for: ${shape.id}`);
    return parent;
  }
  parentLabel(shape: Shape): string { const parent = this.parent(shape); return parent === this.root ? 'svg' : parent.label; }
  private available(id: string): void {
    Validation.id(id);
    if (this.metadata.get('id') === id || this.all().some(item => item.id === id)) throw new Error(`id already exists: ${id}`);
  }
  add(shape: Shape, containerId?: string): void {
    const incoming: Shape[] = [];
    const visit = (item: Shape): void => { incoming.push(item); item.children.forEach(visit); };
    visit(shape);
    const seen = new Set<string>();
    for (const item of incoming) {
      this.available(item.id);
      if (seen.has(item.id)) throw new Error(`id already exists: ${item.id}`);
      seen.add(item.id);
    }
    this.container(containerId).insert(shape);
  }
  delete(id: string): void { const shape = this.find(id); this.parent(shape).remove(shape); }

  group(id: string, ids: readonly string[]): Group {
    this.available(id);
    if (ids.length === 0) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const requested = ids.map(member => this.find(member));
    for (const item of requested) {
      if (item instanceof Group && requested.some(other => item !== other && item.contains(other))) {
        throw new Error(`cannot group a container into its own descendant: ${item.id}`);
      }
    }
    const ordered = this.all().filter(item => requested.includes(item));
    let destination = this.parent(ordered[0]!);
    while (!ordered.every(item => destination.contains(item))) destination = this.parent(destination);
    let anchor: Shape = ordered[0]!;
    while (this.parent(anchor) !== destination) anchor = this.parent(anchor);
    const index = destination.children.indexOf(anchor);
    const group = new Group(id);
    for (const item of ordered) { this.parent(item).remove(item); group.insert(item); }
    destination.insert(group, index);
    return group;
  }

  ungroup(id: string): void {
    const group = this.container(id);
    const parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.remove(group);
    group.children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
  }

  addTo(gid: string, id: string): void {
    const target = this.container(gid);
    const shape = this.find(id);
    if (shape === target || (shape instanceof Group && shape.contains(target))) throw new Error(`cannot move a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape);
    target.insert(shape);
  }

  reorder(id: string, front: boolean): void {
    const shape = this.find(id);
    const parent = this.parent(shape);
    parent.remove(shape);
    // SVG paints later siblings on top.
    parent.insert(shape, front ? parent.children.length : 0);
  }

  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    copy.root = this.root.clone();
    for (const [key, value] of this.metadata) copy.preserve(key, value);
    return copy;
  }
  serialize(writer: MarkupWriter): string {
    return writer.element('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: String(this.width), height: String(this.height),
      viewBox: `0 0 ${this.width} ${this.height}`, ...Object.fromEntries(this.metadata),
    }, undefined, this.children.map(child => child.serialize(writer)));
  }
}
