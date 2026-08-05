const crypto = require('crypto');

function validateTelegramInitData(initData, botToken, maxAgeSeconds = 3600) {
  if (!initData || !botToken) throw Object.assign(new Error('Telegram authentication is required.'), { statusCode: 401 });
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw Object.assign(new Error('Telegram authentication is incomplete.'), { statusCode: 401 });
  params.delete('hash');
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const valid = expected.length === hash.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  if (!valid) throw Object.assign(new Error('Telegram authentication could not be verified.'), { statusCode: 401 });
  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || Math.abs(Date.now() / 1000 - authDate) > maxAgeSeconds) {
    throw Object.assign(new Error('Your Telegram session has expired. Reopen Cribbit from the bot.'), { statusCode: 401 });
  }
  try {
    const user = JSON.parse(params.get('user') || 'null');
    if (!user?.id) throw new Error('missing user');
    return user;
  } catch {
    throw Object.assign(new Error('Telegram user information is invalid.'), { statusCode: 401 });
  }
}

module.exports = { validateTelegramInitData };
