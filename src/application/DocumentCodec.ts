import type { SvgDocument } from '../model/SvgDocument.js';

export interface DocumentCodec {
  decode(source: string): { document: SvgDocument; warnings: string[] };
  encode(document: SvgDocument): string;
}
