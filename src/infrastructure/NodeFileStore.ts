import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FileStore } from '../application/FileStore.js';

export class NodeFileStore implements FileStore {
  read(path: string): string {
    try { return readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
  }
  write(path: string, content: string): void {
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch {
      try { unlinkSync(temporary); } catch { /* No temporary file may have been created. */ }
      throw new Error(`cannot write file: ${path}`);
    }
  }
}
