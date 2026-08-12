function isValidButtonId(id) {
  return typeof id === 'string' && /^BTN_[A-Za-z0-9_-]{1,32}$/.test(id);
}

function isValidAction(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.label !== 'string' || data.label.length > 80) return false;

  switch (data.type) {
    case 'unassigned':
      return true;
    case 'text':
      return typeof data.text === 'string' && data.text.length <= 5000;
    case 'hotkey':
      return typeof data.key === 'string' &&
        data.key.length <= 40 &&
        (!data.modifiers || (Array.isArray(data.modifiers) && data.modifiers.every(m => typeof m === 'string' && m.length <= 20)));
    case 'game':
      return typeof data.key === 'string' && /^F(1[3-9]|2[0-4])$/.test(data.key);
    case 'script':
      return typeof data.script === 'string' && data.script.length <= 10000;
    default:
      return false;
  }
}

module.exports = { isValidButtonId, isValidAction };
