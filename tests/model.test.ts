import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SvgDocument } from '../src/model/SvgDocument.js';
import { Group } from '../src/model/Group.js';
import { ShapeFactory } from '../src/model/ShapeFactory.js';

test('all six shapes clone independently and keep their geometry/style behavior', () => {
  const factory = new ShapeFactory();
  const cases: [string, string[]][] = [
    ['rect', ['1', '2', '3', '4', 'red']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']], ['line', ['1', '2', '3', '4', 'black']],
    ['text', ['1', '2', '中文 & <text>']], ['g', []],
  ];
  for (const [type, args] of cases) {
    const shape = factory.create(type, type, args);
    const copy = shape.clone();
    copy.move(10, 20);
    copy.scale(2);
    assert.equal(shape.type, type);
    assert.deepEqual(shape.clone().attributes(), shape.attributes());
    if (!shape.isContainer) assert.notDeepEqual(copy.attributes(), shape.attributes());
    assert.throws(() => shape.set('unknown', 'value'), /unknown attribute/);
  }
});

test('nested groups move and scale descendants, not stroke width', () => {
  const factory = new ShapeFactory();
  const doc = new SvgDocument();
  doc.add(new Group('outer'));
  doc.add(new Group('inner'), 'outer');
  doc.add(factory.create('rect', 'r', ['10', '20', '30', '40', 'blue']), 'inner');
  doc.find('r').set('stroke-width', '3');
  doc.find('outer').move(5, -10);
  doc.find('outer').scale(2);
  assert.deepEqual(doc.find('r').attributes(), { id: 'r', x: '30', y: '20', width: '60', height: '80', fill: 'blue', 'stroke-width': '3' });
  assert.throws(() => doc.find('outer').scale(0), /positive/);
  assert.throws(() => doc.addTo('inner', 'outer'), /descendant/);
});

test('group uses document order and restores ungroup children at container position', () => {
  const doc = new SvgDocument();
  const factory = new ShapeFactory();
  doc.add(new Group('scene'));
  for (const id of ['a', 'b', 'c']) doc.add(factory.create('circle', id, ['0', '0', '1']), 'scene');
  doc.group('pair', ['c', 'a']);
  assert.deepEqual(doc.find('pair').children.map(item => item.id), ['a', 'c']);
  assert.deepEqual(doc.find('scene').children.map(item => item.id), ['pair', 'b']);
  doc.ungroup('pair');
  assert.deepEqual(doc.find('scene').children.map(item => item.id), ['a', 'c', 'b']);
  assert.throws(() => doc.ungroup('scene'), /top-level/);
});

test('cross-parent grouping, duplicate IDs, cycle and ancestor selection validation', () => {
  const doc = new SvgDocument();
  doc.add(new Group('left')); doc.add(new Group('right'));
  doc.add(new Group('a'), 'left'); doc.add(new Group('b'), 'right');
  assert.throws(() => doc.group('bad', ['left', 'a']), /descendant: left/);
  assert.throws(() => doc.group('bad', ['a', 'a']), /duplicate/);
  assert.throws(() => doc.add(new Group('a')), /already exists/);
  doc.group('pair', ['b', 'a']);
  assert.deepEqual(doc.find('pair').children.map(item => item.id), ['a', 'b']);
  assert.equal(doc.parentLabel(doc.find('pair')), 'svg');
  doc.reorder('pair', false);
  assert.equal(doc.children[0]!.id, 'pair');
  doc.reorder('pair', true);
  assert.equal(doc.children.at(-1)!.id, 'pair');
});

test('overflow is rejected before any subtree is modified', () => {
  const doc = new SvgDocument();
  const factory = new ShapeFactory();
  doc.add(new Group('g'));
  doc.add(factory.create('circle', 'small', ['1', '2', '3']), 'g');
  doc.add(factory.create('circle', 'large', ['1e308', '2', '3']), 'g');
  const before = doc.all().map(item => item.attributes());
  assert.throws(() => doc.find('g').scale(2), /invalid/);
  assert.deepEqual(doc.all().map(item => item.attributes()), before);
  assert.throws(() => doc.resize(100, -1), /invalid/);
  assert.equal(doc.width, 800);
});
