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
  getValue: () => string;
  applyRemotePatch: (patch: string) => void;
}

export interface DocumentStats {
  words: number;
  chars: number;
  readingTime: number;
  lines: number;
  sentences: number;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'bottom' | 'top' | 'left' | 'right';
}

export interface Collaborator {
  id: string;
  name: string;
  avatar_url: string | null;
  cursor: { line: number; col: number } | null;
  lastSeen: number;
}
