import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

function getChangesFromDiffs(diffs) {
  const changes = [];
  let pos = 0;

  for (let i = 0; i < diffs.length; i++) {
    const [op, text] = diffs[i];
    
    if (op === 0) {
      pos += text.length;
    } else if (op === -1) {
      if (i + 1 < diffs.length && diffs[i+1][0] === 1) {
        const insertText = diffs[i+1][1];
        changes.push({ from: pos, to: pos + text.length, insert: insertText });
        pos += text.length;
        i++;
      } else {
        changes.push({ from: pos, to: pos + text.length, insert: '' });
        pos += text.length;
      }
    } else if (op === 1) {
      if (i + 1 < diffs.length && diffs[i+1][0] === -1) {
        const delText = diffs[i+1][1];
        changes.push({ from: pos, to: pos + delText.length, insert: text });
        pos += delText.length;
        i++;
      } else {
        changes.push({ from: pos, to: pos, insert: text });
      }
    }
  }
  return changes;
}

const oldText = "hello world";
const newText = "hello amazing world!";

const diffs = dmp.diff_main(oldText, newText);
dmp.diff_cleanupSemantic(diffs);
console.log("Diffs:", diffs);

const changes = getChangesFromDiffs(diffs);
console.log("Changes:", changes);
