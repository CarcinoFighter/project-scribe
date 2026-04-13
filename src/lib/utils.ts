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

export function getCollaboratorColor(id: string) {
  const colors = [
    '#f87171', // red
    '#fb923c', // orange
    '#fbbf24', // amber
    '#a3e635', // lime
    '#4ade80', // green
    '#2dd4bf', // teal
    '#22d3ee', // cyan
    '#60a5fa', // blue
    '#818cf8', // indigo
    '#a78bfa', // violet
    '#c084fc', // purple
    '#f472b6', // pink
  ];
  if (!id) return colors[0];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Converts diff-match-patch diffs into CodeMirror 6 ChangeSpec objects.
 * This allows applying only the specific changes to the document, 
 * preserving cursor position and undo history.
 */
export function getChangesFromDiffs(diffs: [number, string][]) {
  const changes: { from: number; to: number; insert: string }[] = [];
  let pos = 0;

  for (let i = 0; i < diffs.length; i++) {
    const [op, text] = diffs[i];
    
    if (op === 0) { // EQUAL
      pos += text.length;
    } else if (op === -1) { // DELETE
      // Check if the NEXT operation is an INSERT at the same position
      if (i + 1 < diffs.length && diffs[i+1][0] === 1) {
        const insertText = diffs[i+1][1];
        changes.push({ from: pos, to: pos + text.length, insert: insertText });
        pos += text.length;
        i++; // Skip the insert
      } else {
        changes.push({ from: pos, to: pos + text.length, insert: '' });
        pos += text.length;
      }
    } else if (op === 1) { // INSERT
      // Check if the NEXT operation is a DELETE at the same position
      if (i + 1 < diffs.length && diffs[i+1][0] === -1) {
        const delText = diffs[i+1][1];
        changes.push({ from: pos, to: pos + delText.length, insert: text });
        pos += delText.length;
        i++; // Skip the delete
      } else {
        changes.push({ from: pos, to: pos, insert: text });
      }
    }
  }
  return changes;
}
