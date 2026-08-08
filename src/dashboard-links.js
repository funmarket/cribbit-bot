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

function appCacheBust(env) {
  return (
    env.MINI_APP_VERSION ||
    env.RAILWAY_GIT_COMMIT_SHA ||
    env.VERCEL_GIT_COMMIT_SHA ||
    env.VERCEL_DEPLOYMENT_ID ||
    env.RAILWAY_DEPLOYMENT_ID ||
    null
  );
}

function dashboardUrl(env, chatId, view) {
  const appOrigin = miniAppOrigin(env);
  const apiOrigin = railwayApiOrigin(env);
  if (!appOrigin && !apiOrigin) return null;
  const base = `${appOrigin || apiOrigin}/app`;
  const params = new URLSearchParams({ chatId: String(chatId) });
  if (view) params.set('view', view);
  if (appOrigin && apiOrigin) params.set('apiBaseUrl', apiOrigin);
  const cacheBust = appCacheBust(env);
  if (cacheBust) params.set('v', cacheBust);
  return `${base}?${params}`;
}

function menuAppUrl(env) {
  const appOrigin = miniAppOrigin(env);
  if (!appOrigin) return null;
  const cacheBust = appCacheBust(env);
  return cacheBust ? `${appOrigin}/app?v=${encodeURIComponent(cacheBust)}` : `${appOrigin}/app`;
}

function mainAppUrl(botUsername) {
  const username = String(botUsername || '').replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  return `https://t.me/${username}?startapp`;
}

function dashboardReplyMarkup(env, { chatId, chatType, botUsername, view, text }) {
  if (chatType === 'private') {
    const url = dashboardUrl(env, chatId, view);
    return url ? { inline_keyboard: [[{ text, web_app: { url } }]] } : undefined;
  }

  const url = mainAppUrl(botUsername);
  return url ? { inline_keyboard: [[{ text, url }]] } : undefined;
}

module.exports = { dashboardUrl, menuAppUrl, mainAppUrl, dashboardReplyMarkup, miniAppOrigin, railwayApiOrigin, appCacheBust };
