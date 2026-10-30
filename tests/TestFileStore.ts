import type { FileStore } from '../src/application/FileStore.js';

export class TestFileStore implements FileStore {
  private readonly contents = new Map<string, string>();
  private writable = true;
  seed(path: string, content: string): void { this.contents.set(path, content); }
  denyWrites(): void { this.writable = false; }
  read(path: string): string {
    const content = this.contents.get(path);
    if (content === undefined) throw new Error(`cannot read file: ${path}`);
    return content;
  }
  write(path: string, content: string): void {
    if (!this.writable) throw new Error(`cannot write file: ${path}`);
    this.contents.set(path, content);
  }
}
