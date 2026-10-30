import type { MarkupWriter } from '../model/MarkupWriter.js';
import { Validation } from '../model/Validation.js';

export class XmlWriter implements MarkupWriter {
  private escape(value: string): string {
    return Validation.xmlText(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;');
  }
  element(tag: string, attributes: Readonly<Record<string, string>>, text: string | undefined, children: readonly string[]): string {
    const attrs = Object.entries(attributes).map(([key, value]) => ` ${key}="${this.escape(value).replace(/\n/g, '&#10;').replace(/\t/g, '&#9;')}"`).join('');
    if (text !== undefined) return `<${tag}${attrs}>${this.escape(text)}</${tag}>`;
    if (!children.length) return `<${tag}${attrs}/>`;
    return `<${tag}${attrs}>\n${children.map(child => child.split('\n').map(line => `  ${line}`).join('\n')).join('\n')}\n</${tag}>`;
  }
}
