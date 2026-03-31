import fs from 'fs';
import path from 'path';
import { countWords, excerptFrom } from './utils';

const DRAFTS_DIR = path.join(process.cwd(), 'drafts');

export interface LocalDoc {
  id: string;
  type: 'blogs' | 'survivor_stories' | 'cancer_docs';
  title: string;
  excerpt: string;
  words: number;
  status: 'published' | 'review' | 'draft';
  date: string;
  readTime: number;
  tags: string[];
  starred: boolean;
  content: string;
}

export function ensureDraftsDir() {
  if (!fs.existsSync(DRAFTS_DIR)) {
    fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  }
}

export function getLocalDocs(): LocalDoc[] {
  ensureDraftsDir();
  const files = fs.readdirSync(DRAFTS_DIR);
  
  return files
    .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
    .map(file => {
      const filePath = path.join(DRAFTS_DIR, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const words = countWords(content);
      const excerpt = excerptFrom(content);
      
      // Basic metadata extraction from filename or content
      // Filename format: id_type_status_title.md (optional)
      // For now, let's use the filename as id and title if not specified
      const id = file.replace(/\.(md|txt)$/, '');
      const parts = id.split('_');
      
      let type: any = 'cancer_docs';
      let status: any = 'draft';
      let title = id;

      if (parts.length >= 3) {
        // If we follow a convention like: type_status_title
        type = ['blogs', 'survivor_stories', 'cancer_docs'].includes(parts[0]) ? parts[0] : 'cancer_docs';
        status = ['published', 'review', 'draft'].includes(parts[1]) ? parts[1] : 'draft';
        title = parts.slice(2).join(' ').replace(/-/g, ' ');
      }

      return {
        id,
        type,
        title,
        excerpt,
        words,
        status,
        date: stats.mtime.toISOString().split('T')[0],
        readTime: Math.max(1, Math.round(words / 200)),
        tags: [],
        starred: false,
        content
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function saveLocalDoc(doc: Omit<LocalDoc, 'date' | 'readTime' | 'excerpt' | 'words'>) {
  ensureDraftsDir();
  const filename = `${doc.type}_${doc.status}_${doc.title.replace(/\s+/g, '-')}.md`;
  const filePath = path.join(DRAFTS_DIR, filename);
  fs.writeFileSync(filePath, doc.content, 'utf8');
  return filename.replace(/\.md$/, '');
}

export function loadLocalDoc(id: string): LocalDoc | null {
  ensureDraftsDir();
  const filePath = path.join(DRAFTS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return null;

  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const words = countWords(content);
  
  const parts = id.split('_');
  let type: any = 'cancer_docs';
  let status: any = 'draft';
  let title = id;

  if (parts.length >= 3) {
    type = parts[0];
    status = parts[1];
    title = parts.slice(2).join(' ').replace(/-/g, ' ');
  }

  return {
    id,
    type,
    title,
    excerpt: excerptFrom(content),
    words,
    status,
    date: stats.mtime.toISOString().split('T')[0],
    readTime: Math.max(1, Math.round(words / 200)),
    tags: [],
    starred: false,
    content
  };
}
