import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandProcessor } from '../src/cli/CommandProcessor.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { TestFileStore } from './TestFileStore.js';

export class TestSession {
  readonly files = new TestFileStore();
  readonly codec = new SvgCodec();
  readonly editor = new Editor(this.files, this.codec);
  readonly processor = new CommandProcessor(this.editor);
  run(line: string): string {
    const result = this.processor.process(line);
    assert.equal(result.failed, false, result.lines.join('\n'));
    return result.lines.join('\n');
  }
  fail(line: string, pattern: RegExp): void {
    const result = this.processor.process(line);
    assert.equal(result.failed, true, `expected failure: ${line}`);
    assert.equal(result.lines.length, 1);
    assert.match(result.lines[0]!, pattern);
  }
  snapshot(): string { return this.codec.encode(this.editor.document); }
}
