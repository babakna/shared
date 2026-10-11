/* Regression harness for the eSIM Specification Explorer data tables.
 *
 * WHY THIS EXISTS: a July 2026 audit found that most factual lookup tables in this tool
 * were wrong (the entire SGP.22 reasonCode table, the subjectCode 8.2/8.8 mapping, the EID
 * field widths, the PPR bit positions, the SGP.32 interface names) while every page still
 * looked polished and self-consistent. These assertions pin the spec-verified values so a
 * regression is caught mechanically instead of by eye.
 *
 * Each assertion encodes a value traceable to a primary source: GSMA SGP.22 v2.6/v3.1,
 * SGP.02 v4.0, SGP.29, SGP.32 v1.1, ITU-T E.118, ETSI TS 102 221, GlobalPlatform 2.2.1.
 * If an assertion fails, check the spec before "fixing" the test.
 *
 * Usage:  npm install jsdom  &&  node tests/verify-esim-tables.js [path-to-html]
 * Exits non-zero on any failure.
 */
/* End-to-end harness: loads the real page in jsdom, drives the actual DOM widgets,
   and asserts on rendered output. No reimplementation of tool logic. */
const fs=require('fs');
let JSDOM;
try { JSDOM=require('jsdom').JSDOM; }
catch(e){
  /* Node resolves modules relative to this script, so also try the caller's cwd. */
  try {
    const {createRequire}=require('module');
    const req=createRequire(require('path').join(process.cwd(),'index.js'));
    JSDOM=req('jsdom').JSDOM;
  } catch(e2){}
}
if(!JSDOM){
  console.error('This harness needs jsdom. Install it, then re-run:');
  console.error('  npm install jsdom');
  console.error('(or run from a directory where jsdom is already available:');
  console.error('   node /path/to/verify-esim-tables.js /path/to/GSMA-eSIM-Flow-01.html )');
  process.exit(2);
}

const path=require('path');
const HTML=process.argv[2]||path.join(__dirname,'..','GSMA-eSIM-Flow-01.html');
let pass=0,fail=0;const failures=[];
function ck(name,cond,detail){
  if(cond){pass++;}
  else{fail++;failures.push(name+(detail?'  -> '+detail:''));}
}

const dom=new JSDOM(fs.readFileSync(HTML,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
const w=dom.window;

w.addEventListener('load',()=>{
  const d=w.document;
  const errs=[];
  w.addEventListener('error',e=>errs.push(String(e.message)));

  /* ---------- 1. SGP.22 error decoder ---------- */
  function sgp(subj,reason){
    w.curTab='tools-dbg';
    if(typeof w.refreshPane==='function'){
      d.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-tools-dbg'));
      w.refreshPane('tools-dbg');
    }
    d.getElementById('sgp-subj').value=subj;
    d.getElementById('sgp-reason').value=reason;
    d.getElementById('sgp-decode').click();
    return d.getElementById('sgp-result').textContent;
  }

  // The user's original report: 8.1.1 must resolve to EID, not "Unknown subject".
  let t=sgp('8.1.1','3.9');
  ck('8.1.1 resolves to EID',/EID/.test(t),t.slice(0,120));
  ck('8.1.1 not "Unknown subject"',!/Unknown subject/.test(t),t.slice(0,120));
  // 3.9's real meaning is "Unknown", NOT "Incompatible profile (version mismatch)".
  ck('3.9 == Unknown',/Unknown/.test(t),t.slice(0,160));
  ck('3.9 not fabricated meaning',!/Incompatible profile/.test(t),t.slice(0,160));

  // Spec-tabulated pairs must surface the spec's own description.
  t=sgp('8.11.1','3.9');
  ck('8.11.1 = Public Key',/Public Key/.test(t),t.slice(0,140));
  ck('8.11.1|3.9 pair description',/not a trusted root/.test(t),t.slice(0,200));

  t=sgp('8.2.8','1.2');
  ck('8.2.8 = PPR',/PPR/.test(t),t.slice(0,140));
  ck('1.2 = Not Allowed',/Not Allowed \(Authorisation\)/.test(t),t.slice(0,160));

  // 8.2 is Profile and 8.8 is SM-DP+ (NOT reversed).
  t=sgp('8.2','3.7');
  ck('8.2 == Profile',/Profile/.test(t)&&!/SM-DP\+/.test(t.split('Reason')[0]),t.slice(0,140));
  t=sgp('8.8','3.10');
  ck('8.8 == SM-DP+',/SM-DP\+/.test(t),t.slice(0,140));

  // Parent-prefix fallback for an unlisted sub-code.
  t=sgp('8.2.99','2.1');
  ck('unlisted 8.2.99 falls back to parent 8.2',/Profile/.test(t)&&/parent/.test(t),t.slice(0,200));

  // A code outside SGP.22 entirely must say so, not invent a meaning.
  t=sgp('8.3','3.4');
  ck('8.3 not defined in SGP.22',/Not defined in SGP\.22/.test(t),t.slice(0,200));
  ck('3.4 not defined in SGP.22',/Not defined in SGP\.22/.test(t),t.slice(0,220));

  // Validation of junk input.
  t=sgp('abc','3.9');
  ck('non-numeric subject rejected',/numeric/.test(t),t.slice(0,120));

  // XSS: an injected tag must not create a live element.
  sgp('<img src=x onerror=alert(1)>','3.9');
  ck('no injected <img> element',d.getElementById('sgp-result').querySelectorAll('img').length===0);

  /* ---------- 2. EID decoder ---------- */
  function eid(v){
    w.curTab='tools-id';
    d.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-tools-id'));
    if(typeof w.refreshPane==='function')w.refreshPane('tools-id');
    d.getElementById('eid-input').value=v;
    d.getElementById('eid-decode').click();
    return d.getElementById('eid-result').textContent;
  }

  const EID='89033024342011080076013000921427';
  t=eid(EID);
  ck('EID checksum valid',/Valid/.test(t)&&!/Invalid/.test(t),t.slice(0,200));
  // SGP.02 2.2.2 field widths: country=3 (033), platform=5 (34201), issuer info=5 (10800)
  // Country must be the 3-digit field (digits 3-5 = "033"), not a 2-digit truncation ("33").
  ck('country is 3 digits (033)',/Country=033|Country=<b>033/.test(t)||/033/.test(t),t.slice(0,300));
  ck('country field not truncated to 2 digits',!/Country=33\b/.test(t)&&!/Country<\/b>33\b/.test(t),t.slice(0,300));
  {
    const cm=t.match(/Country=(\d+)/);
    ck('country field width is 3',!!cm&&cm[1].length===3,cm?cm[1]:'no match');
  }
  ck('platform is 5 digits (34201)',/34201/.test(t),t.slice(0,300));
  ck('issuer info 10800',/10800/.test(t),t.slice(0,300));
  ck('individual id 760130009214',/760130009214/.test(t),t.slice(0,300));
  // The old wrong 3-digit platform split produced "342" + a 19-digit serial.
  ck('no 19-digit serial 0110800760130009214',!/0110800760130009214/.test(t),t.slice(0,300));
  // Vendor attribution must LEAD with the live company. Oberthur Technologies was renamed
  // IDEMIA in 2017, so a dissolved/superseded name must never be the primary answer.
  {
    const row=(t.match(/EUM \(Issuer\)([\s\S]{0,200})/)||['',''])[1];
    ck('EUM row leads with IDEMIA',/^\s*IDEMIA/.test(row),row.slice(0,120));
    ck('EUM row does not lead with Oberthur',!/^\s*Oberthur/i.test(row),row.slice(0,120));
    // The superseded registrant string is still available for cross-reference, but marked.
    ck('registry name shown as superseded',/superseded/i.test(row),row.slice(0,200));
  }
  // Fabricated Google SM-DS pattern row must be gone.
  ck('no Google SM-DS Pattern row',!/Google SM-DS Pattern/.test(t),t.slice(0,400));
  ck('no "No pattern matched"',!/No pattern matched/.test(t),t.slice(0,400));
  // Correct spec attribution for an 89-prefix EID.
  ck('cites SGP.02 2.2.2',/SGP\.02/.test(t),t.slice(0,600));

  // A deliberately corrupted check digit must fail and report the expected value.
  const bad=EID.slice(0,30)+'99';
  t=eid(bad);
  ck('bad check digits detected',/Invalid/.test(t),t.slice(0,200));
  ck('bad check digits report expected 27',/27/.test(t),t.slice(0,200));

  // Non-89 EID => SGP.29 scheme, must NOT be split into E.118 fields.
  const g='35907'+'1234567890123456789012345'.slice(0,25);
  const gbody=g.slice(0,30);
  // build a checksum-valid SGP.29-style EID
  let rem=BigInt(gbody+'00')%97n, cd=(98n-rem).toString().padStart(2,'0');
  t=eid(gbody+cd);
  ck('non-89 flagged as SGP.29 scheme',/SGP\.29/.test(t),t.slice(0,300));
  ck('non-89 does not claim a country',!/Country/.test(t),t.slice(0,300));
  ck('non-89 EIN range holder Kigen',/Kigen/.test(t),t.slice(0,300));

  /* ---------- 3. ICCID decoder ---------- */
  function iccid(v){
    d.getElementById('iccid-input').value=v;
    d.getElementById('iccid-decode').click();
    return d.getElementById('iccid-result').textContent;
  }
  // Real ICCID from pySim test data, Luhn-valid.
  t=iccid('8988211000000530082');
  ck('Luhn-valid ICCID marked consistent',/Luhn-consistent/.test(t),t.slice(0,240));
  // pySim feeds this in as a LEGITIMATE 19-digit ICCID without a correct Luhn digit.
  t=iccid('8988211000000530081');
  ck('Luhn-failing ICCID is NOT called Invalid',!/❌/.test(t)&&!/Invalid/.test(t),t.slice(0,300));
  ck('Luhn-failing ICCID explained as permitted',/permitted by SGP\.22|not a Luhn check digit/i.test(t),t.slice(0,300));
  // 20-digit with 'F' padding must be accepted, not rejected as non-numeric.
  t=iccid('8947010000123456784F');
  ck("'F' padded ICCID accepted",!/must contain only digits/.test(t),t.slice(0,240));
  ck("'F' padded ICCID not a length error",!/must be 19 or 20/.test(t),t.slice(0,240));
  ck("'F' padding labelled",/padding/i.test(t),t.slice(0,300));
  // The pad is stripped before Luhn, so this documented ICCID reads as Luhn-consistent.
  ck("'F' padded ICCID Luhn-consistent",/Luhn-consistent/.test(t),t.slice(0,300));
  // Length violations are still real errors.
  t=iccid('890126');
  ck('short ICCID rejected',/19 or 20/.test(t),t.slice(0,200));

  /* ---------- 3b. IMSI decoder: MNC length must come from the MCC ---------- */
  function imsi(v){
    const inp=d.getElementById('imsi-input');
    if(!inp)return'NO_WIDGET';
    inp.value=v;d.getElementById('imsi-decode').click();
    return d.getElementById('imsi-result').textContent;
  }
  // US MCC 310 => 3-digit MNC. T-Mobile 310260, MSIN is the remaining 9 digits.
  t=imsi('310260123456789');
  ck('IMSI 310 uses 3-digit MNC',/260 \(3-digit\)/.test(t),t.slice(0,220));
  ck('IMSI 310260 is T-Mobile',/T-Mobile/.test(t),t.slice(0,220));
  ck('IMSI 310 MSIN is 9 digits',/123456789 \(9 digits\)/.test(t),t.slice(0,260));
  // UK MCC 234 => 2-digit MNC. 23410 is O2 UK, MSIN is 10 digits.
  t=imsi('234101234567890');
  ck('IMSI 234 uses 2-digit MNC',/10 \(2-digit\)/.test(t),t.slice(0,220));
  ck('IMSI 23410 is O2 UK',/O2 UK/.test(t),t.slice(0,220));
  // An MCC with a 3-digit MNC must not be mis-split even when unknown to the operator table.
  t=imsi('311999123456789');
  ck('unknown 311 MNC still 3-digit',/999 \(3-digit\)/.test(t),t.slice(0,220));
  // Mexico (334), Argentina (722) and Colombia (732) use 3-digit MNCs. A decoder assuming
  // 2 mis-splits every IMSI from those countries.
  t=imsi('334020123456789');
  ck('Mexico 334 is 3-digit MNC',/020 \(3-digit\)/.test(t),t.slice(0,200));
  ck('334020 is Telcel',/Telcel/.test(t),t.slice(0,200));
  t=imsi('722310123456789');
  ck('Argentina 722 is 3-digit MNC',/310 \(3-digit\)/.test(t),t.slice(0,200));
  ck('722310 is Claro Argentina',/Claro \(Argentina\)/.test(t),t.slice(0,200));
  t=imsi('732101123456789');
  ck('Colombia 732 is 3-digit MNC',/101 \(3-digit\)/.test(t),t.slice(0,200));
  // MCC 740 is Ecuador, not Argentina; 74007 was never an assigned code.
  t=imsi('740011234567890');
  ck('740 is Ecuador not Argentina',/Ecuador/.test(t)&&!/Argentina/.test(t),t.slice(0,200));

  /* ---------- 4. APDU status words ---------- */
  function apdu(v){
    const inp=d.getElementById('apdu-input');
    if(!inp)return'NO_WIDGET';
    inp.value=v;d.getElementById('apdu-decode').click();
    return d.getElementById('apdu-result').textContent;
  }
  t=apdu('9000');
  ck('9000 success',/success/i.test(t),t.slice(0,120));
  t=apdu('6F01');
  ck('6F01 no longer "More data available"',!/More data available/.test(t),t.slice(0,200));
  ck('6F01 flagged command dependent',/command dependent/i.test(t),t.slice(0,200));
  t=apdu('62F1');
  ck('62F1 is More data available',/More data available/.test(t),t.slice(0,160));
  t=apdu('63C2');
  ck('63C2 reports 2 retries',/2 retries remaining/.test(t),t.slice(0,220));
  t=apdu('6285');
  ck('6285 termination state',/termination state/i.test(t),t.slice(0,160));
  t=apdu('6883');
  ck('6883 last command of chain',/last command of the chain/i.test(t),t.slice(0,180));

  /* ---------- 5. Global data-table invariants ---------- */
  const R=w.SGP22_REASONS,S=w.SGP22_SUBJECTS;
  const specReasons=['1.1','1.2','2.1','2.2','2.3','3.1','3.3','3.7','3.8','3.9','3.10','3.11','4.2','4.3','4.8','4.10','5.1','6.1','6.3','6.4'];
  const bogus=['1.0','3.2','3.4','3.5','4.1','4.4','4.5','4.6','4.7','5.2','5.3','5.4','5.5'];
  specReasons.forEach(c=>ck('reason '+c+' present',Object.prototype.hasOwnProperty.call(R,c)));
  bogus.forEach(c=>ck('fabricated reason '+c+' absent',!Object.prototype.hasOwnProperty.call(R,c)));
  ck('subject 8.2 == Profile',S['8.2']==='Profile',S['8.2']);
  ck('subject 8.8 == SM-DP+',S['8.8']==='SM-DP+',S['8.8']);
  ck('subject 8.9.5 Event Record',S['8.9.5']==='Event Record',S['8.9.5']);
  ck('subject 8.11.1 present',!!S['8.11.1'],S['8.11.1']);
  ['8.3','8.4','8.5','8.6','8.7'].forEach(c=>ck('SGP.02-only subject '+c+' absent',!Object.prototype.hasOwnProperty.call(S,c),String(S[c])));
  // EUM table shape
  // Table is keyed by the 6-digit ITU IIN; EIDs zero-pad to an 8-digit prefix.
  // name = current vendor; regName = the stale ITU registrant string, kept separate.
  ck('IIN 893324 name is IDEMIA',w.EUM_TABLE['893324'].name==='IDEMIA',w.EUM_TABLE['893324'].name);
  ck('IIN 893323 name is Thales',w.EUM_TABLE['893323'].name==='Thales',w.EUM_TABLE['893323'].name);
  ck('893324 regName keeps OBERTHUR for cross-ref',/OBERTHUR/i.test(w.EUM_TABLE['893324'].regName||''));
  ck('893323 regName keeps GEMALTO for cross-ref',/GEMALTO/i.test(w.EUM_TABLE['893323'].regName||''));
  // No `name` field may carry a superseded company as the primary label.
  {
    const dead=/oberthur|gemalto|morpho|safran identity/i;
    const bad=Object.keys(w.EUM_TABLE).filter(k=>dead.test(w.EUM_TABLE[k].name));
    ck('no defunct company in any name field',bad.length===0,bad.map(k=>k+'='+w.EUM_TABLE[k].name).join(', '));
  }
  ck('eumIinFromEid maps 89033024 -> 893324',w.eumIinFromEid('89033024'+'0'.repeat(24))==='893324',String(w.eumIinFromEid('89033024'+'0'.repeat(24))));
  ck('eumIinFromEid rejects non-89',w.eumIinFromEid('35907'+'0'.repeat(27))===null);
  // Corrected codes found in the ITU registry during the second pass.
  ck('Truphone is IIN 894447',/Truphone/.test((w.EUM_TABLE['894447']||{}).name||''));
  ck('STMicro is IIN 894130',/STMicro/.test((w.EUM_TABLE['894130']||{}).name||''));
  ck('no bogus 9-digit-style keys',Object.keys(w.EUM_TABLE).every(k=>k.length===6),Object.keys(w.EUM_TABLE).filter(k=>k.length!==6).join(','));
  ck('every EUM row has a src',Object.values(w.EUM_TABLE).every(v=>v.src==='itu'||v.src==='community'));
  // MNC length must be declared per MCC, not guessed.
  ck('MCC_MNC_LEN exists',typeof w.MCC_MNC_LEN==='object');
  ck('310 is 3-digit MNC',w.MCC_MNC_LEN['310']===3);
  ck('234 defaults to 2-digit MNC',(w.MCC_MNC_LEN['234']||2)===2);
  ck('EIN table has Kigen 35907',w.EIN_TABLE['35907']==='Kigen');
  ck('SMDS_ADDRESSES present',Array.isArray(w.SMDS_ADDRESSES)&&w.SMDS_ADDRESSES.length>0);
  ck('DEVICE_PATTERNS removed',typeof w.DEVICE_PATTERNS==='undefined');
  // CI PKIDs: production vs test separation, and the corrected hex.
  const ci=w.CI_PKIDS;
  ck('CI RSP2 Root hex corrected',ci.some(c=>c.pkid==='81370F5125D0B1D408D4C3B232E6D25E795BEBFB'));
  ck('CI has Production rows',ci.some(c=>/^Production/.test(c.status)));
  ck('CI has Test rows',ci.some(c=>c.status==='Test'));
  ck('CI placeholder 3C4FB0 removed',!ci.some(c=>c.pkid.startsWith('3C4FB0')));
  /* V10.3 regression: every CI row is a real published CI root certificate. Each SKI below was read from the
     certificate and recomputed as SHA-1 of its public key; curve and notAfter come from the same certificate
     (GSMA Root CI page certificates, mirrored at euicc-manual.osmocom.org/docs/pki/ci/). V10.2 flagged these rows
     as "illustrative placeholders" with unverified expiry dates. */
  const CI_EXPECTED={
    '81370F5125D0B1D408D4C3B232E6D25E795BEBFB':['Production',/RSP2 Root CI1/,/21 Feb 2052/],
    '4C27967AD20C14B391E9601E41E604AD57C0222F':['Production',/OISTE GSMA CI G1/,/7 Jan 2059/],
    'D7A7D0C7C04EA76076E3F44FAEBDE8779E2948D4':['Production (M2M)',/M2M31 Root CI2/,/15 Mar 2052/],
    'F54172BDF98A95D65CBEB88A38A1C11D800A85C3':['Test',/NIST P-256/,/1 Feb 2052[\s\S]*1 Apr 2055/],
    'C0BC70BA36929D43B467FF57570530E57AB8FCD8':['Test',/brainpoolP256r1/,/18 Apr 2052[\s\S]*1 Apr 2055/],
    '34EECF13156518D48D30BDF06853404D115F955D':['Test',/v3\.0\.x[\s\S]*NIST P-256/,/30 May 2058/],
    '2209F61CD9EC5C9C854E787341FF83ECF9776A5B':['Test',/v3\.0\.x[\s\S]*brainpoolP256r1/,/1 Jun 2058/]
  };
  ck('CI table has exactly the verified rows',ci.length===Object.keys(CI_EXPECTED).length&&ci.every(c=>CI_EXPECTED[c.pkid]),ci.map(c=>c.pkid).join(','));
  ci.forEach(c=>{const e=CI_EXPECTED[c.pkid];if(!e)return;
    ck('CI '+c.pkid.slice(0,6)+' status/name/expiry match its certificate',c.status===e[0]&&e[1].test(c.gen)&&e[2].test(c.usage));});
  ck('CI source no longer marked illustrative or unverified',!/illustrative placeholders|SOURCE-VERIFICATION NEEDED: CI PKID|NOT independently verified|expiry dates are unconfirmed/.test(fs.readFileSync(HTML,"utf8")));
  // PPR correctness in prose
  const body=d.body.textContent;
  ck('pprUpdateControl documented',/pprUpdateControl/.test(body));
  // PprIds bit assignment must be exact: 0=pprUpdateControl, 1=ppr1, 2=ppr2.
  ck('bit 0 is pprUpdateControl',/bit 0\s*=\s*pprUpdateControl/.test(body));
  ck('bit 1 is ppr1',/bit 1\s*=\s*ppr1/.test(body));
  ck('bit 2 is ppr2',/bit 2\s*=\s*ppr2/.test(body));
  ck('bit 0 NOT called a disable rule',!/bit 0\s*=\s*(ppr1|disable)/i.test(body));
  ck('ppr1 means disable-not-allowed',/ppr1[^.]{0,60}[Dd]isabl/.test(body));
  ck('ppr2 means delete-not-allowed',/ppr2[^.]{0,60}[Dd]elet/.test(body));
  // The false claim was "bit 2 = delete on disable". Mentioning it as an SGP.02 M2M rule is correct.
  ck('no "bit 2 = delete on disable" claim',!/bit 2\s*=\s*delete[- ]on[- ]disable/i.test(body));
  ck('delete-on-disable attributed to SGP.02 M2M',/M2M POL1/.test(body));
  ck('no ES2+.UpdatePolicyRules as a real function',!/must update the profile.s PPR via ES2\+\.UpdatePolicyRules/i.test(body));
  ck('ES6.UpdateMetadata cited',/ES6\.UpdateMetadata/.test(body));
  ck('ESep replaces ESeim',/ESep/.test(body)&&!/ESeim/.test(body));
  ck('version V10.3 (October 2026)',/V10\.3/.test(body)&&/October 2026/.test(body));

  /* V10.1 regression: SGP.02 interface map (SGP.02 v3.0 s.1/Figure 1 and v4.0 section 5):
     ES1 EUM-SM-SR, ES2 Operator-SM-DP, ES3 SM-DP-SM-SR, ES4 Operator-SM-SR, ES5 SM-SR-eUICC,
     ES6 Operator-eUICC (MNO-SD), ES7 SM-SR-SM-SR (SM-SR Change), ES8 SM-DP-eUICC (ISD-P).
     V10.0 had ES1/ES2/ES3/ES5/ES6/ES7 permuted and dated SM-SR swap to v4.x. */
  const src=fs.readFileSync(HTML,'utf8');
  const row=(es,between)=>new RegExp("\\['"+es+"','"+between.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(src);
  ck('SGP.02 ES1 = EUM <-> SM-SR',row('ES1','EUM \\u2194 SM-SR'));
  ck('SGP.02 ES2 = Operator <-> SM-DP',row('ES2','Operator \\u2194 SM-DP'));
  ck('SGP.02 ES3 = SM-DP <-> SM-SR',row('ES3','SM-DP \\u2194 SM-SR'));
  ck('SGP.02 ES5 = SM-SR <-> eUICC (ISD-R)',row('ES5','SM-SR \\u2194 eUICC (ISD-R)'));
  ck('SGP.02 ES6 = Operator <-> eUICC (MNO-SD)',row('ES6','Operator \\u2194 eUICC (MNO-SD)'));
  ck('SGP.02 ES7 = SM-SR <-> SM-SR (SM-SR Change)',row('ES7','SM-SR \\u2194 SM-SR'));
  ck('SGP.02 ES8 = SM-DP <-> eUICC (ISD-P)',row('ES8','SM-DP \\u2194 eUICC (ISD-P'));
  ck('no ES6 SM-SR swap claim',!/SM-SR swap \(ES6\)|ES6: SM-SR|'ES6','SM-SR/.test(src));
  ck('SM-SR Change not dated to v4.x',/already specified in SGP\.02 v3\.0/.test(src)&&!/v4\.x added SM-SR swap/.test(src));
  ck('M2M remote commands use ES5, not ES1',/'ES5\.EnableProfile','ES5','SM-SR \\u2192 eUICC/.test(src)&&!/'ES1\.EnableProfile'/.test(src));
  ck('SGP.26 official title',/'SGP\.26','RSP Test Certificates Definition'/.test(src)&&!/'Test Profiles'/.test(src));
  ck('EID format not attributed to SGP.02 Annex H',!/Annex H/.test(src));

  /* V10.2 regression: spec-evolution timeline dates come from GSMA document history
     (SGP.02 V4.0 and SGP.22 V1.2 Document History tables; GSMA eSIM specification listing).
     V10.1 labelled them "illustrative" and placed SGP.22 v2 in 2019 and v3 in 2023. */
  const ms=(spec,year,desc)=>new RegExp("\\{year:'"+year+"',x:\\d+,spec:'"+spec.replace(/\./g,'\\.')+"',label:'[^']+',desc:'"+desc+"'").test(src);
  ck('timeline: SGP.02 v1.0 19 Dec 2013',ms('SGP.02 v1.0','2013','19 Dec 2013'));
  ck('timeline: SGP.22 v1.0 13 Jan 2016',ms('SGP.22 v1.0','2016','13 Jan 2016'));
  ck('timeline: SGP.22 v2.0 14 Oct 2016',ms('SGP.22 v2.0','2016','14 Oct 2016'));
  ck('timeline: SGP.22 v3.0 19 Oct 2022',ms('SGP.22 v3.0','2022','19 Oct 2022'));
  ck('timeline: SGP.32 v1.0.1 4 Jul 2023',ms('SGP.32 v1.0.1','2023','4 Jul 2023'));
  ck('timeline: no illustrative milestones',!/illustrative milestone/.test(src));
  ck('timeline: no 2019 SGP.22 v2 or 2023 SGP.22 v3 claim',!/2019 \\u2014 SGP\.22|2023 \\u2014 SGP\.22/.test(src));
  ck('timeline: SM-DS credited to v2.0, Confirmation Codes to v1.0',/SGP\.22 v2\.0 \(14 Oct\):<\/tspan> Added the SM-DS/.test(src)&&/SGP\.22 v1\.0 \(13 Jan\):<\/tspan>[^<]*Confirmation Codes/.test(src));
  ck('phone header uses a short subtitle',/<span class="hdr-s-long">/.test(src)&&/<span class="hdr-s-short">/.test(src)&&/@media\(max-width:600px\)\{[^\n]*\.hdr-s-long\{display:none\}/.test(src));

  // Every PPR bit mention anywhere in the page must use the correct assignment.
  const bitClaims=body.match(/bit\s*(\d)\s*=\s*([A-Za-z][A-Za-z0-9-]*)/g)||[];
  const wrongBits=bitClaims.filter(c=>{
    const m=c.match(/bit\s*(\d)\s*=\s*([A-Za-z][A-Za-z0-9-]*)/);
    const n=m[1],v=m[2].toLowerCase();
    if(n==='0')return v!=='pprupdatecontrol';
    if(n==='1')return v.indexOf('ppr1')!==0;
    if(n==='2')return v.indexOf('ppr2')!==0;
    return false;
  });
  ck('all PPR bit claims correct',wrongBits.length===0,wrongBits.join(' | '));
  // Shorthand form used in the logs list, e.g. "1=ppr1 disable-not-allowed".
  const shortClaims=body.match(/(\d)=ppr(\d)/g)||[];
  ck('shorthand ppr bit claims correct',shortClaims.every(c=>c[0]===c[c.length-1]),shortClaims.join(' | '));

  // Interface/function naming must not regress to non-existent names.
  ck('no ES10a.GetEUICCInfo anywhere',!/ES10a\.GetEUICCInfo/.test(body));
  ck('no GetEUICCInfo1',!/GetEUICCInfo1/.test(body));
  ck('ES10b.GetEUICCInfo used',/ES10b\.GetEUICCInfo/.test(body));

  // esc() must actually escape, so injected markup stays inert text.
  ck('esc escapes angle brackets',w.esc('<b>x</b>')==='&lt;b&gt;x&lt;/b&gt;',String(w.esc('<b>x</b>')));
  ck('esc escapes quotes',/&quot;/.test(w.esc('"q"')),String(w.esc('"q"')));

  /* ---------- 6. Cross-table invariants ---------- */
  {
    const mm=Object.keys(w.MCC_MNC), len=w.MCC_MNC_LEN;
    const by={};
    mm.forEach(k=>{const m=k.slice(0,3);(by[m]=by[m]||new Set()).add(k.length-3)});
    const mixed=Object.keys(by).filter(m=>by[m].size>1);
    ck('no MCC mixes 2- and 3-digit MNC widths',mixed.length===0,mixed.join(','));
    const undeclared=Object.keys(by).filter(m=>by[m].has(3)&&len[m]!==3);
    ck('every 3-digit-MNC MCC is declared',undeclared.length===0,undeclared.join(','));
    const over=Object.keys(len).filter(m=>len[m]===3&&by[m]&&!by[m].has(3));
    ck('no MCC declared 3-digit with 2-digit data',over.length===0,over.join(','));
  }
  {
    // Ecuador (MCC 740) has only MNCs 00-03 assigned. 74007 was in an earlier release,
    // mislabelled "Claro Argentina" -- a code that does not exist anywhere.
    const ec=Object.keys(w.MCC_MNC).filter(k=>k.startsWith('740'));
    const bogus=ec.filter(k=>!['74000','74001','74002','74003'].includes(k));
    ck('no unassigned Ecuador MNC',bogus.length===0,bogus.join(','));
    ck('no Argentina label on an Ecuador code',!ec.some(k=>/Argentina/.test(w.MCC_MNC[k])),ec.map(k=>k+'='+w.MCC_MNC[k]).join(', '));
  }
  {
    // ICCID = 89 + E.118 country + issuer. A prefix whose country digits are unknown is
    // usually an MCC pasted in by mistake (e.g. 890262 from Germany's MCC 262).
    const bad=Object.keys(w.ICCID_ISSUERS).filter(k=>!w.COUNTRY_CODES[k.slice(2,4)]);
    ck('every ICCID prefix has a known E.118 country',bad.length===0,bad.join(','));
  }
  {
    // Every SGP22_PAIRS key must reference codes that actually exist in both tables.
    const bad=Object.keys(w.SGP22_PAIRS).filter(k=>{
      const [a,b]=k.split('|');
      return !w.SGP22_SUBJECTS[a]||!w.SGP22_REASONS[b];
    });
    ck('every spec pair references defined codes',bad.length===0,bad.join(','));
  }

  ck('no runtime errors',errs.length===0,errs.join('; '));

  console.log('PASS '+pass+'   FAIL '+fail);
  if(failures.length){console.log('\n--- FAILURES ---');failures.forEach(f=>console.log('  * '+f));}
  process.exit(fail?1:0);
});
setTimeout(()=>{console.log('TIMEOUT waiting for load');process.exit(2)},30000);
