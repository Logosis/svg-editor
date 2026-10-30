import type { MarkupWriter } from './MarkupWriter.js';
import { Validation } from './Validation.js';

export abstract class Shape {
  private readonly geometry = new Map<string, number>();
  private readonly styles = new Map<string, string>();
  private readonly extras = new Map<string, string>();

  protected constructor(private readonly identifier: string, private readonly tag: string, values: Record<string, number>) {
    Validation.id(identifier);
    for (const [name, value] of Object.entries(values)) {
      this.geometry.set(name, Validation.number(value, name, this.minimum(name)));
    }
  }

  get id(): string { return this.identifier; }
  get type(): string { return this.tag; }
  get label(): string { return `${this.type}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get text(): string | undefined { return undefined; }
  get isContainer(): boolean { return false; }

  abstract move(dx: number, dy: number): void;
  abstract clone(): Shape;
  abstract summary(): string;

  protected minimum(name: string): number {
    return ['width', 'height', 'r', 'rx', 'ry'].includes(name) ? 0 : -Infinity;
  }

  number(name: string): number {
    const value = this.geometry.get(name);
    if (value === undefined) throw new Error(`unknown attribute: ${name}`);
    return value;
  }

  set(name: string, value: string): void {
    if (this.geometry.has(name)) {
      this.geometry.set(name, Validation.number(value, name, this.minimum(name)));
    } else if (['fill', 'stroke', 'stroke-width'].includes(name)) {
      if (name === 'stroke-width') Validation.number(value, name, 0);
      this.styles.set(name, Validation.xmlText(value));
    } else {
      throw new Error(`unknown attribute: ${name}`);
    }
  }

  // Import-only metadata is preserved, but does not extend the CLI set whitelist.
  preserve(name: string, value: string): void { this.extras.set(name, Validation.xmlText(value)); }

  protected translate(dx: number, dy: number, xs: readonly string[], ys: readonly string[]): void {
    Validation.number(dx, 'dx');
    Validation.number(dy, 'dy');
    const changes = new Map<string, number>();
    for (const key of xs) changes.set(key, Validation.number(this.number(key) + dx, key));
    for (const key of ys) changes.set(key, Validation.number(this.number(key) + dy, key));
    for (const [key, value] of changes) this.geometry.set(key, value);
  }

  scale(factor: number): void {
    Validation.factor(factor);
    const changes = new Map<string, number>();
    for (const [key, value] of this.geometry) changes.set(key, Validation.number(value * factor, key));
    for (const [key, value] of changes) this.geometry.set(key, value);
  }

  attributes(): Readonly<Record<string, string>> {
    return Object.fromEntries([
      ...this.extras, ['id', this.id],
      ...Array.from(this.geometry, ([key, value]) => [key, String(value)]), ...this.styles,
    ]);
  }

  protected styled(summary: string): string {
    const style = Array.from(this.styles, ([key, value]) => `${key}=${value}`).join(' ');
    return `${this.label}${summary ? `  ${summary}` : ''}${style ? ` ${style}` : ''}`;
  }

  protected copyAppearance<T extends Shape>(target: T): T {
    for (const [key, value] of this.styles) target.set(key, value);
    for (const [key, value] of this.extras) target.preserve(key, value);
    return target;
  }

  serialize(writer: MarkupWriter): string {
    return writer.element(this.type, this.attributes(), this.text, this.children.map(child => child.serialize(writer)));
  }
}
