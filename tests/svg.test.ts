import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { SvgDocument } from '../src/model/SvgDocument.js';
import { Group } from '../src/model/Group.js';

test('all supported geometry, styles, metadata and XML text survive round trip', () => {
  const codec = new SvgCodec();
  const doc = new SvgDocument(400, 300);
  const factory = new ShapeFactory();
  doc.add(new Group('g'));
  const shapes: [string, string[]][] = [
    ['rect', ['0.1', '-2', '3.5', '4', '#fff']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4', 'red']], ['line', ['1', '2', '3', '4', 'black']],
    ['text', ['1', '2', '中文 😀 <tag> & "quoted" \'single\'\nnext\r\n\tend']],
  ];
  for (const [type, args] of shapes) {
    const shape = factory.create(type, type, args);
    shape.set('stroke-width', '0.5'); doc.add(shape, 'g');
  }
  doc.find('text').preserve('text-anchor', 'middle');
  doc.find('g').set('fill', 'blue'); doc.find('g').preserve('data-kind', 'box');
  const xml = codec.encode(doc);
  assert.match(xml, /&lt;tag&gt; &amp; &quot;quoted&quot;/);
  const result = codec.decode(xml);
  assert.deepEqual(result.warnings, []);
  assert.equal(codec.encode(result.document), xml);
  assert.equal(result.document.find('text').text, doc.find('text').text);
  assert.equal(result.document.find('g').type, 'g');
});

test('automatic IDs reserve all explicit IDs, including later nodes and the SVG root', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg id="g1"><g><rect/><rect id="rect1"/><rect/><text>中文</text></g></svg>');
  assert.deepEqual(result.warnings, [
    'warning: assigned id g2 to unnamed <g>', 'warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id rect3 to unnamed <rect>', 'warning: assigned id text1 to unnamed <text>',
  ]);
  assert.equal(result.document.find('text1').text, '中文');
  assert.throws(() => result.document.add(new Group('g1')), /id already exists: g1/);
});

test('root viewBox and inherited appearance survive, resize resets viewBox coherently', () => {
  const codec = new SvgCodec();
  const { document } = codec.decode('<svg width="400" height="300" viewBox="-20 -30 200 150" fill="red" preserveAspectRatio="xMidYMid meet"><circle id="c" r="2"/></svg>');
  assert.match(codec.encode(document), /viewBox="-20 -30 200 150"/);
  assert.match(codec.encode(document), /fill="red"/);
  document.resize(500, 600);
  assert.match(codec.encode(document), /viewBox="0 0 500 600"/);
  assert.equal(codec.decode('<svg viewBox="0 0 12 34"/>').document.height, 34);
});

test('CDATA, entity references and empty text retain content', () => {
  const codec = new SvgCodec();
  const { document } = codec.decode('<svg><text id="a"><![CDATA[<中文>]]>&amp;&#10;end</text><text id="b"/></svg>');
  assert.equal(document.find('a').text, '<中文>&\nend');
  assert.equal(document.find('b').text, '');
  assert.equal(codec.decode(codec.encode(document)).document.find('a').text, '<中文>&\nend');
});

test('duplicate IDs, malformed XML and unsupported features fail explicitly', () => {
  const codec = new SvgCodec();
  const invalid = [
    '', '<html/>', '<svg><rect></svg>', '<svg><rect id="x"/><g id="x"/></svg>',
    '<svg id="x"><rect id="x"/></svg>', '<svg><rect id=""/></svg>',
    '<svg><rect id="bad id"/></svg>', '<svg><path id="p" d="M 0 0"/></svg>',
    '<svg><g id="g" transform="translate(10,20)"/></svg>',
    '<svg><rect id="r" style="fill:red"/></svg>', '<svg><text id="t"><tspan>nested</tspan></text></svg>',
    '<svg width="100%"/>', '<svg width="10px"/>', '<svg viewBox="0 0 1"/>', '<svg viewBox="0 0 -1 2"/>',
    '<svg xmlns="https://example.com/foreign"/>', '<svg><g xmlns="https://example.com/foreign"/></svg>',
    '<svg>lost text</svg>', '<svg><g id="g">lost text</g></svg>', '<svg><rect width="-1"/></svg>',
    '<!DOCTYPE svg [<!ENTITY x "example">]><svg/>', '<?xml-stylesheet href="x.css"?><svg/>',
    '<svg><text id="t">&unknown;</text></svg>', '<svg><text id="t">\u0001</text></svg>',
  ];
  for (const xml of invalid) assert.throws(() => codec.decode(xml), Error, xml);
});

test('provided external SVG example imports seven elements with one warning', () => {
  const { document, warnings } = new SvgCodec().decode(`<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
      <text id="t1" x="10" y="290">imported</text>
      <circle id="c1" cx="50" cy="50" r="10"/>
      <g id="g1"><rect id="r2" width="10" height="10"/><circle id="c2" cx="5" cy="5" r="2"/></g>
      <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
    </svg>`);
  assert.equal(document.count, 7);
  assert.deepEqual(warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.equal(document.parentLabel(document.find('r2')), 'g#g1');
});
