(function attachCribbitAppConfig(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CribbitAppConfig = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCribbitAppConfig() {
  function normalizedOrigin(value) {
    if (!value) return '';
    try {
      const parsed = new URL(value);
      if (!['https:', 'http:'].includes(parsed.protocol)) return '';
      return parsed.origin;
    } catch {
      return '';
    }
  }

  function resolveApiBaseUrl(requestedValue, pageOrigin) {
    return normalizedOrigin(requestedValue) || normalizedOrigin(pageOrigin);
  }

  function preferredHouseId(houses, activeChatId) {
    const available = Array.isArray(houses) ? houses : [];
    const active = activeChatId == null ? '' : String(activeChatId);
    if (active && available.some((house) => String(house.chatId) === active)) return active;
    return available.length === 1 ? String(available[0].chatId) : null;
  }

  return { normalizedOrigin, resolveApiBaseUrl, preferredHouseId };
});
