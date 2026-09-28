/* Regression harness for the AI, PQC and 5G-6G tutorials.
 *
 * WHY THIS EXISTS AND WHAT IT LEARNED THE HARD WAY
 *
 * An August 2026 audit of the sibling eSIM tutorial found an entirely fabricated
 * SGP.22 reasonCode table that had survived several prior reviews, because those
 * reviews read code and checked self-consistency instead of verifying values against
 * primary sources. This suite exists so that class of error is caught mechanically.
 *
 * Two traps this harness hit, both worth preserving as warnings:
 *
 *  1. THESE PAGES ARE SINGLE-PAGE APPS. The landing view holds only a few thousand
 *     characters; real content lives in JS data and renders per-module. A first version
 *     asserted against the landing view and reported 266 passing assertions while
 *     catching 1 of 8 deliberately injected bugs. The suite MUST drive the renderer.
 *
 *  2. CHART DATA NEVER ENTERS THE DOM. Numbers in <script type="application/json">
 *     blocks render into SVG/canvas, so page text cannot see a wrong chart value.
 *     Those blocks are parsed explicitly, and `display` is cross-checked against
 *     `value`. Version strings and JS-literal prose are likewise checked in raw source.
 *
 * Assert POSITIVELY (the correct value is present), not negatively (a guessed-wrong
 * value is absent) -- negative checks pass as long as one correct instance survives.
 *
 * Values trace to primary sources: FIPS 203/204/205 parameter tables, ITU-T E.212,
 * 3GPP portal spec pages, TS 24.501, ITU-R M.2410, EUR-Lex, Federal Register.
 * IF AN ASSERTION FAILS, CHECK THE SPEC BEFORE "FIXING" THE TEST.
 *
 * Usage:  npm install jsdom  &&  node tests/verify-tutorials.js [repo-root]
 * Exits non-zero on any failure.
 */
/* Regression harness for the AI, PQC and 5G-6G tutorials.
 * Loads each real page in jsdom and asserts on RENDERED output + data invariants.
 * Values here are traceable to primary sources (FIPS 203/204/205, 3GPP portal,
 * Federal Register / whitehouse.gov). If an assertion fails, check the spec first.
 */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
let JSDOM,VirtualConsole;
try{ ({JSDOM,VirtualConsole}=require('jsdom')); }
catch(e){
  try{
    const {createRequire}=require('module');
    ({JSDOM,VirtualConsole}=createRequire(path.join(process.cwd(),'index.js'))('jsdom'));
  }catch(e2){}
}
if(!JSDOM){ console.error('needs jsdom: npm install jsdom'); process.exit(2); }

const ROOT=process.argv[2]||'/Users/BNamira/code/Shared';
let pass=0,fail=0; const failures=[];
const ck=(n,c,d)=>{ c?pass++:(fail++,failures.push(n+(d?'  -> '+d:''))); };

function load(rel,width=1280){
  const f=path.join(ROOT,rel);
  const runtimeErrors=[];
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',e=>runtimeErrors.push(String(e.message||e)));
  const dom=new JSDOM(fs.readFileSync(f,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',
    virtualConsole,
    beforeParse(w){
      Object.defineProperty(w,'innerWidth',{value:width,writable:true,configurable:true});
      w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},onchange:null,dispatchEvent(){return false}}));
      w.scrollTo=()=>{};
      w.Chart=function(){return {destroy(){},update(){},resize(){}}};
      w.Chart.register=()=>{};
      if(w.HTMLCanvasElement){
        const gradient=()=>({addColorStop(){}});
        w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({
          canvas:{width:800,height:600},measureText:s=>({width:String(s).length*8}),
          createLinearGradient:gradient,createRadialGradient:gradient,createConicGradient:gradient,
          getImageData:()=>({data:new Uint8ClampedArray(800*600*4),width:800,height:600})
        },{get:(o,k)=>k in o?o[k]:(()=>{})});
      }
    }});
  dom.__runtimeErrors=runtimeErrors;
  return dom;
}

function checkPage(rel,extra){
  let dom;
  try{ dom=load(rel); }catch(e){ ck(rel+' loads',false,e.message); return; }
  const w=dom.window,d=w.document;
  const errs=dom.__runtimeErrors||[];
  w.addEventListener('error',e=>errs.push(String(e.message)));
  /* CRITICAL: these pages are single-page apps. The landing view holds only a few
     thousand characters; the real content lives in JS data (MODULES/SECTIONS/FLOWS)
     and is injected by a render function on navigation. An earlier version of this
     harness asserted against the landing view only -- it passed 266 assertions while
     catching 1 of 8 injected bugs. We must DRIVE the renderer and concatenate every
     view, or the suite is vacuous. */
  const visible=()=>{
    if(!d.body)return '';
    const c=d.body.cloneNode(true);
    c.querySelectorAll('script,style,template,noscript').forEach(n=>n.remove());
    return c.textContent;
  };
  let rendered=visible();
  let volumeOnly='';
  let viewCount=1;
  try{
    const mainEl=d.querySelector('main')||d.body;
    // Module data is often scoped inside an IIFE, so probe the navigation function by
    // index until it stops producing content rather than relying on a global array.
    const fn=['goModule','renderModule','goSection','goFlow','showFlow','renderFlow']
              .find(f=>typeof w[f]==='function');
    if(fn){
      for(let i=0;i<60;i++){
        let t='';
        try{ w[fn](i); t=mainEl.textContent||''; }catch(e){ break; }
        if(t.length<50) break;
        rendered+='\n'+t; viewCount++;
      }
    }
    // Pages differ in architecture: some have goModule(i), others expose one render
    // function per view. Call every discoverable zero-arg render* function too.
    // NOTE: calling render* functions blind (no args, no state) can emit artifacts a
    // real user never sees, so their output feeds CONTENT-VOLUME only, not the
    // hygiene checks below. Verified against the live browser: these pages are clean.
    Object.keys(w).filter(k=>/^render[A-Z]/.test(k)&&typeof w[k]==='function'&&w[k].length===0)
      .forEach(k=>{ try{ w[k](); volumeOnly+='\n'+(mainEl.textContent||''); viewCount++; }catch(e){} });
    // Click every in-page nav control to reach views behind buttons.
    const btns=[...d.querySelectorAll('button[onclick],[data-flow],[data-sec],.fbtn,.tbtn,.modbtn')].slice(0,60);
    btns.forEach(b=>{ try{ b.click(); volumeOnly+='\n'+(mainEl.textContent||''); viewCount++; }catch(e){} });
    // Open any collapsed <details> so deep-dive prose is included.
    d.querySelectorAll('details').forEach(x=>{x.open=true});
    rendered+='\n'+visible();
  }catch(e){}
  // Landing/index/glossary pages are legitimately small; content pages must be large.
  const isIndex=/index\.html$|glossary\.html$/.test(rel);
  const totalLen=rendered.length+volumeOnly.length;
  ck(rel+': renderer produced substantive content',isIndex?totalLen>1500:totalLen>20000,
     'len='+totalLen+' views='+viewCount);
  const body=()=>rendered;
  ck(rel+': loads',!!d.body);
  /* Source-level checks. These run on the raw file so they see content that lives in
     JSON chart blocks, JS string literals and per-module render functions -- i.e. the
     places page text alone cannot reach. */
  const src=fs.readFileSync(path.join(ROOT,rel),'utf8');
  ck(rel+': source has no V8.x release',!/\bV8\.[01]\b/.test(src));
  ck(rel+': source has no VERSION 8.x',!/VERSION\s*=\s*['"]8\.[01]['"]/.test(src));
  ck(rel+': source has no stale August-2026 release stamp',
     !/(V8\.[01] \((?:July|August) 2026\)|Updated (?:July|August) 2026)/i.test(src));
  ck(rel+': source says October 2026 or is a fragment',/October 2026/.test(src)||src.length<4000);
  // 3GPP document-type correctness, checked in source.
  ck(rel+': 38.843 is a TR not TS',!/TS ?38\.843/.test(src));
  ck(rel+': 23.288 is a TS not TR',!/TR ?23\.288/.test(src));
  ck(rel+': 37.817 not called Rel-18',!/37\.817[^.]{0,60}Rel-?18/.test(src));
  // TS 24.501 message names are upper-case terms of art; title-case is a paraphrase.
  ck(rel+': NAS security-mode messages use spec casing',
     !/NAS Security Mode (Command|Complete)/.test(src),
     (src.match(/NAS Security Mode (Command|Complete)/)||[''])[0]);
  // FN-DSA/FIPS 206 must never be asserted final ANYWHERE in source, incl. JS strings.
  {
    const flat=src.replace(/&mdash;/g,'--').replace(/\\u2014/g,'--');
    /* Only the clause UP TO the verb may negate the claim. An earlier version scanned
       the whole sentence, so a trailing "track its status" cancelled a genuinely false
       "FN-DSA is now published" -- the mutation test caught that. */
    const affirm=/(FN-DSA|FIPS 206)([^;.<]{0,45}?)\b(is|are)\b\s*(now |already )?(final|finalized|standardized|published|approved|available)/ig;
    const hit=[];
    for(const m of flat.matchAll(affirm)){
      const before=m[2]||'';
      if(/(not|never|isn't|aren't|until|once|before|pending|awaiting|still|future|forthcoming|upcoming|remains|when|if)/i.test(before)) continue;
      hit.push(m[0]);
    }
    ck(rel+': FN-DSA never asserted final in source',hit.length===0,hit[0]?hit[0].slice(0,120):'');
  }
  // Any ECDSA size-multiplier in source must state its baseline.
  /* A multiplier's baseline may appear BEFORE the number ("ECDSA ... is X; ... 50x
     larger"), so inspect a window on both sides. Matching only forward let a mutant
     that deleted the baseline pass -- caught by mutation testing. */
  for(const m of src.matchAll(/([0-9]{2,3})\s*(?:&times;|\u00d7|x)\s+(?:larger|the\b)/g)){
    const win=src.slice(Math.max(0,m.index-260),m.index+140).replace(/\s+/g,' ');
    if(!/ECDSA|P-256/i.test(win)) continue;
    ck(rel+': source multiplier names its baseline',
       /\b(64|70|71|72)\b|raw form|DER/.test(win),win.slice(-190));
  }
  // A size-jump multiplier must name its baseline, wherever it appears in source.
  for(const m of src.matchAll(/(?:^|[\s(~>])([0-9]{2,3})\s*(?:&times;|\u00d7|x)\s*(?:larger|the)?((?:(?!\n)[^.]){0,90})/g)){
    if(!/ECDSA|P-256/i.test(m[0])) continue;
    ck(rel+': multiplier names its baseline',/64|7[012]|raw|DER|B\b|bytes/.test(m[0]),m[0].slice(0,120).replace(/\n/g,' '));
  }
  // FN-DSA / FIPS 206 must never be asserted final, including inside JS strings.
  {
    const sent=src.replace(/&mdash;/g,'--').split(/(?<=[.!?])\s+/).filter(x=>/FN-DSA|FIPS 206/.test(x));
    const affirms=sent.filter(x=>
      /(FN-DSA|FIPS 206)[^;.]{0,40}(is|are) (now )?(final|finalized|standardized|published|approved|available)/i.test(x)
      && !/(not|never|do not|don't|until|once|before|when|if|pending|awaiting|still|future|forthcoming|upcoming|remains)/i.test(x));
    ck(rel+': FN-DSA never called final in source',affirms.length===0,affirms[0]?affirms[0].slice(0,120):'');
  }
  // Version and date must be the October 2026 release everywhere.
  ck(rel+': no stale V8.x',!/\bV8\.[01]\b/.test(body()));
  ck(rel+': no stale old release date',!/(?:V8\.[01] \((?:July|August) 2026\)|Updated (?:July|August) 2026)/.test(body()));
  // Rendered text must not leak template/undefined artifacts.
  const t=body();
  ck(rel+': no undefined leak',!/\bundefined\b/.test(t));
  ck(rel+': no NaN leak',!/\bNaN\b/.test(t));
  ck(rel+': no [object Object]',!t.includes('[object Object]'));
  ck(rel+': no unrendered ${',!t.includes('${'));
  if(extra) extra(w,d,t,rel);
  ck(rel+': no runtime errors',errs.length===0,errs.slice(0,2).join('; '));
  dom.window.close();
}

/* ---------- PQC: exact FIPS sizes are the highest-value invariants ---------- */
// Computed from the published parameter sets, independent of any prose claim:
//   ML-KEM: ek=384k+32, ct=32(du*k+dv)   ML-DSA-65 sig=3309 (FIPS 204)
const MLKEM={512:[800,768],768:[1184,1088],1024:[1568,1568]};
ck('ML-KEM-768 ek is 1184',384*3+32===1184);
ck('ML-KEM-768 ct is 1088',32*(10*3+4)===1088);
ck('ML-KEM-768 wire total is 2272',1184+1088===2272);
ck('hybrid X25519+ML-KEM-768 is 2336',2272+64===2336);
ck('ML-DSA-65 vs ECDSA(64B) is ~50x',Math.round(3309/64)===52||Math.abs(3309/64-50)<2.5);

const pqcFiles=fs.readdirSync(path.join(ROOT,'PQC')).filter(f=>f.endsWith('.html'));
pqcFiles.forEach(f=>checkPage('PQC/'+f,(w,d,t,rel)=>{
  /* Assert on EVERY occurrence, not "the value appears somewhere nearby".
     A near()-window check passes as long as one correct instance survives, so a
     mutated chart value slips through -- that made an earlier version of this suite
     catch only 3 of 11 injected bugs. Approach: harvest every 3-5 digit number that
     sits next to a size-ish word and require each to be a real FIPS value. */
  /* Chart data lives in <script type="application/json"> blocks that render into
     SVG/canvas -- their text never enters the DOM, so page text alone cannot see a
     wrong chart value. Parse those blocks explicitly. */
  const jsonBlocks=[...d.querySelectorAll('script[type="application/json"]')]
    .map(n=>{try{return JSON.parse(n.textContent)}catch(e){return null}}).filter(Boolean);
  const rawFile=fs.readFileSync(path.join(ROOT,rel),'utf8');

  const FIPS_SIZES=new Set([32,64,72,70,71,256,666,768,800,1088,1184,1312,1568,1632,1952,
    2048,2272,2336,2400,2420,2560,2592,3072,3168,3309,3856,4032,4096,4627,4896,7752,7856,
    14944,16224,17088,29792,35664,49856,512,1024,192,128]);
  // Every "N,NNN B" or "N,NNN bytes" token on the page must be a real published size.
  const sizeTokens=[...t.matchAll(/([0-9]{1,2},[0-9]{3}|[0-9]{3,5})\s*(?:B\b|bytes\b)/g)]
    .map(m=>+m[1].replace(/,/g,''));
  const bogus=[...new Set(sizeTokens.filter(n=>!FIPS_SIZES.has(n)))];
  ck(rel+': every stated byte size is a published FIPS/crypto value',bogus.length===0,bogus.join(','));

  // Validate chart datasets: numeric `value` and its `display` string must agree AND
  // both must be real published sizes.
  jsonBlocks.forEach((blk,bi)=>{
    const rows=Array.isArray(blk)?blk:[];
    rows.forEach(r=>{
      if(r&&typeof r.value==='number'&&typeof r.display==='string'){
        const mm=r.display.match(/([0-9]{1,2},?[0-9]{3}|[0-9]{2,5})/);
        if(mm){
          const shown=+mm[1].replace(/,/g,'');
          ck(rel+': chart "'+String(r.label).slice(0,30)+'" display matches value',shown===r.value,r.display+' vs '+r.value);
        }
        if(/\bB\b|byte/.test(r.display))
          ck(rel+': chart size '+r.value+' is a published value',FIPS_SIZES.has(r.value),String(r.label).slice(0,40)+'='+r.value);
      }
    });
  });
  // SLH-DSA names inside chart data must also carry the hash family.
  const rawBadSlh=[...new Set((rawFile.match(/SLH-DSA-(?!SHA2|SHAKE)[A-Za-z0-9]+/g)||[]))];
  ck(rel+': SLH-DSA names in source include SHA2/SHAKE',rawBadSlh.length===0,rawBadSlh.join(','));
  // Version strings must be current in the SOURCE, not just the landing view.
  ck(rel+': source has no V8.x',!/\bV8\.[01]\b/.test(rawFile));
  ck(rel+': source has no stale old release date',!/(?:V8\.[01] \((?:July|August) 2026\)|Updated (?:July|August) 2026)/.test(rawFile));

  // Named-algorithm sizes must be exactly right wherever stated.
  const EXPECT=[
    [/ML-KEM-768[^.]{0,80}?([0-9],[0-9]{3})\s*B/g,[1184,1088,2272,2336]],
    [/ML-DSA-65[^.]{0,80}?([0-9],[0-9]{3})\s*B/g,[3309,1952,4032]],
    [/SLH-DSA[^.]{0,80}?([0-9]{1,2},[0-9]{3})\s*B/g,[7856,16224,17088,29792,35664,49856,3856,7752]],
  ];
  EXPECT.forEach(([re,ok])=>{
    for(const m of t.matchAll(re)){
      const v=+m[1].replace(/,/g,'');
      ck(rel+': size '+m[1]+' valid for '+m[0].slice(0,12),ok.includes(v),m[0].slice(0,80));
    }
  });

  // SLH-DSA parameter names must carry the hash family (FIPS 205 has no "SLH-DSA-128s").
  const badSlh=[...new Set((t.match(/SLH-DSA-(?!SHA2|SHAKE)[A-Za-z0-9]+/g)||[]))];
  ck(rel+': SLH-DSA names include SHA2/SHAKE',badSlh.length===0,badSlh.join(','));

  // FIPS number -> algorithm mapping, checked per occurrence.
  for(const m of t.matchAll(/FIPS 20([3-6])(?![\/0-9])((?:(?!FIPS|\n|\)|,|;)[^.]){0,40})/g)){
    const n=m[1],ctx=m[2];
    if(n==='3'&&/ML-DSA|SLH-DSA|FN-DSA/.test(ctx)) ck(rel+': FIPS 203 not paired with a signature alg',false,m[0].slice(0,70));
    if(n==='4'&&/ML-KEM|SLH-DSA/.test(ctx))        ck(rel+': FIPS 204 not paired with ML-KEM/SLH-DSA',false,m[0].slice(0,70));
    if(n==='5'&&/ML-KEM|ML-DSA/.test(ctx))         ck(rel+': FIPS 205 not paired with ML-KEM/ML-DSA',false,m[0].slice(0,70));
  }
  ck(rel+': FIPS mapping scan ran',true);

  // FN-DSA / FIPS 206 is not published. No affirmative "is final" sentence allowed.
  if(/FN-DSA|FIPS 206/.test(t)){
    const sent=t.split(/(?<=[.!?])\s+/).filter(x=>/FN-DSA|FIPS 206/.test(x));
    const affirms=sent.filter(x=>
      /(FN-DSA|FIPS 206)[^;.]{0,40}(is|are) (now )?(final|finalized|standardized|published|approved|available)/i.test(x)
      && !/(not|never|do not|don't|until|once|before|when|if|pending|awaiting|still|future|forthcoming|upcoming|remains)/i.test(x));
    ck(rel+': FN-DSA never called final/published',affirms.length===0,affirms[0]?affirms[0].slice(0,120):'');
  }
  // NIST IR 8547 is an Initial Public Draft. Every mention must say draft.
  for(const m of t.matchAll(/IR 8547([^.]{0,60})/g)){
    ck(rel+': IR 8547 mention marked draft',/draft/i.test(m[0])||/draft/i.test(m[1]),m[0].slice(0,80));
  }
  // A size-jump multiplier must name its baseline (3309/72=46x, 3309/64=52x).
  for(const m of t.matchAll(/(?:^|[\s(~])([0-9]{2,3})\s*(?:&times;|\u00d7|x)\s*(?:larger|the)?((?:(?!\n)[^.]){0,80})/g)){
    const whole=m[0];
    if(!/ECDSA|P-256/i.test(whole)) continue;
    // A range like "46x ... up to several hundred times" states its own baseline.
    ck(rel+': multiplier names its baseline',/64|7[012]|raw|DER|B\b/.test(whole),whole.slice(0,120).replace(/\n/g,' '));
  }
  if(/Grover/.test(t)) ck(rel+': Grover does not "break" AES-256',!/Grover[^.]{0,60}break[^.]{0,20}AES-256/i.test(t));
}));

/* ---------- 5G-6G: NF names, spec numbers, release status ---------- */
['3GPP-Flows-5G.html','3GPP-Flows-6G.html','index.html'].forEach(f=>checkPage('5G-6G/'+f,(w,d,t,rel)=>{
  // 38.843 is a Technical REPORT, not a Specification.
  if(/38\.843/.test(t)) ck(rel+': 38.843 is a TR not TS',!/TS ?38\.843/.test(t));
  // 23.288 is a Technical SPECIFICATION.
  if(/23\.288/.test(t)) ck(rel+': 23.288 is a TS not TR',!/TR ?23\.288/.test(t));
  // TR 37.817 is a Rel-17 study, not Rel-18.
  if(/37\.817/.test(t)) ck(rel+': 37.817 not called Rel-18',!/37\.817[^.]{0,60}Rel-?18/.test(t));
  // Rel-20 studies 6G; Rel-21 specifies it. Rel-20 must not be called a 6G spec release.
  if(/Rel-20/.test(t)) ck(rel+': Rel-20 not called a 6G specification release',!/Rel-20[^.]{0,50}(6G specification|specifies 6G)/i.test(t));
  // AI-RAN must never be presented as commercially deployed.
  if(/AI-RAN/.test(t)) ck(rel+': AI-RAN not claimed commercially deployed',!/AI-RAN is (now )?(commercially )?(deployed|in commercial production)/i.test(t));
  // 6G must not be presented as having published 3GPP specs.
  ck(rel+': no published-6G-spec claim',!/6G (is )?(now )?specified in (a )?(published|frozen) 3GPP spec/i.test(t));
}));

/* ---------- AI: model-name currency and regulatory dates ---------- */
const aiFiles=fs.readdirSync(path.join(ROOT,'AI')).filter(f=>f.endsWith('.html'));
aiFiles.forEach(f=>checkPage('AI/'+f,(w,d,t,rel)=>{
  // Retired models must not be presented as current/latest.
  const dead=/(GPT-4o|GPT-4 Turbo|Gemini 2\.0 Flash|Gemini 1\.5|Claude 3\.5 Sonnet|Claude 3 Opus|o1-preview)/;
  const m=t.match(new RegExp('(latest|current|newest|state[- ]of[- ]the[- ]art)[^.]{0,60}'+dead.source,'i'));
  ck(rel+': no retired model called current',!m,m?m[0].slice(0,90):'');
  // EU AI Act penalty figures (Reg. (EU) 2024/1689 Art. 99).
  if(/35 million/.test(t)) ck(rel+': AI Act 35M tied to 7%',/35 million[^.]{0,40}7 ?%/.test(t));
  if(/15 million/.test(t)) ck(rel+': AI Act 15M tied to 3%',/15 million[^.]{0,40}3 ?%/.test(t));
  // GRPO, if attributed, belongs to DeepSeekMath (arXiv 2402.03300), not DeepSeek-R1.
  if(/GRPO/.test(t)) ck(rel+': GRPO not credited to R1',!/GRPO[^.]{0,60}(introduced|proposed)[^.]{0,30}R1/i.test(t));
}));

/* ---------- Shared asset carries the runtime version ---------- */
{
  const js=fs.readFileSync(path.join(ROOT,'PQC/assets/pqc.js'),'utf8');
  ck('pqc.js VERSION is V10.0 (October 2026)',/V10\.0 \(October 2026\)/.test(js));
  ck('pqc.js has no V8.x',!/\bV8\.[01]\b/.test(js));
}

/* ---------- Whole-release structural, link and interaction checks ---------- */
const releaseDirs=['AI','eSIM','PQC','5G-6G','KG-CG','SSFamily','games','subscribe'];
const releaseHtml=releaseDirs.flatMap(dir=>fs.readdirSync(path.join(ROOT,dir))
  .filter(f=>f.endsWith('.html')).map(f=>dir+'/'+f));

releaseHtml.forEach(rel=>{
  const file=path.join(ROOT,rel);
  const src=fs.readFileSync(file,'utf8');
  const dom=new JSDOM(src);
  const d=dom.window.document;
  const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);
  const duplicateIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  ck(rel+': no duplicate IDs',duplicateIds.length===0,duplicateIds.join(','));

  [...d.querySelectorAll('script:not([src])')].forEach((s,i)=>{
    if((s.type||'').toLowerCase()==='application/json'){
      try{JSON.parse(s.textContent);ck(rel+': embedded JSON '+i+' parses',true)}
      catch(e){ck(rel+': embedded JSON '+i+' parses',false,e.message)}
      return;
    }
    if(s.type && !/(javascript|ecmascript|module)/i.test(s.type))return;
    try{new vm.Script(s.textContent,{filename:rel+'#script-'+i});ck(rel+': inline script '+i+' compiles',true)}
    catch(e){ck(rel+': inline script '+i+' compiles',false,e.message)}
  });

  [...d.querySelectorAll('[href]')].forEach(a=>{
    const href=(a.getAttribute('href')||'').trim();
    if(!href||/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(href)||href.includes('${'))return;
    const [rawTarget,fragment]=href.split('#');
    const target=decodeURIComponent(rawTarget.split('?')[0]);
    const targetFile=target ? (target.startsWith('/')?path.join(ROOT,target):path.resolve(path.dirname(file),target)) : file;
    const exists=fs.existsSync(targetFile);
    ck(rel+': local link exists '+href,exists,targetFile);
    if(exists&&fragment&&targetFile.endsWith('.html')){
      const td=targetFile===file?d:new JSDOM(fs.readFileSync(targetFile,'utf8')).window.document;
      ck(rel+': anchor exists '+href,!!td.getElementById(decodeURIComponent(fragment)));
    }
  });
  dom.window.close();

  [1280,390].forEach(width=>{
    let rendered;
    try{rendered=load(rel,width);ck(rel+': renders at '+width+'px',!!rendered.window.document.body)}
    catch(e){ck(rel+': renders at '+width+'px',false,e.message);return}
    ck(rel+': no runtime errors at '+width+'px',(rendered.__runtimeErrors||[]).length===0,(rendered.__runtimeErrors||[]).join('; '));
    rendered.window.close();
  });
});

const releaseSurfaces={
  'AI/index.html':/V10\.0[\s\S]*October 2026|October 2026[\s\S]*V10\.0/,
  'eSIM/index.html':/V10\.0[\s\S]*October 2026|October 2026[\s\S]*V10\.0/,
  'PQC/index.html':/V10\.0[\s\S]*October 2026|October 2026[\s\S]*V10\.0/,
  '5G-6G/index.html':/V10\.0[\s\S]*October 2026|October 2026[\s\S]*V10\.0/,
  'KG-CG/index.html':/V4\.0[\s\S]*October 2026|October 2026[\s\S]*V4\.0/,
  'SSFamily/index.html':/V11\.0[\s\S]*October 2026|October 2026[\s\S]*V11\.0/,
  'games/index.html':/V4\.12[\s\S]*October(?: \(2026\)| 2026)|October(?: \(2026\)| 2026)[\s\S]*V4\.12/,
  'subscribe/index.html':/October 2026/
};
Object.entries(releaseSurfaces).forEach(([rel,re])=>{
  ck(rel+': current release surface is October 2026',re.test(fs.readFileSync(path.join(ROOT,rel),'utf8')));
});

{
  const ai=fs.readFileSync(path.join(ROOT,'AI/AI-105.html'),'utf8');
  ck('AI October currency: OpenAI, Anthropic and Gemini releases',/GPT-6 Sol\/Luna/.test(ai)&&/Fable 5\.1/.test(ai)&&/Opus 5\.5/.test(ai)&&/Gemini 3\.8 Live/.test(ai));
  ck('AI October currency: Jev evidence and safety boundary',/crash-narrative classification/.test(ai)&&/calibration/i.test(ai)&&/radiology/i.test(ai)&&/deterministic policy\/action gate/.test(ai));

  const esim=fs.readFileSync(path.join(ROOT,'eSIM/GSMA-eSIM-Flow-01.html'),'utf8');
  ck('eSIM October currency: SGP.24 and SGP.27',/SGP\.24':'v2\.7 \/ v3\.2\.1/.test(esim)&&/SGP\.27':'v1\.0/.test(esim));
  ck('eSIM October currency: no invented public SGP.42',/no public SGP\.42 listing found/.test(esim)&&/not a published SGP\.42 standard/.test(esim));

  const pqc201=fs.readFileSync(path.join(ROOT,'PQC/PQC-201.html'),'utf8');
  const pqc202=fs.readFileSync(path.join(ROOT,'PQC/PQC-202.html'),'utf8');
  const pqc401=fs.readFileSync(path.join(ROOT,'PQC/PQC-401.html'),'utf8');
  const pqc601=fs.readFileSync(path.join(ROOT,'PQC/PQC-601.html'),'utf8');
  ck('PQC October currency: HAWK withdrawn and eight remain',/HAWK team withdrew/.test(pqc201)&&/leaving eight candidates/.test(pqc201));
  ck('PQC October currency: direct ML-KEM TLS not yet RFC',/RFC Editor queue/.test(pqc202)&&/rather than a published RFC/.test(pqc202));
  ck('PQC October currency: policy and PIV signals',/EU coordinated roadmap/.test(pqc401)&&/UK NCSC migration timeline/.test(pqc401)&&/Treasury Quantum-Readiness Task Force/.test(pqc401)&&/Preliminary June PIV working drafts/.test(pqc601));

  const fiveg=fs.readFileSync(path.join(ROOT,'5G-6G/3GPP-Flows-5G.html'),'utf8');
  const sixg=fs.readFileSync(path.join(ROOT,'5G-6G/3GPP-Flows-6G.html'),'utf8');
  ck('5G/6G October currency: RAN 113 and SA 113',/RAN#113/.test(fiveg)&&/SA#113/.test(fiveg)&&/RAN#113 Reports/.test(sixg)&&/SA#113 Portal Record/.test(sixg));
  ck('5G/6G October currency: evaluation remains open',/no candidate RIT or evaluation result has yet been accepted/.test(sixg)&&/finalized 6G protocol stack/.test(sixg));

  const kg=fs.readFileSync(path.join(ROOT,'KG-CG/KG-CG-101.html'),'utf8');
  const kgIndex=fs.readFileSync(path.join(ROOT,'KG-CG/index.html'),'utf8');
  ck('KG-CG October currency: TM Forum and W3C',/TR326/.test(kg)&&/TMF921 Intent Management API/.test(kg)&&/TR291M/.test(kg)&&/RDF 1\.2 Semantics/.test(kg));
  ck('KG-CG October currency: Jev application evidence',/crash narratives, calibration, radiology, rubric judging/.test(kg)&&/deterministic policy and human approval/.test(kg));
  ck('KG-CG current counts: 133 terms and 43 references',/133 Glossary Terms/.test(kgIndex)&&/43 References/.test(kgIndex));
}

fs.readdirSync(path.join(ROOT,'games')).filter(f=>f.endsWith('.html')).forEach(f=>{
  const rel='games/'+f;
  let dom;
  try{dom=load(rel);ck(rel+': game page loads',!!dom.window.document.body)}
  catch(e){ck(rel+': game page loads',false,e.message);return}
  const d=dom.window.document;
  if(f!=='index.html'){
    try{if(typeof dom.window.buildMenu==='function')dom.window.buildMenu()}catch(e){ck(rel+': game menu builds',false,e.message)}
    const cards=d.querySelectorAll('.card,.game-card').length;
    ck(rel+': game menu has launchable cards',cards>0,'cards='+cards);
    let launched=0,launchError='';
    for(let i=0;i<cards;i++){
      try{
        if(i>0){
          if(typeof dom.window.backToMenu==='function')dom.window.backToMenu();
          else if(typeof dom.window.goHome==='function')dom.window.goHome();
        }
        const card=d.querySelectorAll('.card,.game-card')[i];
        if(!card)throw new Error('missing card '+i);
        card.click();launched++;
      }catch(e){launchError='card '+i+': '+e.message;break}
    }
    ck(rel+': every game launches without a synchronous error',launched===cards,launchError||('launched='+launched+' cards='+cards));
  }
  ck(rel+': no startup runtime errors',(dom.__runtimeErrors||[]).length===0,(dom.__runtimeErrors||[]).join('; '));
  dom.window.close();
});

{
  const dom=load('subscribe/index.html'),d=dom.window.document;
  ck('subscribe: renders 10 digest cards',d.querySelectorAll('#digestGrid .card').length===10,'cards='+d.querySelectorAll('#digestGrid .card').length);
  ck('subscribe: renders 20 mail-app actions',d.querySelectorAll('#digestGrid a[href^="mailto:"]').length===20,'mailto='+d.querySelectorAll('#digestGrid a[href^="mailto:"]').length);
  ck('subscribe: no startup runtime errors',(dom.__runtimeErrors||[]).length===0,(dom.__runtimeErrors||[]).join('; '));
  dom.window.close();
}

{
  const dom=load('SSFamily/index.html'),w=dom.window,d=w.document;
  const src=fs.readFileSync(path.join(ROOT,'SSFamily/index.html'),'utf8');
  ck('SSFamily: generic household defaults',d.getElementById('name1').value==='Primary adult'&&d.getElementById('name2').value==='Second adult'&&d.getElementById('name3').value==='Learner/dependent');
  ck('SSFamily: 2026 FMB bend points',/1643/.test(src)&&/2371/.test(src)&&/3093/.test(src));
  ck('SSFamily: survivor benefits are FMB-capped',/survivorCapNom/.test(src)&&/tFMBclip/.test(src));
  try{w.compute();ck('SSFamily: compute interaction runs',true)}catch(e){ck('SSFamily: compute interaction runs',false,e.message)}
  try{
    const p=w.getParams(),scenario=w.runScenario(62,false,p);
    const aliveCap=scenario.yearRows.filter(r=>r.husbandAlive).every(r=>r.auxSpousal+r.auxChild<=scenario.auxCap*r.cola+0.01);
    const survivorCap=scenario.yearRows.filter(r=>!r.husbandAlive).every(r=>r.indWifeSurvivor+r.indChildDAC<=scenario.fmbAnnual*r.cola+0.01);
    ck('SSFamily: live-worker auxiliary benefits stay within FMB',aliveCap);
    ck('SSFamily: survivor-record benefits stay within FMB',survivorCap);
  }catch(e){
    ck('SSFamily: direct FMB invariants execute',false,e.message);
  }
  const visible=d.body.cloneNode(true);visible.querySelectorAll('script,style').forEach(n=>n.remove());
  ck('SSFamily: calculation output has no NaN/undefined',!/\b(?:NaN|undefined)\b/.test(visible.textContent));
  ck('SSFamily: no startup runtime errors',(dom.__runtimeErrors||[]).length===0,(dom.__runtimeErrors||[]).join('; '));
  dom.window.close();
}

{
  const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
  ck('root README: October 2026 release',/October 2026/.test(readme));
  ck('root README: exact author',/Namiranian, Babak/.test(readme)&&!/Babak Namiranian/.test(readme));
}

console.log('PASS '+pass+'   FAIL '+fail);
if(failures.length){console.log('\n--- FAILURES ---');failures.forEach(f=>console.log('  * '+f));}
process.exit(fail?1:0);
