import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Group } from './Group.js';
import { Line } from './Line.js';
import { Rect } from './Rect.js';
import { Text } from './Text.js';
import { ShapeDefinition } from './ShapeDefinition.js';
import type { Shape } from './Shape.js';

export class ShapeFactory {
  // The only type-name dispatch; SVG imports use the same definitions as create.
  private readonly definitions = new Map<string, ShapeDefinition>([
    ['rect', new ShapeDefinition(['x', 'y', 'width', 'height'], (id, v) => new Rect(id, v[0]!, v[1]!, v[2]!, v[3]!), 'fill')],
    ['circle', new ShapeDefinition(['cx', 'cy', 'r'], (id, v) => new Circle(id, v[0]!, v[1]!, v[2]!), 'fill')],
    ['ellipse', new ShapeDefinition(['cx', 'cy', 'rx', 'ry'], (id, v) => new Ellipse(id, v[0]!, v[1]!, v[2]!, v[3]!), 'fill')],
    ['line', new ShapeDefinition(['x1', 'y1', 'x2', 'y2'], (id, v) => new Line(id, v[0]!, v[1]!, v[2]!, v[3]!), 'stroke')],
    ['text', new ShapeDefinition(['x', 'y'], (id, v, text) => new Text(id, v[0]!, v[1]!, text), undefined, true)],
    ['g', new ShapeDefinition([], id => new Group(id))],
  ]);
  private definition(type: string): ShapeDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
  create(type: string, id: string, args: readonly string[]): Shape { return this.definition(type).create(id, args); }
  fromSvg(type: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    return this.definition(type).fromSvg(id, attributes, text);
  }
}
