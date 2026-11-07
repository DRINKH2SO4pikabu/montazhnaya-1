"use strict";

const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const port = Number(arg("--port", "9337"));
const outputDir = path.resolve(arg("--output", path.join(process.cwd(), "qa", "tooltip-gui-audit")));
const viewports = [
  { width: 1024, height: 700 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 }
];

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Invalid DevTools port.");
}
if (Number(process.versions.node.split(".")[0]) < 22) {
  throw new Error("Node.js 22 or newer is required for the built-in WebSocket client.");
}
if (typeof WebSocket !== "function") {
  throw new Error("This Node.js runtime does not provide the built-in WebSocket client.");
}

fs.mkdirSync(outputDir, { recursive: true });

class DevToolsClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out connecting to Electron DevTools.")), 15000);
      this.socket.addEventListener("open", () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      this.socket.addEventListener("error", () => {
        clearTimeout(timeout);
        reject(new Error("Could not connect to Electron DevTools WebSocket."));
      }, { once: true });
    });

    this.socket.addEventListener("message", event => {
      let message;
      try { message = JSON.parse(String(event.data)); }
      catch (_) { return; }
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || "DevTools command failed."));
      else pending.resolve(message.result || {});
    });
    this.socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) pending.reject(new Error("Electron DevTools connection closed."));
      this.pending.clear();
    });
  }

  send(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }

  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
      timeout: 60000
    });
    if (response.exceptionDetails) {
      const description = response.exceptionDetails.exception &&
        response.exceptionDetails.exception.description;
      throw new Error(description || response.exceptionDetails.text || "Page evaluation failed.");
    }
    return response.result ? response.result.value : undefined;
  }

  close() {
    try { this.socket && this.socket.close(); } catch (_) {}
  }
}

async function waitForPageTarget() {
  const endpoint = "http://127.0.0.1:" + port + "/json/list";
  const deadline = Date.now() + 90000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("DevTools HTTP " + response.status);
      const targets = await response.json();
      const page = targets.find(target =>
        target.type === "page" &&
        typeof target.webSocketDebuggerUrl === "string" &&
        /index\.html(?:$|[?#])/i.test(target.url || "")
      );
      if (page) return page;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Editor page was not found on DevTools port " + port +
    (lastError ? ": " + lastError.message : ""));
}

const expectedCyrillic = new Set(["ru", "uk", "kk", "uz-Cyrl", "ky", "tg", "be"]);
const expectedScript = {
  de: "Latin", fr: "Latin", es: "Latin", "pt-BR": "Latin", it: "Latin", pl: "Latin",
  uk: "Cyrillic", tr: "Latin", "zh-CN": "Han", "zh-TW": "Han", ja: "JapaneseKana",
  ko: "Hangul", ar: "Arabic", he: "Hebrew", hi: "Devanagari", nl: "Latin",
  sv: "Latin", fi: "Latin", cs: "Latin", ro: "Latin", el: "Greek", vi: "Latin",
  id: "Latin", th: "Thai", kk: "Cyrillic", uz: "Latin", "uz-Cyrl": "Cyrillic",
  ka: "Georgian", hy: "Armenian", tk: "Latin", az: "Latin", ky: "Cyrillic",
  tg: "Cyrillic", be: "Cyrillic"
};

const localeSummaries = [];
const detailRows = [];
const criticalFailures = [];
const reviewFlags = [];
let totalTooltipStrings = 0;
let totalRenderedHelpSamples = 0;
let totalRenderedTooltipFragments = 0;
let totalFragmentDisplayFailures = 0;
let totalFragmentOverflowCount = 0;
let totalFragmentOutsideViewport = 0;
let totalViewportChecks = 0;
let totalOutsideViewport = 0;

function csvCell(value) {
  return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
}

function writeCsv(filePath, rows) {
  const text = rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  fs.writeFileSync(filePath, "\uFEFF" + text, "utf8");
}

function buildLocaleExpression(code, viewport) {
  const codeLiteral = JSON.stringify(code);
  const viewportLiteral = JSON.stringify(viewport);
  return "(async () => {" +
    "const api=window.MontazhnayaI18n;" +
    "if(!api||typeof api.setLocale!=='function') throw new Error('MontazhnayaI18n is unavailable');" +
    "await api.setLocale(" + codeLiteral + ");" +
    "await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));" +
    "const locale=api.getLocale();" +
    "const meta=(api.availableLocales||[]).find(item=>item.code===locale)||{};" +
    "const source=window.MontazhnayaTooltipSource;" +
    "const packs=window.MontazhnayaTooltipTranslations;" +
    "if(!source||!Array.isArray(source.textKeys)||!packs) throw new Error('Tooltip source registry is unavailable');" +
    "const keys=source.textKeys;" +
    "const tooltipPack=packs.packs[locale]||{};" +
    "const tooltipPackCount=Object.keys(tooltipPack).length;" +
    "const missingPackKeys=locale==='ru'?[]:keys.filter(key=>!Object.prototype.hasOwnProperty.call(tooltipPack,key));" +
    "const translated=[]; const unchanged=[]; const empty=[];" +
    "for(const key of keys){" +
      "const value=api.translate(key);" +
      "translated.push({key,value});" +
      "if(typeof value!=='string'||!value.trim()) empty.push(key);" +
      "else if(locale!=='ru'&&value===key&&/[А-Яа-яЁё]/.test(key)) unchanged.push(key);" +
    "}" +
    "const expectedDirection=(locale==='ar'||locale==='he')?'rtl':'ltr';" +
    "const direction=document.documentElement.dir;" +
    "const actionEntries=Object.entries(UI_HELP_ACTIONS||{});" +
    "const idEntries=Object.entries(UI_HELP_IDS||{});" +
    "const beginnerAction=BEGINNER_ACTION_HELP||{};" +
    "const beginnerIds=BEGINNER_ID_HELP||{};" +
    "if(typeof setFunctionHelpEnabled==='function') setFunctionHelpEnabled(true);" +
    "const pop=document.getElementById('functionHelpPopover');" +
    "if(!pop) throw new Error('The actual function-help popover is missing from the editor');" +
    "const fixtures=[];" +
    "const fixtureRoot=document.createElement('div');" +
    "fixtureRoot.id='__montazhnayaTooltipAuditFixtures';" +
    "fixtureRoot.style.cssText='position:fixed;inset:0;pointer-events:none;opacity:0;z-index:2147483000;';" +
    "document.body.appendChild(fixtureRoot);" +
    "for(const [key] of actionEntries){" +
      "const el=document.createElement('button'); el.type='button'; el.dataset.action=key;" +
      "el.setAttribute('aria-label','QA action '+key); fixtureRoot.appendChild(el);" +
      "fixtures.push({kind:'action',key,element:el,override:!!beginnerAction[key]});" +
    "}" +
    "for(const [key] of idEntries){" +
      "const el=document.createElement('button'); el.type='button'; el.id=key;" +
      "el.setAttribute('aria-label','QA control '+key); fixtureRoot.appendChild(el);" +
      "fixtures.push({kind:'control',key,element:el,override:!!beginnerIds[key]});" +
    "}" +
    "const liveTargets=Array.from(document.querySelectorAll(FUNCTION_HELP_SELECTOR||'button,input,select,textarea,label,[data-action]'))" +
      ".filter(el=>el.isConnected&&el.getClientRects().length>0&&!fixtureRoot.contains(el)&&!pop.contains(el));" +
    "const liveUnique=Array.from(new Set(liveTargets));" +
    "const sampleResults=[]; let longest=null; let longestLength=-1;" +
    "const sampleList=fixtures.concat(liveUnique.map((element,index)=>({kind:'live',key:element.id||element.dataset.action||element.className||element.tagName,element,override:false})));" +
    "const width=" + viewportLiteral + ".width; const height=" + viewportLiteral + ".height;" +
    "for(let i=0;i<sampleList.length;i++){" +
      "const sample=sampleList[i]; const el=sample.element;" +
      "if(sample.kind!=='live'){" +
        "el.style.position='fixed';" +
        "el.style.left=((i%2===0)?10:Math.max(10,width-48))+'px';" +
        "el.style.top=((Math.floor(i/2)%2===0)?10:Math.max(10,height-34))+'px';" +
        "el.style.width='32px'; el.style.height='22px';" +
      "}" +
      "let raw=null; let def=null;" +
      "try{" +
        "raw=helpActionDefinition(el)||getGenericFunctionHelp(el);" +
        "def=makeBeginnerFriendlyHelp(el,raw);" +
        "if(!def){sampleResults.push({kind:sample.kind,key:sample.key,status:'no-definition'});continue;}" +
        "showFunctionHelp(el);" +
      "}catch(error){sampleResults.push({kind:sample.kind,key:sample.key,status:'exception',error:String(error&&error.message||error)});continue;}" +
      "const actual=pop.innerText||pop.textContent||'';" +
      "const fields=['title','purpose','usage','tip'];" +
      "const untranslated=[]; const missingFields=[]; const expectedText=[];" +
      "for(const field of fields){" +
        "const value=def[field];" +
        "if(field!=='tip'&&(!value||!String(value).trim())) missingFields.push(field);" +
        "if(typeof value==='string'&&value.trim()){" +
          "const display=uiText(value); expectedText.push(display);" +
          "if(locale!=='ru'&&display===value&&/[А-Яа-яЁё]/.test(value)) untranslated.push(field);" +
        "}" +
      "}" +
      "const missingDisplayed=expectedText.filter(value=>value&& !actual.includes(value));" +
      "const r=pop.getBoundingClientRect();" +
      "const outside=r.left<0||r.top<0||r.right>window.innerWidth+1||r.bottom>window.innerHeight+1;" +
      "const textBoxes=Array.from(pop.querySelectorAll('.fhelp-title,.fhelp-text,.fhelp-tip,.fhelp-label'));" +
      "const clipped=textBoxes.filter(node=>node.clientWidth>0&&(node.scrollWidth>node.clientWidth+2||node.scrollHeight>node.clientHeight+2))" +
        ".map(node=>({className:node.className,text:(node.innerText||'').slice(0,110),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight}));" +
      "const sampleLength=actual.length;" +
      "const record={kind:sample.kind,key:sample.key,override:sample.override===true,length:sampleLength," +
        "outsideViewport:outside,rect:{left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom)}," +
        "untranslatedCyrillicFields:untranslated,missingDisplayedFields:missingDisplayed,clippedTextBoxes:clipped," +
        "actualText:actual.slice(0,1200)};" +
      "sampleResults.push(record);" +
      "if(sampleLength>longestLength){longestLength=sampleLength;longest={sample,record};}" +
    "}" +
    "if(longest){showFunctionHelp(longest.sample.element);}" +
    "const fragmentSamples=[]; let longestFragment=null; let longestFragmentLength=-1;" +
    "let fragmentOverflowCount=0; let fragmentDisplayFailures=0; let fragmentOutsideViewport=0;" +
    "const fragmentRoles=['title','purpose','usage','tip'];" +
    "for(let i=0;i<keys.length;i++){" +
      "const key=keys[i]; const value=api.translate(key); const field=fragmentRoles[i%fragmentRoles.length];" +
      "const def={title:'Подсказка',purpose:'',usage:'',tip:''}; def[field]=value;" +
      "try{" +
        "buildFunctionHelpContent(def); pop.classList.add('visible'); pop.style.left='8px'; pop.style.top='8px';" +
        "const actual=pop.innerText||pop.textContent||'';" +
        "const normalizedValue=String(value||'').normalize('NFC').replace(/\\s+/g,' ').trim();" +
        "const normalizedActual=String(actual).normalize('NFC').replace(/\\s+/g,' ').trim();" +
        "const missing=!normalizedValue||!normalizedActual.includes(normalizedValue);" +
        "const selector=field==='title'?'.fhelp-title':field==='tip'?'.fhelp-tip':'.fhelp-text';" +
        "const node=Array.from(pop.querySelectorAll(selector)).find(item=>String(item.innerText||'').normalize('NFC').replace(/\\s+/g,' ').includes(normalizedValue));" +
        "const clipped=!!node&&(node.scrollWidth>node.clientWidth+2||node.scrollHeight>node.clientHeight+2);" +
        "const rect=pop.getBoundingClientRect();" +
        "const outside=rect.left<0||rect.top<0||rect.right>window.innerWidth+1||rect.bottom>window.innerHeight+1;" +
        "const cardOverflow=pop.scrollHeight>pop.clientHeight+2&&getComputedStyle(pop).overflowY==='hidden';" +
        "const overflow=clipped||cardOverflow;" +
        "const untranslatedCyrillic=locale!=='ru'&&value===key&&/[А-Яа-яЁё]/.test(key);" +
        "const record={key,field,length:String(value||'').length,missingFromRenderedCard:missing,untranslatedCyrillic,clipped,cardOverflow,outsideViewport:outside," +
          "actualText:actual.replace(/\\s+/g,' ').slice(0,500)};" +
        "fragmentSamples.push(record);" +
        "if(missing) fragmentDisplayFailures++;" +
        "if(overflow) fragmentOverflowCount++;" +
        "if(outside) fragmentOutsideViewport++;" +
        "if(String(value||'').length>longestFragmentLength){longestFragmentLength=String(value||'').length;longestFragment={key,field,value};}" +
      "}catch(error){" +
        "fragmentDisplayFailures++; fragmentSamples.push({key,field,status:'exception',error:String(error&&error.message||error)});" +
      "}" +
    "}" +
    "if(longestFragment){" +
      "const def={title:'Подсказка',purpose:'',usage:'',tip:''}; def[longestFragment.field]=longestFragment.value;" +
      "buildFunctionHelpContent(def); pop.classList.add('visible'); pop.style.left='8px'; pop.style.top='8px';" +
    "}" +
    "const summary={" +
      "locale,languageName:meta.nativeName||locale,direction,expectedDirection," +
      "tooltipKeyCount:keys.length,tooltipPackCount,missingPackKeys,unchangedCyrillicKeys:unchanged.length,emptyTooltipKeys:empty.length," +
      "actionDefinitions:actionEntries.length,controlDefinitions:idEntries.length," +
      "beginnerActionOverrides:Object.keys(beginnerAction).length,beginnerControlOverrides:Object.keys(beginnerIds).length," +
      "syntheticSamples:fixtures.length,liveTargets:liveUnique.length,samples:sampleResults.length," +
      "renderedTooltipFragments:fragmentSamples.length,fragmentDisplayFailures,fragmentOverflowCount,fragmentOutsideViewport," +
      "fragmentUntranslatedCyrillic:fragmentSamples.filter(item=>item.untranslatedCyrillic).length," +
      "longestTooltipFragment:longestFragment?longestFragment.key:null,longestTooltipFragmentLength:longestFragmentLength," +
      "fragmentSamples," +
      "outsideViewport:sampleResults.filter(item=>item.outsideViewport).length," +
      "untranslatedCyrillicFields:sampleResults.reduce((sum,item)=>sum+(item.untranslatedCyrillicFields||[]).length,0)," +
      "clippedTextBoxes:sampleResults.reduce((sum,item)=>sum+(item.clippedTextBoxes||[]).length,0)," +
      "missingDisplayedFields:sampleResults.reduce((sum,item)=>sum+(item.missingDisplayedFields||[]).length,0)," +
      "metadata:packs.metadata[locale]|| (locale==='ru'?'source-language': 'missing')," +
      "longestTooltip:longest?longest.record.key:null," +
      "longestTooltipLength:longestLength," +
      "samples:sampleResults" +
    "};" +
    "fixtureRoot.remove();" +
    "return summary;" +
  "})()";
}

let activeClient = null;

async function main() {
  const target = await waitForPageTarget();
  const client = new DevToolsClient(target.webSocketDebuggerUrl);
  activeClient = client;
  await client.connect();
  await client.send("Runtime.enable");
  await client.send("Page.enable");

  const ready = await client.evaluate("(async()=>{const deadline=Date.now()+60000;while(Date.now()<deadline){if(window.MontazhnayaI18n&&typeof showFunctionHelp==='function'&&typeof uiText==='function'&&window.MontazhnayaTooltipSource&&window.MontazhnayaTooltipTranslations)return true;await new Promise(resolve=>setTimeout(resolve,250));}return false;})()");
  if (!ready) throw new Error("The editor localization runtime or real tooltip renderer did not become ready.");

  const localeList = await client.evaluate("window.MontazhnayaI18n.availableLocales.map(item=>({code:item.code,nativeName:item.nativeName,direction:item.direction||'ltr'}))");
  if (!Array.isArray(localeList) || localeList.length !== 36) {
    throw new Error("Expected 36 selectable locales, found " + (localeList && localeList.length));
  }

  const sourceCount = await client.evaluate("window.MontazhnayaTooltipSource.textKeys.length");
  if (sourceCount !== 364) throw new Error("Expected 364 detailed tooltip fragments, found " + sourceCount);

  const report = {
    generatedAt: new Date().toISOString(),
    application: "Montazhnaya",
    method: "Electron GUI via Chromium DevTools Protocol; real i18n runtime and real showFunctionHelp renderer",
    scope: {
      locales: localeList.length,
      detailedTooltipFragmentsPerLocale: sourceCount,
      actionDefinitions: null,
      controlDefinitions: null,
      beginnerFriendlyOverrides: null,
      viewports
    },
    localeSummaries: [],
    criticalFailures,
    reviewFlags
  };

  for (const locale of localeList) {
    process.stdout.write("Checking " + locale.code + " (" + locale.nativeName + ") ...\n");
    let localeSummary = null;

    for (const viewport of viewports) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: false
      });
      const result = await client.evaluate(buildLocaleExpression(locale.code, viewport));
      if (!localeSummary) {
        localeSummary = {
          code: result.locale,
          nativeName: result.languageName,
          expectedDirection: result.expectedDirection,
          actualDirection: result.direction,
          metadata: result.metadata,
          detailedTooltipFragments: result.tooltipKeyCount,
          tooltipPackEntries: result.tooltipPackCount,
          missingTooltipPackKeys: result.missingPackKeys.length,
          unchangedCyrillicKeys: result.unchangedCyrillicKeys,
          emptyTooltipKeys: result.emptyTooltipKeys,
          actionDefinitions: result.actionDefinitions,
          controlDefinitions: result.controlDefinitions,
          beginnerActionOverrides: result.beginnerActionOverrides,
          beginnerControlOverrides: result.beginnerControlOverrides,
          viewports: []
        };
        report.scope.actionDefinitions = result.actionDefinitions;
        report.scope.controlDefinitions = result.controlDefinitions;
        report.scope.beginnerFriendlyOverrides = result.beginnerActionOverrides + result.beginnerControlOverrides;

        totalTooltipStrings += result.tooltipKeyCount;
        if (result.expectedDirection !== result.actualDirection) {
          criticalFailures.push(locale.code + ": expected direction " + result.expectedDirection + ", got " + result.actualDirection);
        }
        if (result.emptyTooltipKeys) criticalFailures.push(locale.code + ": " + result.emptyTooltipKeys + " empty detailed tooltip strings");
        if (locale.code !== "ru" && result.tooltipPackCount !== sourceCount) {
          criticalFailures.push(locale.code + ": expected " + sourceCount + " registered tooltip strings, found " + result.tooltipPackCount);
        }
        if (locale.code !== "ru" && result.missingPackKeys.length) {
          criticalFailures.push(locale.code + ": " + result.missingPackKeys.length + " detailed tooltip pack keys are missing");
        }
        if (locale.code !== "ru" && result.metadata === "missing") {
          criticalFailures.push(locale.code + ": detailed tooltip translation metadata is missing");
        }
        if (result.unchangedCyrillicKeys) {
          reviewFlags.push({
            locale: locale.code,
            type: "detailed-tooltip-source-fallback",
            count: result.unchangedCyrillicKeys,
            note: "Some Russian source fragments are unchanged in the selected language."
          });
        }
      }

      for (const sample of result.samples) {
        if (sample.status === "no-definition" && sample.kind === "live") {
          reviewFlags.push({
            locale: locale.code,
            viewport,
            type: "live-target-without-help-definition",
            key: sample.key
          });
        }
        if ((sample.untranslatedCyrillicFields || []).length) {
          reviewFlags.push({
            locale: locale.code,
            viewport,
            type: "untranslated-cyrillic-help-fields",
            key: sample.key,
            fields: sample.untranslatedCyrillicFields
          });
        }
        if ((sample.missingDisplayedFields || []).length) {
          reviewFlags.push({
            locale: locale.code,
            viewport,
            type: "help-field-not-rendered",
            key: sample.key,
            fields: sample.missingDisplayedFields
          });
        }
        if ((sample.clippedTextBoxes || []).length) {
          reviewFlags.push({
            locale: locale.code,
            viewport,
            type: "text-box-overflow",
            key: sample.key,
            boxes: sample.clippedTextBoxes
          });
        }
        if (sample.actualText && !expectedCyrillic.has(locale.code) && /[А-Яа-яЁё]/.test(sample.actualText)) {
          reviewFlags.push({
            locale: locale.code,
            viewport,
            type: "unexpected-cyrillic-in-tooltip",
            key: sample.key,
            text: sample.actualText.slice(0, 240)
          });
        }
      }

      const viewportSummary = {
        width: viewport.width,
        height: viewport.height,
        syntheticSamples: result.syntheticSamples,
        liveTargets: result.liveTargets,
        renderedSamples: result.samples,
        outsideViewport: result.outsideViewport,
        untranslatedCyrillicFields: result.untranslatedCyrillicFields,
        clippedTextBoxes: result.clippedTextBoxes,
        missingDisplayedFields: result.missingDisplayedFields,
        renderedTooltipFragments: result.renderedTooltipFragments,
        fragmentDisplayFailures: result.fragmentDisplayFailures,
        fragmentOverflowCount: result.fragmentOverflowCount,
        fragmentOutsideViewport: result.fragmentOutsideViewport,
        fragmentUntranslatedCyrillic: result.fragmentUntranslatedCyrillic,
        longestTooltipFragment: result.longestTooltipFragment,
        longestTooltipFragmentLength: result.longestTooltipFragmentLength,
        longestTooltip: result.longestTooltip,
        longestTooltipLength: result.longestTooltipLength
      };
      localeSummary.viewports.push(viewportSummary);
      totalRenderedHelpSamples += result.samples;
      totalRenderedTooltipFragments += result.renderedTooltipFragments;
      totalFragmentDisplayFailures += result.fragmentDisplayFailures;
      totalFragmentOverflowCount += result.fragmentOverflowCount;
      totalFragmentOutsideViewport += result.fragmentOutsideViewport;
      totalViewportChecks += result.samples + result.renderedTooltipFragments;
      totalOutsideViewport += result.outsideViewport + result.fragmentOutsideViewport;

      for (const fragment of result.fragmentSamples) {
        if (fragment.missingFromRenderedCard) {
          criticalFailures.push(locale.code + " " + viewport.width + "x" + viewport.height +
            " detailed tooltip fragment was not rendered: " + fragment.key);
        }
        if (fragment.status === "exception") {
          criticalFailures.push(locale.code + " " + viewport.width + "x" + viewport.height +
            " detailed tooltip fragment threw an exception: " + fragment.key + " — " + fragment.error);
        }
        if (fragment.untranslatedCyrillic) {
          reviewFlags.push({locale: locale.code, viewport, type: "untranslated-detailed-tooltip-fragment", key: fragment.key});
        }
        if (fragment.clipped || fragment.cardOverflow) {
          reviewFlags.push({locale: locale.code, viewport, type: "detailed-tooltip-text-overflow", key: fragment.key,
            field: fragment.field, clipped: fragment.clipped, cardOverflow: fragment.cardOverflow});
        }
        if (fragment.outsideViewport) {
          criticalFailures.push(locale.code + " detailed tooltip fragment outside viewport at " +
            viewport.width + "x" + viewport.height + " (" + fragment.key + ")");
        }
        detailRows.push([
          locale.code, viewport.width, viewport.height, "fragment/" + fragment.field, fragment.key,
          fragment.length, fragment.outsideViewport,
          fragment.untranslatedCyrillic ? "untranslated" : "",
          fragment.missingFromRenderedCard ? "not-rendered" : "",
          (fragment.clipped || fragment.cardOverflow) ? 1 : 0,
          fragment.actualText || fragment.error || ""
        ]);
      }

      for (const sample of result.samples) {
        detailRows.push([
          locale.code, viewport.width, viewport.height, sample.kind, sample.key,
          sample.length, sample.outsideViewport,
          (sample.untranslatedCyrillicFields || []).join(";"),
          (sample.missingDisplayedFields || []).join(";"),
          (sample.clippedTextBoxes || []).length,
          (sample.actualText || "").replace(/\s+/g, " ").slice(0, 900)
        ]);
        if (sample.status === "exception" || (sample.status === "no-definition" && sample.kind !== "live")) {
          criticalFailures.push(locale.code + " " + viewport.width + "x" + viewport.height +
            " " + sample.kind + "/" + sample.key + ": " + (sample.error || sample.status));
        }
        if (sample.outsideViewport) {
          criticalFailures.push(locale.code + " tooltip outside viewport at " +
            viewport.width + "x" + viewport.height + " (" + sample.key + ")");
        }
      }

      if (viewport.width === 1366 && viewport.height === 768) {
        try {
          const image = await client.send("Page.captureScreenshot", {
            format: "png",
            fromSurface: true,
            captureBeyondViewport: false
          });
          const screenshotPath = path.join(outputDir, "tooltip-" + locale.code.replace(/[^A-Za-z0-9_-]/g, "_") + ".png");
          fs.writeFileSync(screenshotPath, Buffer.from(image.data, "base64"));
          localeSummary.screenshot = path.basename(screenshotPath);
        } catch (error) {
          reviewFlags.push({ locale: locale.code, type: "screenshot-failed", note: error.message });
        }
      }

      const reset = await client.evaluate("if(typeof hideFunctionHelp==='function')hideFunctionHelp(true);true");
      void reset;
    }

    localeSummary.nativeSpeakerReview = locale.code === "ru" ? "source-language" :
      locale.code === "en" ? "reference-translation" :
      "machine-assisted-draft-native-speaker-review-pending";
    report.localeSummaries.push(localeSummary);
  }

  await client.send("Emulation.clearDeviceMetricsOverride");
  await client.evaluate("if(typeof hideFunctionHelp==='function')hideFunctionHelp(true);if(typeof setFunctionHelpEnabled==='function')setFunctionHelpEnabled(true);true");

  report.summary = {
    selectableLocales: localeList.length,
    detailedTooltipFragmentsPerLocale: sourceCount,
    totalDetailedTooltipTranslationsChecked: totalTooltipStrings,
    expectedDetailedTooltipTranslations: localeList.length * sourceCount,
    actionDefinitions: report.scope.actionDefinitions,
    controlDefinitions: report.scope.controlDefinitions,
    beginnerFriendlyOverrides: report.scope.beginnerFriendlyOverrides,
    viewportsTested: viewports.length,
    renderedHelpSamples: totalRenderedHelpSamples,
    renderedTooltipFragments: totalRenderedTooltipFragments,
    fragmentDisplayFailures: totalFragmentDisplayFailures,
    fragmentOverflowCount: totalFragmentOverflowCount,
    fragmentOutsideViewport: totalFragmentOutsideViewport,
    fragmentUntranslatedCyrillic: new Set(reviewFlags.filter(flag => flag.type === "untranslated-detailed-tooltip-fragment").map(flag => flag.locale + "|" + flag.key)).size,
    popoverViewportChecks: totalViewportChecks,
    outsideViewportCount: totalOutsideViewport,
    criticalFailureCount: criticalFailures.length,
    reviewFlagCount: reviewFlags.length
  };

  const jsonPath = path.join(outputDir, "tooltip-gui-audit.json");
  const csvPath = path.join(outputDir, "tooltip-gui-audit-details.csv");
  const mdPath = path.join(outputDir, "tooltip-gui-audit-summary.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  writeCsv(csvPath, [[
    "locale", "viewport_width", "viewport_height", "sample_type", "sample_key",
    "rendered_characters", "outside_viewport", "untranslated_cyrillic_fields",
    "missing_displayed_fields", "clipped_text_box_count", "rendered_text"
  ], ...detailRows]);

  const markdown = [
    "# Montazhnaya — tooltip GUI localization audit",
    "",
    "- Generated: " + report.generatedAt,
    "- Locales: **" + report.summary.selectableLocales + "**",
    "- Detailed tooltip strings resolved across locales: **" + report.summary.totalDetailedTooltipTranslationsChecked + " / " + report.summary.expectedDetailedTooltipTranslations + "** (Russian is the source language)",
    "- Action help definitions: **" + report.summary.actionDefinitions + "**",
    "- Control/property help definitions: **" + report.summary.controlDefinitions + "**",
    "- Beginner-friendly overrides: **" + report.summary.beginnerFriendlyOverrides + "**",
    "- Viewports: **1024×700, 1366×768, 1920×1080**",
    "- Action/control tooltip samples: **" + report.summary.renderedHelpSamples + "**",
    "- Individual detailed tooltip fragments rendered: **" + report.summary.renderedTooltipFragments + "**",
    "- Detailed tooltip fragments not rendered: **" + report.summary.fragmentDisplayFailures + "**",
    "- Detailed tooltip overflow flags: **" + report.summary.fragmentOverflowCount + "**",
    "- Untranslated detailed tooltip fragments: **" + report.summary.fragmentUntranslatedCyrillic + "** (review candidates)",
    "- Popover viewport checks: **" + report.summary.popoverViewportChecks + "**",
    "- Popovers outside the visible viewport: **" + report.summary.outsideViewportCount + "**",
    "- Critical failures: **" + report.summary.criticalFailureCount + "**",
    "- Manual-review flags: **" + report.summary.reviewFlagCount + "**",
    "",
    "## Locale results",
    "",
    "| Locale | Direction | Detailed strings | Action help | Control help | Detailed fragments rendered | Action/control samples | Outside viewport | Review flags |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ...localeSummaries.map(item => {
      const fragmentCount = item.viewports.reduce((sum, viewport) => sum + viewport.renderedTooltipFragments, 0);
      const sampleCount = item.viewports.reduce((sum, viewport) => sum + viewport.renderedSamples, 0);
      const outside = item.viewports.reduce((sum, viewport) => sum + viewport.outsideViewport + viewport.fragmentOutsideViewport, 0);
      const flags = item.viewports.reduce((sum, viewport) =>
        sum + viewport.untranslatedCyrillicFields + viewport.clippedTextBoxes + viewport.missingDisplayedFields +
          viewport.fragmentOverflowCount + viewport.fragmentUntranslatedCyrillic + viewport.fragmentDisplayFailures, 0);
      return "| " + item.code + " | " + item.actualDirection + " | " + item.detailedTooltipFragments +
        " | " + item.actionDefinitions + " | " + item.controlDefinitions + " | " + fragmentCount + " | " + sampleCount +
        " | " + outside + " | " + flags + " |";
    }),
    "",
    "## Critical failures",
    "",
    ...(criticalFailures.length ? criticalFailures.map(item => "- " + item) : ["None recorded."]),
    "",
    "## Interpretation",
    "",
    "This test ran inside the live Electron renderer and called the editor's actual localization API and tooltip-rendering function. Every one of the 364 detailed tooltip fragments is rendered in the real card for every locale at each of the three viewport sizes; action/control help definitions, beginner-friendly overrides and live DOM targets are also exercised.",
    "",
    "It is a technical GUI smoke test, not a native-speaker linguistic certification. Untranslated Cyrillic, clipped text boxes, unchanged Russian source strings and screenshots still require human review. Dynamic clips and media-specific tooltips may require a separate project fixture with imported sample media.",
    ""
  ].join("\n");

  fs.writeFileSync(mdPath, markdown, "utf8");
  client.close();
  activeClient = null;

  process.stdout.write("\nAudit complete.\n");
  process.stdout.write("Report: " + mdPath + "\n");
  process.stdout.write("Screenshots: " + outputDir + "\n");
  process.stdout.write("Critical failures: " + criticalFailures.length + "\n");

  if (criticalFailures.length) process.exitCode = 1;
}

main().catch(error => {
  if (activeClient) activeClient.close();
  process.stderr.write("Tooltip GUI audit failed: " + (error.stack || error.message) + "\n");
  process.exitCode = 1;
});
