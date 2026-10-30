export class Tokenizer {
  tokenize(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '';
    let active = false;
    let quoted = false;
    let closed = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (quoted) {
        if (char === '"') { quoted = false; closed = true; }
        else if (char === '\\' && ['"', '\\'].includes(line[i + 1] ?? '')) token += line[++i]!;
        else token += char;
      } else if (/\s/u.test(char)) {
        if (active) { tokens.push(token); token = ''; active = false; closed = false; }
      } else if (char === '"') {
        if (active) throw new Error('quotes must surround a complete argument');
        quoted = true; active = true;
      } else {
        if (closed) throw new Error('expected whitespace after closing quote');
        active = true; token += char;
      }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (active) tokens.push(token);
    return tokens;
  }
}
