export class Validation {
  static number(value: string | number, name = 'number', minimum = -Infinity): number {
    const input = String(value);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(input)) {
      throw new Error(`invalid ${name}: ${input}`);
    }
    const result = Number(input);
    if (!Number.isFinite(result) || result < minimum) throw new Error(`invalid ${name}: ${input}`);
    return result;
  }

  static id(value: string): string {
    if (!value || /[\s\u0000-\u001f]/u.test(value)) throw new Error(`invalid id: ${value}`);
    return value;
  }

  static xmlText(value: string): string {
    if (/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(value)) {
      throw new Error('invalid XML character');
    }
    return value;
  }

  static factor(value: number): void {
    if (!Number.isFinite(value) || value <= 0) throw new Error('scale factor must be positive');
  }
}
