
const fs=require('fs'),vm=require('vm');
const window={};const context={window};vm.createContext(context);
for(const f of ['src/renderer/locales/manifest.js','src/renderer/locales/en.js','src/renderer/locales/international.js','src/renderer/locales/cis.js','src/renderer/locales/editorial-overrides.js']) vm.runInContext(fs.readFileSync(f,'utf8'),context);
const packs=window.MontazhnayaLocalePacks, manifest=window.MontazhnayaLocaleManifest; for(const entry of manifest.available) window.MontazhnayaApplyEditorialOverrides?.(entry.code);
const locales={}; const fallback={version:'3.6.45',referenceKeyCount:Object.keys(packs.en.messages).length,locales:{}};
for(const entry of manifest.available){ if(entry.code==='ru'||entry.code==='en') continue; const p=packs[entry.code]; if(!p) throw new Error('Missing runtime pack '+entry.code); const mapped=Object.keys(p.messages||{}).length; const fb=p.englishFallbackKeys||[]; locales[entry.code]={nativeName:entry.nativeName,englishName:entry.englishName,direction:p.direction||entry.direction||'ltr',coverage:p.coverage||entry.coverage||'unknown',localeMappedCount:mapped,englishFallbackCount:fb.length,translationStatus:p.translationStatus||entry.translationStatus||'established',translationStage:p.translationStage||null,completedTranslationWave:p.completedTranslationWave||null,translationQuality:p.translationQuality||'draft-pending-native-review',editorialRevision:p.editorialRevision||null,editorialCorrectionCount:p.editorialCorrectionCount||0,scriptVariant:p.scriptVariant||entry.scriptVariant||null,fontFamily:p.fontFamily||entry.fontFamily||null,appTitle:p.appTitle||null}; if(fb.length) fallback.locales[entry.code]=fb; }
const out={version:'3.6.45',referenceKeyCount:Object.keys(packs.en.messages).length,availablePreviewLocales:Object.keys(locales).length,locales};
fs.writeFileSync('qa/locale-coverage-beta-3.6.45.json',JSON.stringify(out,null,2));
fs.writeFileSync('qa/english-fallback-keys-beta-3.6.45.json',JSON.stringify(fallback,null,2));
const lines=['Montazhnaya Beta 3.6.45 — localization coverage','English reference keys: '+out.referenceKeyCount,'Preview locales: '+out.availablePreviewLocales,'','Locale\tNative name\tMapped source keys\tEnglish fallback\tStage'];
for(const [code,p] of Object.entries(locales)) lines.push([code,p.nativeName,p.localeMappedCount+'/'+out.referenceKeyCount,p.englishFallbackCount,p.translationStage||'complete source map'].join('\t'));
fs.writeFileSync('qa/locale-coverage-beta-3.6.45.txt',lines.join('\n')+'\n');
console.log(JSON.stringify({localeCount:out.availablePreviewLocales,referenceKeyCount:out.referenceKeyCount,regional:Object.fromEntries(['kk','uz','uz-Cyrl','az','ka','hy','tk','ky','tg','be'].map(c=>[c,[locales[c].localeMappedCount,locales[c].englishFallbackCount]]))}));
