import { CalendarDay, CalendarEvent } from '@/types/calendar';

export function getDaysInMonth(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: CalendarDay[] = [];

  // Add days from previous month
  const startingDayOfWeek = firstDay.getDay();
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    const dateStr = formatDateToISO(date);
    days.push({
      date,
      dateStr,
      dayOfWeek: date.getDay(),
      dayName: date.toLocaleString('en-US', { weekday: 'short' }),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      events: []
    });
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = formatDateToISO(date);
    days.push({
      date,
      dateStr,
      dayOfWeek: date.getDay(),
      dayName: date.toLocaleString('en-US', { weekday: 'short' }),
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      events: []
    });
  }

  // Add days from next month
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    const dateStr = formatDateToISO(date);
    days.push({
      date,
      dateStr,
      dayOfWeek: date.getDay(),
      dayName: date.toLocaleString('en-US', { weekday: 'short' }),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      events: []
    });
  }

  return days;
}

export function getWeekDays(date: Date): CalendarDay[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = formatDateToISO(currentDate);

    days.push({
      date: currentDate,
      dateStr,
      dayOfWeek: currentDate.getDay(),
      dayName: currentDate.toLocaleString('en-US', { weekday: 'short' }),
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      events: []
    });
  }

  return days;
}

export function getYearMonths(year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(year, i, 1);
    return {
      month: i,
      year,
      monthName: monthDate.toLocaleString('en-US', { month: 'long' }),
      daysInMonth: new Date(year, i + 1, 0).getDate()
    };
  });
}

export function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatEventTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getTimeUntil(date: string, time: string): string {
  const eventDateTime = new Date(`${date}T${time}:00`);
  const now = new Date();
  const diff = eventDateTime.getTime() - now.getTime();

  if (diff < 0) return 'Past';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;

  return 'Now';
}

export function getEventColor(department?: string, eventId?: string): string {
  // Tasks get a distinct color scheme
  if (eventId?.startsWith('task-')) {
    return "var(--accent)";
  }

  const colorMap: Record<string, string> = {
    "Leadership": "#6366f1",
    "Writers' Block": "#f59e0b",
    "Design Lab": "#3b82f6",
    "Development": "#10b981",
    "Marketing": "#ec4899",
    "Public Relations": "#ec4899",
    "Other": "var(--mid)"
  };

  return colorMap[department || 'Other'] || 'var(--mid)';
}

export function getUpcomingEvents(events: CalendarEvent[], days: number = 7): CalendarEvent[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return events
    .filter(event => {
      const eventDateTime = new Date(`${event.date}T${event.time}:00`);
      return eventDateTime >= now && eventDateTime <= futureDate;
    })
    .sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.time}:00`).getTime();
      const bTime = new Date(`${b.date}T${b.time}:00`).getTime();
      return aTime - bTime;
    });
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}
