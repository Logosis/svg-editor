import { SvgDocument } from '../model/SvgDocument.js';
import type { DocumentCodec } from './DocumentCodec.js';
import type { FileStore } from './FileStore.js';

export class Editor {
  private current?: SvgDocument;
  private path?: string;
  constructor(private readonly files: FileStore, private readonly codec: DocumentCodec) {}
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  init(width = 800, height = 600): string[] {
    const document = new SvgDocument(width, height);
    this.current = document;
    this.path = undefined;
    return [`canvas ${width}x${height} created`];
  }
  read(path: string): string[] {
    const result = this.codec.decode(this.files.read(path));
    this.current = result.document;
    this.path = path;
    return [...result.warnings, `read ${path} (${this.document.count} elements)`];
  }
  save(path?: string): string[] {
    const document = this.document;
    const destination = path ?? this.path;
    if (!destination) throw new Error('no file path. use save <file.svg>');
    this.files.write(destination, this.codec.encode(document));
    this.path = destination;
    return [`saved to ${destination} (${document.count} elements)`];
  }
  snapshot(): SvgDocument { return this.document.clone(); }
  restore(snapshot: SvgDocument): void { this.current = snapshot.clone(); }
}
