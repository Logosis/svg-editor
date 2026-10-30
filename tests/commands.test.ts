import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { TestSession } from './TestSession.js';

test('tokenizer keeps color literals, quoted empty text, Chinese, escapes and Windows paths', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('  # ignored'), []);
  assert.deepEqual(tokenizer.tokenize(''), []);
  assert.deepEqual(tokenizer.tokenize('create rect r 0 0 2 3 #fff'), ['create', 'rect', 'r', '0', '0', '2', '3', '#fff']);
  assert.deepEqual(tokenizer.tokenize('create text t 0 0 ""'), ['create', 'text', 't', '0', '0', '']);
  assert.deepEqual(tokenizer.tokenize('set t text "中文 \\"quote\\" \\\\"'), ['set', 't', 'text', '中文 "quote" \\']);
  assert.deepEqual(tokenizer.tokenize(String.raw`read "C:\new folder\demo.svg"`), ['read', String.raw`C:\new folder\demo.svg`]);
  assert.throws(() => tokenizer.tokenize('set t text "bad'), /unterminated/);
  assert.throws(() => tokenizer.tokenize('"foo"bar'), /whitespace/);
  assert.throws(() => tokenizer.tokenize('foo"bar"'), /complete argument/);
});

test('help works before init, all other operations require a document', () => {
  const s = new TestSession();
  assert.match(s.run('help'), /create <type>/);
  for (const command of ['tree', 'show r', 'canvas', 'save x.svg', 'undo', 'redo', 'create g g']) s.fail(command, /no document/);
  s.fail('unknown', /unknown command/);
  assert.match(s.run('init'), /800x600/);
});

test('flowchart acceptance: nested create, tree, show, move, set and save', () => {
  const s = new TestSession();
  const script = [
    'init 800 600', 'create g flowchart', 'create g node1 in flowchart',
    'create rect start 120 100 160 60 #4a90d9 in node1', 'create text start-label 155 135 "开始" in node1',
    'create g node2 in flowchart', 'create rect process 520 100 160 60 #f5a623 in node2',
    'create text process-label 545 135 "处理数据" in node2', 'create line arrow1 280 130 520 130 black in flowchart',
  ];
  script.forEach(command => s.run(command));
  const before = s.snapshot();
  assert.match(s.run('tree'), /└── g#flowchart[\s\S]*rect#start[\s\S]*"开始"[\s\S]*line#arrow1/);
  assert.match(s.run('show process'), /parent=g#node2/);
  s.run('move node2 0 100');
  assert.equal(s.editor.document.find('process-label').number('y'), 235);
  s.run('undo'); assert.equal(s.snapshot(), before);
  s.run('redo'); s.run('undo');
  s.run('set process-label text "处理数据 v2"');
  s.run('save "my diagram.svg"');
  const parsed = s.codec.decode(s.files.read('my diagram.svg')).document;
  assert.equal(parsed.count, 8);
  assert.equal(parsed.find('process-label').text, '处理数据 v2');
});

test('every editing command is exactly one undo unit and redo restores exact state', () => {
  const commands = [
    'create circle c 5 6 7 red in scene', 'delete a', 'move scene 1.2 -4.5', 'scale scene 1.5',
    'set a width 77', 'group pair b a', 'ungroup inner', 'addto inner a', 'front a', 'back b',
  ];
  for (const command of commands) {
    const s = new TestSession();
    ['init', 'create g scene', 'create rect a 1 2 3 4 in scene', 'create rect b 5 6 7 8 in scene',
      'create g inner in scene', 'create text t 5 6 "a & b" in inner'].forEach(line => s.run(line));
    const before = s.snapshot();
    s.run(command); const after = s.snapshot(); assert.notEqual(before, after, command);
    s.run('tree'); s.run('show scene'); s.run('help'); s.run('canvas');
    s.run('undo'); assert.equal(s.snapshot(), before, command);
    s.run('redo'); assert.equal(s.snapshot(), after, command);
  }
});

test('failed edits preserve document, undo stack and redo stack', () => {
  const s = new TestSession();
  ['init', 'create g scene', 'create g inner in scene', 'create rect r 1 2 3 4 in inner', 'move r 10 20', 'undo'].forEach(line => s.run(line));
  const before = s.snapshot();
  const failures: [string, RegExp][] = [
    ['create circle r 1 2 3', /id already exists: r/], ['delete missing', /no such shape: missing/],
    ['create g new in absent', /no such container: absent/], ['create g new in r', /not a container: r/],
    ['create box new 1 2 3 4 "box"', /unknown shape type: box/], ['group bad scene r', /own descendant: scene/],
    ['group bad r r', /duplicate/], ['group bad r missing', /no such shape/], ['ungroup scene', /top-level/],
    ['addto inner scene', /own descendant/], ['addto r scene', /not a container/], ['scale r 0', /positive/],
    ['scale scene -1', /positive/], ['set r height -1', /invalid/], ['set scene x 10', /unknown attribute: x/],
    ['set r text nope', /unknown attribute: text/], ['set r fill', /invalid command arguments/],
    ['move r NaN 1', /invalid/], ['move r Infinity 1', /invalid/], ['move r 0x10 1', /invalid/],
    ['set r stroke-width -1', /invalid/], ['create rect bad 0 0 -1 2', /invalid/],
    ['set r fill "unterminated', /unterminated/], ['canvas 100', /invalid command arguments/],
  ];
  for (const [line, pattern] of failures) { s.fail(line, pattern); assert.equal(s.snapshot(), before, line); }
  s.run('redo'); assert.equal(s.editor.document.find('r').number('x'), 11);
  s.run('undo'); s.run('set r fill blue'); s.fail('redo', /nothing to redo/);
  s.run('undo'); assert.equal(s.snapshot(), before);
  s.run('undo'); assert.throws(() => s.editor.document.find('r'), /no such shape/);
});

test('all successful document mutations block undo/redo until a new successful edit', () => {
  for (const barrier of ['init 100 200', 'read source.svg', 'save target.svg', 'canvas 300 400']) {
    const s = new TestSession();
    s.files.seed('source.svg', '<svg width="12" height="34"/>');
    ['init', 'create g old'].forEach(line => s.run(line));
    s.run(barrier);
    s.fail('undo', /undo not allowed after io command/); s.fail('redo', /undo not allowed after io command/);
    s.fail('delete missing', /no such shape/); s.fail('undo', /undo not allowed/);
    const before = s.snapshot();
    s.run('create g fresh'); s.run('undo'); assert.equal(s.snapshot(), before);
    s.fail('undo', /nothing to undo/); s.run('redo'); assert.equal(s.editor.document.find('fresh').type, 'g');
  }
});

test('failed read/save/init/resize leave active file, document and history intact', () => {
  const s = new TestSession();
  s.files.seed('original.svg', '<svg width="100" height="100"><rect id="r" width="5" height="6"/></svg>');
  s.run('read original.svg'); s.run('move r 10 20');
  const before = s.snapshot();
  s.files.seed('broken.svg', '<svg><rect></svg>');
  for (const command of ['read missing.svg', 'read broken.svg', 'init 100 -1', 'canvas -1 100']) {
    s.fail(command, /^error:/); assert.equal(s.snapshot(), before);
  }
  s.files.denyWrites(); s.fail('save other.svg', /cannot write file/);
  assert.equal(s.snapshot(), before); s.run('undo'); assert.equal(s.editor.document.find('r').number('x'), 0);
  s.fail('save', /cannot write file: original.svg/);
});

test('save path reuse, init path reset, case sensitivity and omitted style defaults', () => {
  const s = new TestSession();
  s.run('init'); s.fail('save', /no file path/);
  s.run('create rect r 0 0 1 2'); s.run('create circle R 2 3 4');
  assert.equal(s.editor.document.find('r').attributes().fill, undefined);
  s.run('save first.svg'); s.run('set r fill red'); s.run('save');
  assert.match(s.files.read('first.svg'), /fill="red"/);
  s.run('init'); s.fail('save', /no file path/);
});

test('overflow rollback and numeric roundoff restore exact previous attributes', () => {
  const s = new TestSession();
  ['init', 'create g g', 'create rect r 0.1 0.2 0.3 0.4 in g', 'create circle c 1e308 0 1 in g'].forEach(line => s.run(line));
  const before = s.snapshot();
  s.fail('scale g 2', /invalid/); assert.equal(s.snapshot(), before);
  s.run('scale r 3'); s.run('undo'); assert.equal(s.snapshot(), before);
});

test('text containing in is not mistaken for a parent suffix and errors stay on one line', () => {
  const s = new TestSession();
  ['init', 'create g g', 'create text t 0 0 "in"', 'create text t2 0 0 "words in g" in g'].forEach(line => s.run(line));
  assert.equal(s.editor.document.find('t').text, 'in');
  assert.equal(s.editor.document.find('t2').text, 'words in g');
  const error = s.processor.process('read "bad\npath"');
  assert.equal(error.failed, true); assert.equal(error.lines.length, 1); assert.doesNotMatch(error.lines[0]!, /[\r\n]/);
});
