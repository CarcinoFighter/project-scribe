export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'ready_for_proofreading' | 'proofreading' | 'ready_for_upload' | 'in_review' | 'done';
  priority: 'low' | 'normal' | 'high';
  proofreader_id?: string;
  category: 'task' | 'article' | 'blog' | 'survivor_story' | 'awareness_post';
  due_date: string;
  department?: string;
  document_id?: string;
  created_at: string;
}
