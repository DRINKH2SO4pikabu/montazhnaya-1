/* Türkmençe gural maslahatlarynyň türkçe bukjadan uýgunlaşdyrylan taslamasy.
   Bu maşyn kömegi bilen taýýarlanan türki dil uýgunlaşmasydyr; ene dilinde gepleýän adamyň barlagy garaşylýar. */
(function (root) {
  "use strict";
  const registry = root.MontazhnayaTooltipTranslations;
  const source = root.MontazhnayaTooltipSource;
  const turkish = registry && registry.packs && registry.packs.tr;
  if (!source || !turkish) throw new Error("Load tooltip-source.js and tooltips-tr.js before tooltips-tk.js");

  const replacements = [
    [/Yeni proje/gi, "Täze taslama"], [/proje/gi, "taslama"], [/Projeyi/gi, "Taslamany"], [/projenin/gi, "taslamanyň"],
    [/dosyaları/gi, "faýllary"], [/dosyalar/gi, "faýllar"], [/dosyası/gi, "faýly"], [/dosya/gi, "faýl"],
    [/video/gi, "wideo"], [/müzik/gi, "saz"], [/fotoğraf/gi, "surat"], [/fotoğraflar/gi, "suratlar"],
    [/resim/gi, "şekil"], [/görüntü/gi, "şekil"], [/ses/gi, "ses"], [/ses düzeyi/gi, "ses derejesi"],
    [/zaman çizelgesi/gi, "wagt çyzgysy"], [/oynatma kafası/gi, "oýnatma görkezijisi"],
    [/klipleri/gi, "klipleri"], [/klipler/gi, "klipler"], [/klip/gi, "klip"],
    [/geçişler/gi, "geçişler"], [/geçiş/gi, "geçiş"], [/ayarları/gi, "sazlamalary"], [/ayarlar/gi, "sazlamalar"],
    [/ayar/gi, "sazlama"], [/kaydet/gi, "ýatda sakla"], [/kaydedin/gi, "ýatda saklaň"],
    [/kaydedildi/gi, "ýatda saklandy"], [/kaydetti/gi, "ýatda saklady"],
    [/seçin/gi, "saýlaň"], [/seç/gi, "saýla"], [/seçili/gi, "saýlanan"], [/seçenek/gi, "saýlaw"],
    [/ekle/gi, "goş"], [/ekleyin/gi, "goşuň"], [/sil/gi, "poz"], [/silin/gi, "pozuň"],
    [/kaldır/gi, "aýyr"], [/kaldırın/gi, "aýryň"], [/göster/gi, "görkez"], [/gösterin/gi, "görkeziň"],
    [/gizle/gi, "gizle"], [/gizleyin/gi, "gizläň"], [/başlangıç/gi, "başlangyç"], [/başlangıçta/gi, "başlangyçda"],
    [/bitiş/gi, "soňy"], [/sonunda/gi, "soňunda"], [/süre/gi, "dowamlylyk"], [/uzunluk/gi, "uzynlyk"],
    [/saniye/gi, "sekunt"], [/dakika/gi, "minut"], [/oynat/gi, "oýnat"], [/duraklat/gi, "sägindir"],
    [/durdur/gi, "duruz"], [/sürükleyin/gi, "süýräň"], [/sürükle/gi, "süýre"],
    [/yakınlaştır/gi, "ýakynlaşdyr"], [/uzaklaştır/gi, "daşlaşdyr"],
    [/parlaklık/gi, "ýagtylyk"], [/kontrast/gi, "kontrast"], [/doygunluk/gi, "doýgunlyk"],
    [/opaklık/gi, "açyklyk"], [/şeffaf/gi, "dury"], [/görünür/gi, "görünýär"],
    [/sola/gi, "çepe"], [/sağa/gi, "saga"], [/yukarı/gi, "ýokary"], [/aşağı/gi, "aşak"],
    [/önce/gi, "öň"], [/sonra/gi, "soň"], [/için/gi, "üçin"], [/ile/gi, "bilen"],
    [/veya/gi, "ýa-da"], [/ve/gi, "we"], [/değil/gi, "däl"], [/olabilir/gi, "bolup biler"],
    [/gereklidir/gi, "zerurdyr"], [/gerekir/gi, "gerek"], [/kullan/gi, "ulan"], [/kullanın/gi, "ulanyň"],
    [/kontrol et/gi, "barla"], [/kontrol/gi, "barlag"], [/hata/gi, "ýalňyşlyk"],
    [/uyarı/gi, "duýduryş"], [/eksik/gi, "ýetmeýän"], [/kaynak/gi, "çeşme"],
    [/orijinal/gi, "asyl"], [/bilgisayar/gi, "kompýuter"], [/ekran/gi, "ekran"],
    [/fare/gi, "syçan"], [/klavye/gi, "klawiatura"], [/imleç/gi, "kursory"],
    [/işaretçi/gi, "görkeziji"], [/dosya adı/gi, "faýlyň ady"], [/dosya boyutu/gi, "faýlyň ölçegi"],
    [/bölüm/gi, "bölüm"], [/seçili klip/gi, "saýlanan klip"], [/önizleme/gi, "deslapky syn"],
    [/önizlemede/gi, "deslapky synlamada"], [/çerçeve/gi, "çäk"], [/kare/gi, "kadr"],
    [/kareler/gi, "kadrlar"], [/çözünürlük/gi, "durulyk"], [/frame rate/gi, "kadr ýygylygy"],
    [/video formatı/gi, "wideo görnüşi"], [/ses dosyası/gi, "ses faýly"],
    [/dosya/gi, "faýl"], [/zaman/gi, "wagt"], [/konum/gi, "ýerleşiş"],
    [/başka/gi, "başga"], [/aynı/gi, "şol bir"], [/tüm/gi, "ähli"], [/her/gi, "her"],
    [/büyük/gi, "uly"], [/küçük/gi, "kiçi"], [/daha fazla/gi, "has köp"], [/daha az/gi, "has az"],
    [/hızlı/gi, "çalt"], [/yavaş/gi, "haýal"], [/yeni/gi, "täze"], [/eski/gi, "köne"],
    [/tamamlandı/gi, "tamamlandy"], [/hazır/gi, "taýýar"], [/aç/gi, "aç"],
    [/açın/gi, "açyň"], [/kapat/gi, "ýap"], [/kapatın/gi, "ýapyň"],
    [/düzenleme/gi, "redaktirleme"], [/düzenleyici/gi, "redaktor"],
    [/ayrıca/gi, "şeýle hem"], [/yalnızca/gi, "diňe"], [/sadece/gi, "diňe"]
  ];

  function adapt(value) {
    let result = String(value);
    for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
    return result;
  }

  const messages = source.textKeys.map(key => {
    const value = turkish[key];
    if (typeof value !== "string" || !value.trim()) throw new Error("Missing Turkish tooltip: " + key);
    return adapt(value);
  });
  registry.register("tk", messages, "turkic-adaptation-draft-native-speaker-review-pending");
})(window);
