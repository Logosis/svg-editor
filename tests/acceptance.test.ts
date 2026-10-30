import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { NodeFileStore } from '../src/infrastructure/NodeFileStore.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

test('real CLI reads scripts to EOF, writes SVG, and exits successfully', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  try {
    const path = join(directory, '中文 diagram.svg').replace(/\\/g, '/');
    const input = ['# replayable script', 'init 400 200', 'create g flow',
      'create rect start 30 70 120 60 #4a90d9 in flow', 'create line edge 150 100 250 100 black in flow',
      'create rect end 250 70 120 60 #f5a623 in flow', 'tree', `save "${path}"`, ''].join('\n');
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], { cwd: fileURLToPath(new URL('..', import.meta.url)), input, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /svg-editor 0.1/);
    assert.match(result.stdout, /rect#start/);
    assert.equal(new SvgCodec().decode(readFileSync(path, 'utf8')).document.count, 4);
    assert.deepEqual(readdirSync(directory), ['中文 diagram.svg']);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('batch errors use stderr, return nonzero, and continue processing later lines', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8',
    input: 'init\ncreate g scene\ncreate box b 1 2 3 4 "title"\ncreate circle c 1 2 3\ntree\n',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^error: unknown shape type: box/m);
  assert.match(result.stdout, /circle#c/);
});

test('atomic file writer replaces existing files and cleans up on failure', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-files-'));
  try {
    const store = new NodeFileStore();
    const target = join(directory, 'target.svg');
    store.write(target, 'first'); store.write(target, 'second');
    assert.equal(store.read(target), 'second');
    const subdir = join(directory, 'cannot-replace'); mkdirSync(subdir);
    assert.throws(() => store.write(subdir, 'bad'), /cannot write file/);
    assert.throws(() => store.write(join(directory, 'missing', 'x.svg'), 'bad'), /cannot write file/);
    assert.throws(() => store.read(join(directory, 'missing.svg')), /cannot read file/);
    assert.deepEqual(readdirSync(directory).sort(), ['cannot-replace', 'target.svg']);
    assert.equal(store.read(target), 'second');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
