/* Uzbek Cyrillic tooltip draft transliterated from the Uzbek Latin pack.
   This is a script variant, not an independent translation; native-speaker review is pending. */
(function (root) {
  "use strict";
  const registry = root.MontazhnayaTooltipTranslations;
  const source = root.MontazhnayaTooltipSource;
  const latin = registry && registry.packs && registry.packs.uz;
  if (!source || !latin) throw new Error("Load tooltip-source.js and tooltips-uz.js before tooltips-uz-Cyrl.js");

  function upperFirst(value) {
    if (!value) return value;
    return value[0].toUpperCase() + value.slice(1);
  }
  function transliterate(input) {
    const text = String(input).replace(/[‘’ʼ']/g, "ʻ");
    const digraphs = [
      ["oʻ","ў"], ["gʻ","ғ"], ["sh","ш"], ["ch","ч"],
      ["ng","нг"], ["yo","ё"], ["yu","ю"], ["ya","я"], ["ye","е"], ["ts","ц"]
    ];
    let output = "";
    for (let i = 0; i < text.length;) {
      const rest = text.slice(i);
      let matched = false;
      for (const [latinPair, cyrillic] of digraphs) {
        const sample = rest.slice(0, latinPair.length);
        if (sample.toLowerCase() === latinPair) {
          const converted = sample === sample.toUpperCase() ? cyrillic.toUpperCase()
            : sample[0] === sample[0].toUpperCase() ? upperFirst(cyrillic) : cyrillic;
          output += converted;
          i += latinPair.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const char = text[i];
      const map = {
        a:"а", b:"б", d:"д", e:"е", f:"ф", g:"г", h:"ҳ", i:"и", j:"ж",
        k:"к", l:"л", m:"м", n:"н", o:"о", p:"п", q:"қ", r:"р", s:"с",
        t:"т", u:"у", v:"в", x:"х", y:"й", z:"з"
      };
      const lower = char.toLowerCase();
      const converted = map[lower] || char;
      output += char !== lower ? upperFirst(converted) : converted;
      i++;
    }
    return output;
  }

  const messages = source.textKeys.map(key => {
    const value = latin[key];
    if (typeof value !== "string" || !value.trim()) throw new Error("Missing Uzbek Latin tooltip: " + key);
    return transliterate(value);
  });
  registry.register("uz-Cyrl", messages, "transliteration-draft-native-speaker-review-pending");
})(window);
