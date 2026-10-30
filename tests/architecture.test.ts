import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

test('source modules obey documented dependencies and one class per file', () => {
  const root = fileURLToPath(new URL('../src', import.meta.url));
  const allowed: Record<string, readonly string[]> = {
    model: ['model'], application: ['application', 'model'], commands: ['commands', 'application', 'model'],
    cli: ['cli', 'commands', 'application', 'model'], infrastructure: ['infrastructure', 'application', 'model'],
  };
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
    const file = join(entry.parentPath, entry.name);
    const source = readFileSync(file, 'utf8');
    const module = relative(root, file).split(sep)[0]!;
    const classes = [...source.matchAll(/export (?:abstract )?class (\w+)/g)];
    assert.ok(classes.length <= 1, file);
    if (classes.length) assert.equal(classes[0]![1], basename(file, '.ts'));
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
      const dependency = match[1]!;
      if (!dependency.startsWith('.')) {
        if (module === 'model') assert.fail(`model has external dependency: ${dependency}`);
        continue;
      }
      const targetModule = relative(root, resolve(dirname(file), dependency)).split(sep)[0]!;
      if (allowed[module]) assert.ok(allowed[module]!.includes(targetModule), `${module} -> ${targetModule}: ${file}`);
    }
  }
});
