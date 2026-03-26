export function getTodayStr() { 
  return new Date().toISOString().split('T')[0]; 
}

export function getWeekWindow() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US',{weekday:'short'}), isToday: i === 6 };
  });
}

export function getGreeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const first = name?.split(' ')[0];
  return `Good ${part}${first ? `, ${first}` : ''}`;
}

export function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function countWords(text: string) { 
  const t = text.trim(); 
  return t ? t.split(/\s+/).length : 0; 
}

export function excerptFrom(md: string) {
  for (const line of md.split('\n')) {
    const c = line.replace(/^#{1,6}\s+/,'').replace(/[*_`~[\]]/g,'').trim();
    if (c.length > 20) return c.slice(0,140)+(c.length>140?'…':'');
  }
  return '';
}

export function fmtDate(iso: string) { 
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}); 
}

export function fmtWords(n: number) { 
  return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); 
}
