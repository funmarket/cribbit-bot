function parseChoreInput(input) {
  let task = String(input || '').trim(), assignedTo = null, dueDate = null;
  const dueMatch = task.match(/\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i); if (dueMatch) { dueDate = dueMatch[1].toLowerCase(); task = task.slice(0, dueMatch.index).trim(); }
  const usernameMatch = task.match(/\s+(@[A-Za-z0-9_]{2,})$/); if (usernameMatch) { assignedTo = usernameMatch[1]; task = task.slice(0, usernameMatch.index).trim(); }
  else { const nameMatch = task.match(/\s+for\s+([\p{L}][\p{L}\p{M}'-]*(?:\s+[\p{L}][\p{L}\p{M}'-]*){0,2})$/iu); if (nameMatch) { assignedTo = nameMatch[1].trim(); task = task.slice(0, nameMatch.index).trim(); } }
  if (!task) return null; return { task, assignedTo, dueDate };
}
module.exports = { parseChoreInput };
