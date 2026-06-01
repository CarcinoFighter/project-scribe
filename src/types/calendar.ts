export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM format
  duration_minutes: number;
  meeting_link?: string;
  location?: string;
  assigned_to: string[]; // Array of user IDs
  created_by: string;
  department?: string;
  created_at: string;
  updated_at: string;
  // Task-specific metadata
  document_id?: string;
  document_type?: 'cancer_docs' | 'blogs' | 'survivor_stories';
  task_category?: string;
}

export interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number;
  dayName: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}
