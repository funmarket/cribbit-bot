const { modeNames, modeDefinition, normalizeMode } = require('./modes');

function modePickerOptions(selectedMode = normalizeMode()) {
  const normalizedSelected = normalizeMode(selectedMode);
  return modeNames().map((mode) => ({
    ...mode,
    selected: mode.key === normalizedSelected,
    badge: `${mode.emoji} ${mode.name}`,
  }));
}

function dashboardModePicker(selectedMode = normalizeMode()) {
  const selected = normalizeMode(selectedMode);
  return {
    selected,
    options: modePickerOptions(selected),
  };
}

function setupModePrompt(selectedMode = normalizeMode()) {
  const picker = dashboardModePicker(selectedMode);
  return [
    'Choose your crib mode',
    '',
    ...picker.options.map((mode) => `${mode.badge}${mode.selected ? ' ✓' : ''} — ${mode.tagline}`),
    '',
    `Current: ${modeDefinition(picker.selected).emoji} ${modeDefinition(picker.selected).name}`,
    'Tap a badge to switch the vibe for this crib.',
  ].join('\n');
}

function setupModeKeyboard(selectedMode = normalizeMode()) {
  const options = dashboardModePicker(selectedMode).options;
  const rows = [];
  for (let index = 0; index < options.length; index += 2) {
    const chunk = options.slice(index, index + 2);
    rows.push(chunk.map((mode) => ({
      text: `${mode.badge}${mode.selected ? ' ✓' : ''}`,
      callback_data: `setup:mode:${mode.key}`,
    })));
  }
  return { inline_keyboard: rows };
}

module.exports = {
  dashboardModePicker,
  modePickerOptions,
  setupModePrompt,
  setupModeKeyboard,
};
