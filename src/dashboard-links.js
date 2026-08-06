function origin(value, defaultProtocol = 'https:') {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `${defaultProtocol}//${value}`;
  return new URL(candidate).origin;
}

function miniAppOrigin(env) {
  return origin(env.MINI_APP_URL);
}

function railwayApiOrigin(env) {
  return origin(env.RAILWAY_PUBLIC_DOMAIN);
}

function dashboardUrl(env, chatId, view) {
  const appOrigin = miniAppOrigin(env);
  const apiOrigin = railwayApiOrigin(env);
  if (!appOrigin && !apiOrigin) return null;
  const base = `${appOrigin || apiOrigin}/app`;
  const params = new URLSearchParams({ chatId: String(chatId) });
  if (view) params.set('view', view);
  if (appOrigin && apiOrigin) params.set('apiBaseUrl', apiOrigin);
  return `${base}?${params}`;
}

function menuAppUrl(env) {
  const appOrigin = miniAppOrigin(env);
  const apiOrigin = railwayApiOrigin(env);
  if (!appOrigin || !apiOrigin) return null;
  const params = new URLSearchParams({ apiBaseUrl: apiOrigin });
  return `${appOrigin}/app?${params}`;
}

module.exports = { dashboardUrl, menuAppUrl, miniAppOrigin, railwayApiOrigin };
