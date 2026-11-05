(function (root) {
  "use strict";
  const pack = root.MontazhnayaLocalePacks && root.MontazhnayaLocalePacks.en;
  if (!pack || !pack.messages) throw new Error("English source pack must load before guide and regional locale extensions");
  root.MontazhnayaLocaleSourceMessages = Object.freeze(Object.assign(Object.create(null), pack.messages));
})(window);
