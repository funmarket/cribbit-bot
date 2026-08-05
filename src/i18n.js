const en = require('../locales/en.json');
const fr = require('../locales/fr.json');
const ar = require('../locales/ar.json');

const SUPPORTED_LOCALES = ['en', 'fr', 'ar'];
const dictionaries = { en, fr, ar };
function normalizeLocale(value) {
  const base = String(value || '').trim().toLowerCase().replace('_', '-').split('-')[0];
  return SUPPORTED_LOCALES.includes(base) ? base : 'en';
}
function pluralKey(locale, key, count) {
  if (count === undefined || count === null) return key;
  const category = new Intl.PluralRules(normalizeLocale(locale)).select(Number(count));
  return dictionaries[normalizeLocale(locale)][`${key}.${category}`] ? `${key}.${category}` : dictionaries[normalizeLocale(locale)][`${key}.other`] ? `${key}.other` : key;
}
function translate(locale, key, variables = {}) {
  const normalized = normalizeLocale(locale); const resolvedKey = pluralKey(normalized, key, variables.count);
  const template = dictionaries[normalized][resolvedKey] ?? dictionaries.en[resolvedKey] ?? dictionaries.en[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? `{${name}}`);
}
function formatCurrency(locale, cents, currency = 'USD') { return new Intl.NumberFormat(normalizeLocale(locale), { style: 'currency', currency, maximumFractionDigits: 2 }).format((Number(cents) || 0) / 100); }
function localeName(locale, displayLocale = locale) { return new Intl.DisplayNames([normalizeLocale(displayLocale)], { type: 'language' }).of(normalizeLocale(locale)); }
function missingTranslationKeys() { const keys = Object.keys(en); return Object.fromEntries(['fr', 'ar'].map((locale) => [locale, keys.filter((key) => dictionaries[locale][key] === undefined)])); }

module.exports = { SUPPORTED_LOCALES, dictionaries, normalizeLocale, translate, formatCurrency, localeName, missingTranslationKeys };
