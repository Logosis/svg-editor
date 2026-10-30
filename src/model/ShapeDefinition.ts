import type { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export class ShapeDefinition {
  constructor(
    private readonly geometry: readonly string[],
    private readonly build: (id: string, values: number[], text: string) => Shape,
    private readonly optionalStyle?: string,
    private readonly hasText = false,
  ) {}

  create(id: string, args: readonly string[]): Shape {
    const required = this.geometry.length + (this.hasText ? 1 : 0);
    if (args.length < required || args.length > required + (this.optionalStyle ? 1 : 0)) throw new Error('invalid shape arguments');
    const values = this.geometry.map((key, index) => Validation.number(args[index]!, key));
    const shape = this.build(id, values, this.hasText ? args[this.geometry.length]! : '');
    if (this.optionalStyle && args.length > required) shape.set(this.optionalStyle, args[required]!);
    return shape;
  }

  fromSvg(id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const values = this.geometry.map(key => Validation.number(attributes[key] ?? '0', key));
    const shape = this.build(id, values, text);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'id' || this.geometry.includes(key) || key === 'xmlns') continue;
      if (['fill', 'stroke', 'stroke-width'].includes(key)) shape.set(key, value);
      else if (/^(?:data-|aria-)/.test(key) || [
        'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline',
        'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
        'stroke-dasharray', 'stroke-dashoffset', 'fill-rule', 'visibility', 'display', 'role',
      ].includes(key)) shape.preserve(key, value);
      else throw new Error(`unsupported SVG attribute: ${key}`);
    }
    return shape;
  }
}
