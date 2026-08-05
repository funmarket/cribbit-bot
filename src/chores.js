function parseChoreInput(input) {
  let task = String(input || '').trim();
  let assignedTo = null;

  const usernameMatch = task.match(/\s+(@[A-Za-z0-9_]{2,})$/);
  if (usernameMatch) {
    assignedTo = usernameMatch[1];
    task = task.slice(0, usernameMatch.index).trim();
  } else {
    const nameMatch = task.match(/\s+for\s+([\p{L}][\p{L}\p{M}'-]*(?:\s+[\p{L}][\p{L}\p{M}'-]*){0,2})$/iu);
    if (nameMatch) {
      assignedTo = nameMatch[1].trim();
      task = task.slice(0, nameMatch.index).trim();
    }
  }

  if (!task) return null;
  return { task, assignedTo };
}

module.exports = { parseChoreInput };
