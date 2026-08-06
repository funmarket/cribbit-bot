(function exposeFormSubmission(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CribbitForms = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  async function runFormSubmission({ form, dialog, submitButton, save, onError }) {
    if (!form || typeof save !== 'function') throw new TypeError('A form and save function are required.');
    if (submitButton?.disabled) return false;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute?.('aria-busy', 'true');
    }
    form.setAttribute?.('aria-busy', 'true');

    try {
      try {
        await save();
      } catch (error) {
        onError?.(error);
        return false;
      }

      form.reset();
      dialog?.close();
      return true;
    } finally {
      form.removeAttribute?.('aria-busy');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute?.('aria-busy');
      }
    }
  }

  return { runFormSubmission };
}));
