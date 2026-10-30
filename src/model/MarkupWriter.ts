export interface MarkupWriter {
  element(tag: string, attributes: Readonly<Record<string, string>>, text: string | undefined, children: readonly string[]): string;
}
