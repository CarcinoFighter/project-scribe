export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'in_review';
  priority: 'low' | 'normal' | 'high';
  category: 'task' | 'article' | 'blog' | 'survivor_story' | 'awareness_post';
  due_date: string;
  department?: string;
  document_id?: string;
  created_at: string;
}
