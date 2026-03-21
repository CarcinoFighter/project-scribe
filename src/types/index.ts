export type ViewMode = 'editor' | 'split' | 'preview';

export interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  lineNumber: number;
  id: string;
}

export interface EditorAPI {
  wrapSelection: (before: string, after: string, placeholder?: string) => void;
  insertAtCursor: (text: string) => void;
  prefixLines: (prefix: string, numbered?: boolean) => void;
  openSearch: () => void;
  scrollToLine: (lineNumber: number) => void;
  focus: () => void;
}

export interface DocumentStats {
  words: number;
  chars: number;
  readingTime: number;
  lines: number;
}
