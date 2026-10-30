import { DOMParser, type Element, type Node } from '@xmldom/xmldom';
import type { DocumentCodec } from '../application/DocumentCodec.js';
import { SvgDocument } from '../model/SvgDocument.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { Group } from '../model/Group.js';
import type { Shape } from '../model/Shape.js';
import { Validation } from '../model/Validation.js';
import { XmlWriter } from './XmlWriter.js';

export class SvgCodec implements DocumentCodec {
  constructor(private readonly factory = new ShapeFactory()) {}
  private elements(node: Node): Element[] {
    return Array.from(node.childNodes).filter((child): child is Element => child.nodeType === 1);
  }
  private attributes(element: Element): Record<string, string> {
    return Object.fromEntries(Array.from(element.attributes).map(attr => [attr.name, attr.value]));
  }
  decode(source: string): { document: SvgDocument; warnings: string[] } {
    Validation.xmlText(source);
    // DTDs/entities and XML stylesheets are outside this editor's interchange subset.
    if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source)) throw new Error('unsupported SVG declaration');
    const xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, 'application/xml');
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== 'http://www.w3.org/2000/svg')) throw new Error('invalid SVG root');
    const rootAttrs = this.attributes(root);
    const viewBox = rootAttrs.viewBox?.trim().split(/[\s,]+/).map(value => Validation.number(value, 'viewBox'));
    if (viewBox && (viewBox.length !== 4 || viewBox[2]! <= 0 || viewBox[3]! <= 0)) throw new Error('invalid viewBox');
    const width = Validation.number(rootAttrs.width ?? viewBox?.[2] ?? 800, 'canvas width', Number.MIN_VALUE);
    const height = Validation.number(rootAttrs.height ?? viewBox?.[3] ?? 600, 'canvas height', Number.MIN_VALUE);
    const document = new SvgDocument(width, height);
    for (const [key, value] of Object.entries(rootAttrs)) {
      if (['width', 'height', 'xmlns'].includes(key)) continue;
      if (['viewBox', 'id', 'preserveAspectRatio', 'fill', 'stroke', 'font-size', 'font-family', 'text-anchor', 'opacity', 'stroke-width'].includes(key) || /^(?:data-|aria-)/.test(key)) document.preserve(key, value);
      else throw new Error(`unsupported SVG attribute: ${key}`);
    }
    const all: Element[] = [];
    const collect = (element: Element): void => { all.push(element); this.elements(element).forEach(collect); };
    this.elements(root).forEach(collect);
    const used = new Set<string>();
    if (rootAttrs.id !== undefined) used.add(Validation.id(rootAttrs.id));
    for (const element of all) {
      if (element.hasAttribute('id')) {
        const id = Validation.id(element.getAttribute('id')!);
        if (used.has(id)) throw new Error(`id already exists: ${id}`);
        used.add(id);
      }
    }
    const warnings: string[] = [];
    const parse = (element: Element): Shape => {
      if (element.namespaceURI && element.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('unsupported SVG namespace');
      const type = element.localName ?? element.tagName;
      const attrs = this.attributes(element);
      let id = attrs.id;
      if (id === undefined) {
        let serial = 1;
        while (used.has(`${type}${serial}`)) serial++;
        id = `${type}${serial}`; used.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = this.factory.fromSvg(type, id, attrs, element.textContent ?? '');
      const children = this.elements(element);
      if (shape instanceof Group) children.forEach(child => shape.insert(parse(child)));
      else if (children.length) throw new Error(`unsupported nested content in <${type}>`);
      if (shape.text === undefined && Array.from(element.childNodes).some(child => (child.nodeType === 3 || child.nodeType === 4) && child.nodeValue?.trim())) throw new Error(`unexpected text in <${type}>`);
      return shape;
    };
    if (Array.from(root.childNodes).some(child => (child.nodeType === 3 || child.nodeType === 4) && child.nodeValue?.trim())) throw new Error('unexpected text in <svg>');
    this.elements(root).forEach(element => document.add(parse(element)));
    return { document, warnings };
  }
  encode(document: SvgDocument): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${document.serialize(new XmlWriter())}\n`;
  }
}
