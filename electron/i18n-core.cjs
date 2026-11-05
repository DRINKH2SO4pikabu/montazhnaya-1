"use strict";

const INTERNATIONAL_LOCALES = Object.freeze([
  { code: "de", name: "German", nativeName: "Deutsch", status: "preview", direction: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", status: "preview", direction: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", status: "preview", direction: "ltr" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", status: "preview", direction: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", status: "preview", direction: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", status: "preview", direction: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", status: "preview", direction: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", status: "preview", direction: "ltr" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", status: "preview", direction: "ltr" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", status: "preview", direction: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", status: "preview", direction: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", status: "preview", direction: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", status: "preview", direction: "rtl" },
  { code: "he", name: "Hebrew", nativeName: "עברית", status: "preview", direction: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", status: "preview", direction: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", status: "preview", direction: "ltr" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", status: "preview", direction: "ltr" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", status: "preview", direction: "ltr" },
  { code: "cs", name: "Czech", nativeName: "Čeština", status: "preview", direction: "ltr" },
  { code: "ro", name: "Romanian", nativeName: "Română", status: "preview", direction: "ltr" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", status: "preview", direction: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", status: "preview", direction: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", status: "preview", direction: "ltr" },
  { code: "th", name: "Thai", nativeName: "ไทย", status: "preview", direction: "ltr" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақша", status: "preview", direction: "ltr" },
  { code: "uz", name: "Uzbek (Latin)", nativeName: "Oʻzbekcha", status: "preview", direction: "ltr" },
  { code: "uz-Cyrl", name: "Uzbek (Cyrillic)", nativeName: "Ўзбекча (кирилл)", status: "preview", direction: "ltr" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", status: "preview", direction: "ltr" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", status: "preview", direction: "ltr" },
  { code: "tk", name: "Turkmen", nativeName: "Türkmençe", status: "preview", direction: "ltr" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycanca", status: "preview", direction: "ltr" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", status: "preview", direction: "ltr" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ", status: "preview", direction: "ltr" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская", status: "preview", direction: "ltr" }
]);

const AVAILABLE_LOCALES = Object.freeze([
  { code: "ru", name: "Russian", nativeName: "Русский", status: "available", direction: "ltr" },
  { code: "en", name: "English", nativeName: "English", status: "available", direction: "ltr" },
  ...INTERNATIONAL_LOCALES
].map(item => Object.freeze(item)));

const PLANNED_LOCALES = Object.freeze([]);
const RTL_LANGUAGES = new Set(["ar", "fa", "he", "ur", "ps", "sd", "ug", "yi"]);

function canonicalLocale(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try { return Intl.getCanonicalLocales(value.trim().replace(/_/g, "-"))[0] || ""; }
  catch (_) { return ""; }
}

function primaryLanguage(value) {
  const canonical = canonicalLocale(value);
  return canonical ? canonical.split("-")[0].toLowerCase() : "";
}

function resolveLocale(preference, systemLocale, available = AVAILABLE_LOCALES) {
  const requested = preference === "auto" || !preference ? systemLocale : preference;
  const canonical = canonicalLocale(requested) || "ru";
  const exact = available.find(item => item.code.toLowerCase() === canonical.toLowerCase());
  if (exact) return exact.code;
  const primary = primaryLanguage(canonical);
  const parts = canonical.split("-");
  const script = parts.find(part => /^[A-Z][a-z]{3}$/.test(part));
  const scriptMatch = script && available.find(item =>
    item.code.toLowerCase() === `${primary}-${script}`.toLowerCase()
  );
  if (scriptMatch) return scriptMatch.code;
  const baseMatch = available.find(item => item.code.toLowerCase() === primary) ||
    available.find(item => item.code.split("-")[0].toLowerCase() === primary);
  return baseMatch ? baseMatch.code : "ru";
}

function directionForLocale(locale) {
  return RTL_LANGUAGES.has(primaryLanguage(locale)) ? "rtl" : "ltr";
}

function sanitizeMessages(messages) {
  if (!messages || typeof messages !== "object" || Array.isArray(messages)) return Object.freeze({});
  const result = Object.create(null);
  for (const [key, value] of Object.entries(messages)) {
    if (typeof key === "string" && typeof value === "string" && key.length <= 2000 && value.length <= 4000) {
      result[key] = value;
    }
  }
  return Object.freeze(result);
}

function compileMessagePatterns(messages) {
  const patterns = [];
  for (const [key, value] of Object.entries(messages || {})) {
    if (!/\{[a-zA-Z][a-zA-Z0-9_]*\}/.test(key) || typeof value !== "string") continue;
    const names = [];
    let source = "^";
    let cursor = 0;
    const token = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
    let match;
    while ((match = token.exec(key))) {
      source += key.slice(cursor, match.index).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(.+?)";
      names.push(match[1]);
      cursor = match.index + match[0].length;
    }
    source += key.slice(cursor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$";
    patterns.push({ regex: new RegExp(source), names, value });
  }
  return patterns;
}

function translate(source, messages, patterns = null) {
  if (typeof source !== "string") return source;
  const map = messages && typeof messages === "object" ? messages : null;
  if (map && Object.prototype.hasOwnProperty.call(map, source)) return map[source];
  const compiled = patterns || compileMessagePatterns(map);
  for (const pattern of compiled) {
    const match = pattern.regex.exec(source);
    if (!match) continue;
    let translated = pattern.value;
    pattern.names.forEach((name, index) => {
      translated = translated.replace(new RegExp("\\{" + name + "\\}", "g"), match[index + 1]);
    });
    return translated;
  }
  return source;
}


const PLURAL_CATEGORIES = new Set(["zero", "one", "two", "few", "many", "other"]);

function sanitizeSemanticLocaleData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return Object.freeze({ nouns: Object.freeze({}), cases: Object.freeze({}), genitive: Object.freeze({}), messages: Object.freeze({}), reviewStatus: "unreviewed" });
  const nouns = Object.create(null);
  for (const [nounKey, rawForms] of Object.entries(data)) {
    if (["messages", "reviewStatus", "genitive", "cases"].includes(nounKey)) continue;
    if (!rawForms || typeof rawForms !== "object" || Array.isArray(rawForms)) continue;
    const forms = Object.create(null);
    for (const [category, phrase] of Object.entries(rawForms)) {
      if (PLURAL_CATEGORIES.has(category) && typeof phrase === "string" && phrase.length <= 160) forms[category] = phrase;
    }
    if (Object.keys(forms).length) nouns[nounKey] = Object.freeze(forms);
  }
  const cases = Object.create(null);
  const rawCases = data.cases && typeof data.cases === "object" && !Array.isArray(data.cases) ? data.cases : {};
  const legacyGenitive = data.genitive && typeof data.genitive === "object" && !Array.isArray(data.genitive) ? data.genitive : {};
  for (const caseName of new Set([...Object.keys(rawCases), ...(Object.keys(legacyGenitive).length ? ["genitive"] : [])])) {
    const rawCase = rawCases[caseName] || (caseName === "genitive" ? legacyGenitive : null);
    if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) continue;
    const caseNouns = Object.create(null);
    for (const [nounKey, rawForms] of Object.entries(rawCase)) {
      if (!rawForms || typeof rawForms !== "object" || Array.isArray(rawForms)) continue;
      const forms = Object.create(null);
      for (const [category, phrase] of Object.entries(rawForms)) {
        if (PLURAL_CATEGORIES.has(category) && typeof phrase === "string" && phrase.length <= 160) forms[category] = phrase;
      }
      if (Object.keys(forms).length) caseNouns[nounKey] = Object.freeze(forms);
    }
    if (Object.keys(caseNouns).length) cases[caseName] = Object.freeze(caseNouns);
  }
  const genitive = cases.genitive || Object.freeze(Object.create(null));
  const messages = Object.create(null);
  if (data.messages && typeof data.messages === "object" && !Array.isArray(data.messages)) {
    for (const [key, value] of Object.entries(data.messages)) {
      if (typeof key === "string" && key.length <= 160 && typeof value === "string" && value.length <= 2000) messages[key] = value;
    }
  }
  return Object.freeze({ nouns: Object.freeze(nouns), cases: Object.freeze(cases), genitive, messages: Object.freeze(messages), reviewStatus: typeof data.reviewStatus === "string" ? data.reviewStatus : "unreviewed" });
}

function pluralCategory(locale, value, type = "cardinal") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "other";
  try { return new Intl.PluralRules(canonicalLocale(locale) || "en", { type }).select(number); }
  catch (_) { return number === 1 ? "one" : "other"; }
}

function formatNumber(value, locale, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  try { return new Intl.NumberFormat(canonicalLocale(locale) || "en", options).format(number); }
  catch (_) { return new Intl.NumberFormat("en", options).format(number); }
}

function formatDate(value, locale, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try { return new Intl.DateTimeFormat(canonicalLocale(locale) || "en", options).format(date); }
  catch (_) { return new Intl.DateTimeFormat("en", options).format(date); }
}

function formatTime(value, locale, options = {}) {
  return formatDate(value, locale, { hour: "2-digit", minute: "2-digit", ...options });
}

function formatUnit(value, unit, locale, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  const allowed = new Set(["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "second", "minute", "hour", "day", "week", "month", "year", "percent"]);
  if (!allowed.has(unit)) return formatNumber(number, locale, options);
  try {
    return new Intl.NumberFormat(canonicalLocale(locale) || "en", {
      style: "unit", unit, unitDisplay: "short", ...options
    }).format(number);
  } catch (_) { return formatNumber(number, locale, options); }
}

function formatByteSize(value, locale, options = {}) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return `${formatNumber(0, locale)} B`;
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let amount = bytes;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) { amount /= 1024; unitIndex++; }
  const digits = unitIndex === 0 ? 0 : (options.maximumFractionDigits ?? 1);
  return `${formatNumber(amount, locale, { minimumFractionDigits: 0, maximumFractionDigits: digits })} ${units[unitIndex]}`;
}

function formatCountNoun(data, locale, nounKey, count, caseName = "nominative") {
  const number = Number(count);
  if (!Number.isFinite(number)) return String(count ?? "");
  const requestedCase = caseName && caseName !== "nominative" ? caseName : "";
  const caseForms = requestedCase && data && data.cases && data.cases[requestedCase] && data.cases[requestedCase][nounKey];
  const source = caseForms || (requestedCase === "genitive" && data && data.genitive && data.genitive[nounKey]) || (data && data.nouns && data.nouns[nounKey]);
  const category = pluralCategory(locale, number);
  const noun = source && (source[category] || source.other || source.one) || nounKey;
  return `${formatNumber(number, locale, { maximumFractionDigits: 0 })}\u00a0${noun}`;
}

function formatSemanticMessage(data, locale, key, values = {}) {
  const template = data && data.messages && data.messages[key];
  if (typeof template !== "string") return key;
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return token;
    const value = values[name];
    if (typeof value === "number") return formatNumber(value, locale, { maximumFractionDigits: 2 });
    return String(value == null ? "" : value);
  });
}

function formatRelativeTime(value, unit, locale, options = { numeric: "auto" }) {
  const amount = Number(value);
  const allowed = new Set(["second", "minute", "hour", "day", "week", "month", "quarter", "year"]);
  if (!Number.isFinite(amount) || !allowed.has(unit)) return "";
  try { return new Intl.RelativeTimeFormat(canonicalLocale(locale) || "en", options).format(amount, unit); }
  catch (_) { return `${formatNumber(amount, locale)} ${unit}`; }
}

function formatDuration(seconds, locale, options = {}) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "—";
  const precision = Number.isInteger(options.fractionDigits) ? Math.max(0, Math.min(3, options.fractionDigits)) : 1;
  const scale = 10 ** precision;
  const rounded = Math.round(value * scale) / scale;
  const totalMinutes = Math.floor(rounded / 60);
  const remainder = rounded - totalMinutes * 60;
  const minuteText = formatNumber(totalMinutes, locale, { minimumIntegerDigits: 2, maximumFractionDigits: 0 });
  const secondText = formatNumber(remainder, locale, { minimumIntegerDigits: 2, minimumFractionDigits: precision, maximumFractionDigits: precision });
  return `${minuteText}:${secondText}`;
}

module.exports = {
  AVAILABLE_LOCALES,
  INTERNATIONAL_LOCALES,
  PLANNED_LOCALES,
  canonicalLocale,
  primaryLanguage,
  resolveLocale,
  directionForLocale,
  sanitizeMessages,
  sanitizeSemanticLocaleData,
  pluralCategory,
  formatNumber,
  formatUnit,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatByteSize,
  formatCountNoun,
  formatSemanticMessage,
  formatDuration,
  compileMessagePatterns,
  translate
};
