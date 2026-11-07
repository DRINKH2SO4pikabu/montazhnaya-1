(function (root) {
  "use strict";

  const STORAGE_KEY = "montazhnaya_locale_preference_v2";
  const LEGACY_STORAGE_KEY = "montazhnaya_locale_preference_v1";
  const localeManifest = root.MontazhnayaLocaleManifest || { available: [
    { code: "ru", nativeName: "Русский", direction: "ltr", file: "./locales/ru.js" },
    { code: "en", nativeName: "English", direction: "ltr", file: "./locales/en.js" }
  ], planned: [] };
  const AVAILABLE = Array.from(localeManifest.available || []);
  const PLANNED = Array.from(localeManifest.planned || []);
  const RTL = new Set(["ar", "fa", "he", "ur", "ps", "sd", "ug", "yi"]);
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const lastTranslatedText = new WeakMap();
  const lastTranslatedAttributes = new WeakMap();
  let currentLocale = "en";
  let currentPreference = "en";
  let activeMessages = Object.create(null);
  let activePatterns = [];
  let fallbackMessages = Object.create(null);
  let fallbackPatterns = [];
  let activeSemanticData = null;
  let fallbackSemanticData = null;
  let observer = null;
  let pendingNodes = new Set();
  let applyScheduled = false;
  const packLoads = new Map();

  function canonicalLocale(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try { return Intl.getCanonicalLocales(value.trim().replace(/_/g, "-"))[0] || ""; }
    catch (_) { return ""; }
  }

  function findAvailableLocale(tag) {
    const canonical = canonicalLocale(tag);
    if (!canonical) return null;
    const exact = AVAILABLE.find(item => item.code.toLowerCase() === canonical.toLowerCase());
    if (exact) return exact.code;
    const parts = canonical.split("-");
    const primary = parts[0].toLowerCase();
    const script = parts.find(part => /^[A-Z][a-z]{3}$/.test(part));
    if (script) {
      const scriptMatch = AVAILABLE.find(item =>
        item.code.toLowerCase() === `${primary}-${script}`.toLowerCase()
      );
      if (scriptMatch) return scriptMatch.code;
    }
    const byBase = AVAILABLE.find(item => item.code.toLowerCase() === primary) ||
      AVAILABLE.find(item => item.code.split("-")[0].toLowerCase() === primary);
    return byBase ? byBase.code : null;
  }

  function detectSystemLocale() {
    const candidates = [];
    try { if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages); } catch (_) {}
    try { if (navigator.language) candidates.push(navigator.language); } catch (_) {}
    for (const candidate of candidates) {
      const match = findAvailableLocale(candidate);
      if (match) return match;
    }
    return "en";
  }

  function resolvePreference(preference) {
    if (preference === "auto") return detectSystemLocale();
    if (!preference) return "en";
    return findAvailableLocale(preference) || "en";
  }

  function normalizePreference(preference) {
    if (preference === "auto") return "auto";
    if (!preference) return "en";
    return findAvailableLocale(preference) || "en";
  }

  function safeMessages(pack) {
    if (!pack || typeof pack !== "object" || !pack.messages || typeof pack.messages !== "object") return Object.create(null);
    const clean = Object.create(null);
    for (const [key, value] of Object.entries(pack.messages)) {
      if (typeof key === "string" && typeof value === "string" && key.length <= 2000 && value.length <= 4000) clean[key] = value;
    }
    return clean;
  }


  function compilePatterns(messages) {
    const patterns = [];
    for (const [key, value] of Object.entries(messages)) {
      if (!/\{[a-zA-Z][a-zA-Z0-9_]*\}/.test(key)) continue;
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

  function translateWith(source, messages, patterns) {
    if (Object.prototype.hasOwnProperty.call(messages, source)) return { found: true, value: messages[source] };
    // HTML often places a space before an inline counter/badge span. Match the
    // visible phrase without that formatting whitespace, then put it back.
    const normalizedSource = source.trim();
    if (!normalizedSource) return { found: false, value: source };
    const leadingWhitespace = source.match(/^\s*/u)?.[0] || "";
    const trailingWhitespace = source.match(/\s*$/u)?.[0] || "";
    if (Object.prototype.hasOwnProperty.call(messages, normalizedSource)) {
      return { found: true, value: leadingWhitespace + messages[normalizedSource] + trailingWhitespace };
    }
    for (const pattern of patterns) {
      const match = pattern.regex.exec(normalizedSource);
      if (!match) continue;
      let translated = pattern.value;
      pattern.names.forEach((name, index) => {
        translated = translated.replace(new RegExp("\\{" + name + "\\}", "g"), match[index + 1]);
      });
      return { found: true, value: leadingWhitespace + translated + trailingWhitespace };
    }
    return { found: false, value: source };
  }

  function translateSource(source) {
    const direct = translateWith(source, activeMessages, activePatterns);
    if (direct.found) return direct.value;
    // Russian is the source language, not a missing-translation locale.
    // Applying the English fallback to `ru` silently turned a Russian choice
    // into a mostly English UI. Preview locales may use English as a safe
    // interim fallback; Russian must preserve its source copy.
    if (currentLocale !== "en" && currentLocale !== "ru") {
      const fallback = translateWith(source, fallbackMessages, fallbackPatterns);
      if (fallback.found) return fallback.value;
    }
    return source;
  }

  function getPack(locale) {
    const packs = root.MontazhnayaLocalePacks || Object.create(null);
    return packs[locale] || packs.en || { direction: "ltr", messages: {} };
  }

  function messagesWithTooltipTranslations(locale, messages) {
    const tooltipTranslations = root.MontazhnayaTooltipTranslations;
    if (typeof tooltipTranslations?.resolveMessages === "function") {
      return tooltipTranslations.resolveMessages(locale, messages);
    }
    const translations = tooltipTranslations?.packs?.[locale];
    return translations ? Object.assign(Object.create(null), messages, translations) : messages;
  }

  const PLURAL_CATEGORIES = new Set(["zero", "one", "two", "few", "many", "other"]);

  function safeSemanticData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return Object.freeze({ nouns: Object.create(null), cases: Object.create(null), genitive: Object.create(null), messages: Object.create(null), reviewStatus: "unreviewed" });
    const nouns = Object.create(null);
    for (const [key, raw] of Object.entries(data)) {
      if (["messages", "genitive", "cases", "reviewStatus"].includes(key) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const forms = Object.create(null);
      for (const [category, value] of Object.entries(raw)) {
        if (PLURAL_CATEGORIES.has(category) && typeof value === "string" && value.length <= 160) forms[category] = value;
      }
      if (Object.keys(forms).length) nouns[key] = Object.freeze(forms);
    }
    const cases = Object.create(null);
    const rawCases = data.cases && typeof data.cases === "object" ? data.cases : {};
    const legacyGenitive = data.genitive && typeof data.genitive === "object" ? data.genitive : {};
    for (const caseName of new Set([...Object.keys(rawCases), ...(Object.keys(legacyGenitive).length ? ["genitive"] : [])])) {
      const rawCase = rawCases[caseName] || (caseName === "genitive" ? legacyGenitive : null);
      if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) continue;
      const caseNouns = Object.create(null);
      for (const [nounKey, rawForms] of Object.entries(rawCase)) {
        if (!rawForms || typeof rawForms !== "object" || Array.isArray(rawForms)) continue;
        const forms = Object.create(null);
        for (const [category, value] of Object.entries(rawForms)) {
          if (PLURAL_CATEGORIES.has(category) && typeof value === "string" && value.length <= 160) forms[category] = value;
        }
        if (Object.keys(forms).length) caseNouns[nounKey] = Object.freeze(forms);
      }
      if (Object.keys(caseNouns).length) cases[caseName] = Object.freeze(caseNouns);
    }
    const messages = Object.create(null);
    for (const [key, value] of Object.entries(data.messages || {})) {
      if (typeof key === "string" && key.length <= 160 && typeof value === "string" && value.length <= 2000) messages[key] = value;
    }
    return Object.freeze({ nouns: Object.freeze(nouns), cases: Object.freeze(cases), genitive: cases.genitive || Object.freeze(Object.create(null)), messages: Object.freeze(messages), reviewStatus: String(data.reviewStatus || "unreviewed") });
  }

  function semanticDataFor(locale) {
    const catalog = root.MontazhnayaSemanticCatalog || Object.create(null);
    return safeSemanticData(catalog[locale] || catalog.en);
  }

  // Keep the semantic API usable during early UI construction, before async pack initialization finishes.
  activeSemanticData = semanticDataFor("en");
  fallbackSemanticData = activeSemanticData;

  function pluralCategory(value, type) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "other";
    try { return new Intl.PluralRules(currentLocale || "en", { type: type || "cardinal" }).select(number); }
    catch (_) { return number === 1 ? "one" : "other"; }
  }

  function formatNumber(value, options) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value == null ? "" : value);
    try { return new Intl.NumberFormat(currentLocale || "en", options || {}).format(number); }
    catch (_) { return new Intl.NumberFormat("en", options || {}).format(number); }
  }

  function formatUnit(value, unit, options) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value == null ? "" : value);
    const allowed = new Set(["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "second", "minute", "hour", "day", "week", "month", "year", "percent"]);
    if (!allowed.has(unit)) return formatNumber(number, options);
    try { return new Intl.NumberFormat(currentLocale || "en", { style: "unit", unit, unitDisplay: "short", ...(options || {}) }).format(number); }
    catch (_) { return formatNumber(number, options); }
  }

  function formatDate(value, options) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    try { return new Intl.DateTimeFormat(currentLocale || "en", options || {}).format(date); }
    catch (_) { return new Intl.DateTimeFormat("en", options || {}).format(date); }
  }

  function formatTime(value, options) {
    return formatDate(value, Object.assign({ hour: "2-digit", minute: "2-digit" }, options || {}));
  }

  function formatBytes(value, options) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes === 0) return `${formatNumber(0)} B`;
    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    let amount = bytes, index = 0;
    while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index++; }
    return `${formatNumber(amount, { minimumFractionDigits: 0, maximumFractionDigits: index === 0 ? 0 : ((options && options.maximumFractionDigits) ?? 1) })} ${units[index]}`;
  }

  function pluralNoun(nounKey, count, caseName) {
    const number = Number(count);
    if (!Number.isFinite(number)) return String(count == null ? "" : count);
    const requestedCase = caseName && caseName !== "nominative" ? caseName : "";
    const source = requestedCase && ((activeSemanticData.cases && activeSemanticData.cases[requestedCase] && activeSemanticData.cases[requestedCase][nounKey]) || (requestedCase === "genitive" && activeSemanticData.genitive[nounKey]))
      ? ((activeSemanticData.cases && activeSemanticData.cases[requestedCase] && activeSemanticData.cases[requestedCase][nounKey]) || activeSemanticData.genitive[nounKey])
      : activeSemanticData.nouns[nounKey];
    const category = pluralCategory(number);
    const noun = source && (source[category] || source.other || source.one) || nounKey;
    return `${formatNumber(number, { maximumFractionDigits: 0 })}\u00a0${noun}`;
  }

  function t(key, values) {
    const args = values && typeof values === "object" ? values : {};
    const message = activeSemanticData.messages[key] ||
      (currentLocale !== "en" && fallbackSemanticData && fallbackSemanticData.messages[key]) || null;
    if (typeof message !== "string") return key;
    return message.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name) => {
      if (!Object.prototype.hasOwnProperty.call(args, name)) return token;
      const value = args[name];
      return typeof value === "number" ? formatNumber(value, { maximumFractionDigits: 2 }) : String(value == null ? "" : value);
    });
  }

  function tCount(key, nounKey, count, values) {
    return t(key, Object.assign({}, values || {}, { count, countLabel: pluralNoun(nounKey, count) }));
  }

  function formatDuration(seconds, options) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value < 0) return "—";
    const precision = Number.isInteger(options && options.fractionDigits) ? Math.max(0, Math.min(3, options.fractionDigits)) : 1;
    const scale = 10 ** precision;
    const rounded = Math.round(value * scale) / scale;
    const wholeMinutes = Math.floor(rounded / 60);
    const remainder = rounded - wholeMinutes * 60;
    const minuteText = formatNumber(wholeMinutes, { minimumIntegerDigits: 2, maximumFractionDigits: 0 });
    const secondText = formatNumber(remainder, { minimumIntegerDigits: 2, minimumFractionDigits: precision, maximumFractionDigits: precision });
    return `${minuteText}:${secondText}`;
  }

  function formatRelativeTime(value, unit, options) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "";
    try { return new Intl.RelativeTimeFormat(currentLocale || "en", options || { numeric: "auto" }).format(amount, unit); }
    catch (_) { return `${formatNumber(amount)} ${unit}`; }
  }

  function ensureLocalePack(locale) {
    const packs = root.MontazhnayaLocalePacks || (root.MontazhnayaLocalePacks = Object.create(null));
    if (packs[locale]) {
      const editorialPack = root.MontazhnayaApplyEditorialOverrides?.(locale) || packs[locale];
      root.MontazhnayaNotificationCatalog?.augmentLocale?.(locale);
      return Promise.resolve(editorialPack);
    }
    const entry = AVAILABLE.find(item => item.code === locale);
    if (!entry || typeof entry.file !== "string" || !entry.file.startsWith("./locales/")) return Promise.reject(new Error("Language pack is not registered: " + locale));
    if (packLoads.has(locale)) return packLoads.get(locale);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(entry.file, document.baseURI).href;
      script.async = true;
      script.onload = () => {
        if (!packs[locale]) return reject(new Error("Language pack did not register: " + locale));
        const editorialPack = root.MontazhnayaApplyEditorialOverrides?.(locale) || packs[locale];
        root.MontazhnayaNotificationCatalog?.augmentLocale?.(locale);
        resolve(editorialPack);
      };
      script.onerror = () => reject(new Error("Could not load language pack: " + locale));
      document.head.appendChild(script);
    }).catch(error => { packLoads.delete(locale); throw error; });
    packLoads.set(locale, promise);
    return promise;
  }

  function isTranslationExcluded(element) {
    if (!element || element.nodeType !== 1) return false;
    return !!element.closest([
      "[data-i18n-skip]", "script", "style", "noscript", "code", "pre",
      "[contenteditable='true']", ".brand", ".media-item", ".clip", ".clip-body",
      ".clip-label", ".clip-name", ".media-name", ".project-profile", ".sequence-marker-label"
    ].join(","));
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== 3) return;
    const parent = node.parentElement;
    if (!parent || isTranslationExcluded(parent) || parent.closest("textarea, [contenteditable=\'true\']")) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);
    const translated = translateSource(source);
    if (node.nodeValue !== translated) {
      lastTranslatedText.set(node, translated);
      node.nodeValue = translated;
    }
  }

  const TRANSLATABLE_ATTRIBUTES = ["title", "placeholder", "aria-label", "aria-description", "aria-valuetext", "alt"];
  function translateElement(element) {
    if (!element || element.nodeType !== 1 || isTranslationExcluded(element)) return;
    let saved = originalAttributes.get(element);
    if (!saved) { saved = Object.create(null); originalAttributes.set(element, saved); }
    let last = lastTranslatedAttributes.get(element);
    if (!last) { last = Object.create(null); lastTranslatedAttributes.set(element, last); }
    for (const name of TRANSLATABLE_ATTRIBUTES) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      if (!Object.prototype.hasOwnProperty.call(saved, name) ||
          (Object.prototype.hasOwnProperty.call(last, name) && current !== last[name])) {
        saved[name] = current;
      }
      const source = saved[name];
      const translated = translateSource(source);
      if (current !== translated) {
        last[name] = translated;
        element.setAttribute(name, translated);
      } else {
        last[name] = current;
      }
    }
    for (const child of element.childNodes) {
      if (child.nodeType === 3) translateTextNode(child);
      else if (child.nodeType === 1) translateElement(child);
    }
  }

  function translateSubtree(node) {
    if (!node) return;
    if (node.nodeType === 3) { translateTextNode(node); return; }
    if (node.nodeType === 1) translateElement(node);
  }

  function scheduleAddedNodes(nodes) {
    for (const node of nodes) pendingNodes.add(node);
    if (applyScheduled) return;
    applyScheduled = true;
    queueMicrotask(() => {
      applyScheduled = false;
      const batch = Array.from(pendingNodes); pendingNodes.clear();
      for (const node of batch) translateSubtree(node);
    });
  }

  function getHostMessages() {
    // Electron's main process only needs the strings used in native dialogs.
    // Ship a bounded snapshot of the selected pack plus English fallback.
    if (currentLocale === "ru") return Object.create(null);
    return Object.assign({}, fallbackMessages, activeMessages);
  }

  function syncHostLocale() {
    const bridge = root.montazhnaya;
    if (!bridge || typeof bridge.setUiLocale !== "function") return;
    const messages = getHostMessages();
    const semantic = activeSemanticData;
    bridge.setUiLocale({ locale: currentLocale, messages, semantic, semanticFallback: fallbackSemanticData }).catch(error => {
      console.warn("[Localization] Could not synchronize the Electron UI language.", error);
    });
  }

  function applyLocale(locale, preference) {
    currentLocale = AVAILABLE.some(item => item.code === locale) ? locale : "en";
    if (preference) currentPreference = preference;
    const pack = getPack(currentLocale);
    activeMessages = messagesWithTooltipTranslations(currentLocale, safeMessages(pack));
    activePatterns = compilePatterns(activeMessages);
    activeSemanticData = semanticDataFor(currentLocale);
    fallbackSemanticData = semanticDataFor("en");
    const englishPack = getPack("en");
    fallbackMessages = messagesWithTooltipTranslations("en", safeMessages(englishPack));
    fallbackPatterns = compilePatterns(fallbackMessages);
    const direction = pack.direction || (RTL.has(currentLocale.split("-")[0]) ? "rtl" : "ltr");
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = currentLocale;
    document.title = pack.appTitle || (currentLocale === "en"
      ? "Montazhnaya beta 3.6.45 — photo, audio and video editor"
      : "Монтажная beta 3.6.45 — монтаж фото, аудио и видео");
    translateElement(document.body);
    root.dispatchEvent(new CustomEvent("montazhnaya:locale-changed", { detail: { locale: currentLocale, direction, preference: currentPreference } }));
    syncHostLocale();
    return currentLocale;
  }

  async function setLocale(preference) {
    const normalized = normalizePreference(preference);
    const locale = resolvePreference(normalized);
    if (locale !== "ru") await ensureLocalePack("en");
    await ensureLocalePack(locale);
    try { localStorage.setItem(STORAGE_KEY, normalized); } catch (_) {}
    currentPreference = normalized;
    return applyLocale(locale, normalized);
  }

  function escapePickerText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
  }

  function openPicker() {
    const existing = document.getElementById("languagePickerOverlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "languagePickerOverlay";
    overlay.className = "modal-backdrop";
    const t = value => escapePickerText(translateSource(value));
    const languageOptions = AVAILABLE.map(item => {
      const marker = item.translationStatus === "preview" ? ` — ${t("Предварительная версия перевода")}` : "";
      return `<option value="${escapePickerText(item.code)}">${escapePickerText(item.nativeName)}${marker}</option>`;
    }).join("");
    overlay.innerHTML = `
      <section class="modal language-modal" role="dialog" aria-modal="true" aria-labelledby="languagePickerTitle">
        <h3 id="languagePickerTitle">${t("Новый язык интерфейса")}</h3>
        <label class="language-choice-label" for="languagePickerSelect">${t("Выберите язык")}</label>
        <select class="language-choice" id="languagePickerSelect">
          <option value="auto">${t("Автоматически (язык системы)")}</option>
          <optgroup label="${t("Доступные языки")}">${languageOptions}</optgroup>
        </select>
        <p class="language-note">${t("Основные команды переведены; остальные подписи используют английский перевод, если он есть, иначе русский.")}</p>
        <div class="modal-buttons">
          <button type="button" class="tbtn" data-language-cancel>${t("Отмена")}</button>
          <button type="button" class="tbtn primary" data-language-apply>${t("Применить")}</button>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    const select = overlay.querySelector("#languagePickerSelect");
    select.value = currentPreference;
    const close = () => overlay.remove();
    overlay.querySelector("[data-language-cancel]").addEventListener("click", close);
    overlay.querySelector("[data-language-apply]").addEventListener("click", async () => {
      const applyButton = overlay.querySelector("[data-language-apply]");
      applyButton.disabled = true;
      try { await setLocale(select.value); close(); }
      catch (error) { applyButton.disabled = false; console.error("[Localization]", error); }
    });
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    const onKey = event => { if (event.key === "Escape") { close(); document.removeEventListener("keydown", onKey); } };
    document.addEventListener("keydown", onKey);
    select.focus();
  }

  async function init() {
    let preference = "en";
    try {
      preference = localStorage.getItem(STORAGE_KEY) || "";
      if (!preference) {
        // The v1 key was written only after an explicit picker choice.
        // Preserve that choice (including an intentional system-language setting).
        const legacyPreference = localStorage.getItem(LEGACY_STORAGE_KEY);
        preference = legacyPreference || "en";
        localStorage.setItem(STORAGE_KEY, normalizePreference(preference));
      }
    } catch (_) { preference = "en"; }
    currentPreference = normalizePreference(preference);
    preference = currentPreference;
    const initialLocale = resolvePreference(preference);
    try {
      if (initialLocale !== "en") await ensureLocalePack("en");
      await ensureLocalePack(initialLocale);
      applyLocale(initialLocale, preference);
    } catch (error) {
      console.error("[Localization] Could not load preferred language; using English.", error);
      currentPreference = "en";
      applyLocale("en", "en");
    }
    if (!observer && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(records => {
        const added = [];
        for (const record of records) {
          if (record.type === "attributes") {
            scheduleAddedNodes([record.target]);
            continue;
          }
          if (record.type === "characterData") {
            const node = record.target;
            const lastWrite = lastTranslatedText.get(node);
            if (lastWrite === node.nodeValue) { lastTranslatedText.delete(node); continue; }
            originalText.set(node, node.nodeValue);
            scheduleAddedNodes([node]);
            continue;
          }
          for (const node of record.addedNodes || []) added.push(node);
        }
        if (added.length) scheduleAddedNodes(added);
      });
      observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: TRANSLATABLE_ATTRIBUTES, subtree: true });
    }
    const languageButton = document.getElementById("languageMenuBtn");
    if (languageButton && !languageButton.dataset.localeBound) {
      languageButton.dataset.localeBound = "1";
      languageButton.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        languageButton.closest(".menu")?.classList.remove("open");
        openPicker();
      });
    }
  }

  root.MontazhnayaI18n = Object.freeze({
    init,
    setLocale,
    openPicker,
    getLocale: () => currentLocale,
    resolveLocale: preference => resolvePreference(preference),
    detectSystemLocale,
    getPreference: () => currentPreference,
    getDirection: () => RTL.has(currentLocale.split("-")[0]) ? "rtl" : "ltr",
    translate: translateSource,
    t,
    tCount,
    pluralNoun,
    pluralCategory,
    formatNumber,
    formatUnit,
    formatDate,
    formatTime,
    formatBytes,
    formatDuration,
    formatRelativeTime,
    getSemanticReviewStatus: () => activeSemanticData.reviewStatus,
    availableLocales: AVAILABLE.map(item => ({ ...item })),
    plannedLocales: PLANNED.map(item => ({ ...item }))
  });
})(window);
