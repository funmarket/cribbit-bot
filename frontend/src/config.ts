function normalizedOrigin(value?: string | null) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.origin : "";
  } catch {
    return "";
  }
}

export function resolveApiBaseUrl(
  requestedValue?: string | null,
  pageOrigin?: string | null,
) {
  return normalizedOrigin(requestedValue) || normalizedOrigin(pageOrigin);
}

export function preferredHouseId(
  houses: Array<{ chatId: string | number }> = [],
  activeChatId?: string | number | null,
) {
  const active = activeChatId == null ? "" : String(activeChatId);
  if (active && houses.some((house) => String(house.chatId) === active))
    return active;
  return houses.length === 1 ? String(houses[0].chatId) : null;
}

window.CribbitAppConfig = {
  normalizedOrigin,
  resolveApiBaseUrl,
  preferredHouseId,
};
