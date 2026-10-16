/* js/17-potency-and-lethality.js
   Insights > Potency & lethality: parses LD50/PD50/IC50/EC50/Kd/Ki from UniProt text; also the mature-region helpers.
   Defines: seqMW, insHash, matureRanges, matureSeqOf, routeOf, speciesOf, parseLD50All, vitroContext, parseVitroAll, buildPotencyList, refreshPotency, potBase ...
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   17. POTENCY & LETHALITY LEADERBOARD
   Parses "Toxic dose" free text for LD(50)/PD(50) values reported
   in mass-based units (mg/kg, ug/kg, ug/g, ng/g, etc.) and converts
   them to a common mg/kg-equivalent scale. Molar-unit doses
   (nmol/kg...) and in-vitro/cell-culture values (ug/ml) are
   deliberately excluded rather than approximated.
   ============================================================ */
var MASS_MULT = {'ug':1e-3, '\u00b5g':1e-3, 'mg':1, 'ng':1e-6, 'pg':1e-9};
var DENOM_MULT = {'kg':1, 'g':1000};
var MOLAR_MULT = {'fmol':1e-15, 'pmol':1e-12, 'nmol':1e-9, 'umol':1e-6, '\u00b5mol':1e-6};
var NM_MULT = {'pm':1e-3, 'nm':1, 'um':1e3, '\u00b5m':1e3, 'mm':1e6};
var AA_MASS = {A:71.0788,R:156.1875,N:114.1038,D:115.0886,C:103.1388,E:129.1155,Q:128.1307,G:57.0519,H:137.1411,I:113.1594,L:113.1594,K:128.1741,M:131.1926,F:147.1766,P:97.1167,S:87.0782,T:101.1051,W:186.2132,Y:163.1760,V:99.1326};
function seqMW(seq){
  if(!seq) return null;
  var m = 18.0153, n = 0;
  for(var i=0;i<seq.length;i++){ var a = AA_MASS[seq.charAt(i)]; if(a){ m += a; n++; } }
  return n ? m : null;
}
function insHash(s){ var h=0; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }

// Mature region(s): UniProt Chain and Peptide features, merged so overlapping or nested ones are not counted twice.
function matureRanges(e){
  if(!e.ch || !e.ch.length){
    // no Chain/Peptide feature: mature = everything except the signal peptide and propeptide(s)
    var cut = (e.pro||[]).slice(); if(e.sp) cut.push(e.sp);
    cut.sort(function(x,y){ return x[0]-y[0]; });
    var res = [], pos = 1, L = e.seq ? e.seq.length : 0;
    cut.forEach(function(c){ if(c[0] > pos) res.push([pos, c[0]-1]); if(c[1]+1 > pos) pos = c[1]+1; });
    if(pos <= L) res.push([pos, L]);
    return res.length ? res : [[1, L]];
  }
  var r = e.ch.map(function(c){ return [c[0], c[1]]; }).sort(function(a,b){ return a[0]-b[0] || a[1]-b[1]; });
  var out = [r[0].slice()];
  for(var i=1;i<r.length;i++){
    var last = out[out.length-1];
    if(r[i][0] <= last[1]+1){ if(r[i][1] > last[1]) last[1] = r[i][1]; }
    else out.push(r[i].slice());
  }
  return out;
}
function matureSeqOf(e){
  if(!e.seq) return null;
  return matureRanges(e).map(function(c){ return e.seq.slice(c[0]-1, c[1]); }).join('');
}

// number [± SD] [-range] unit/kg|g, optionally preceded by a qualifier (> < ~). The ± term is consumed so the SD is never read as the value.
var VIVO_RE = /(?:([<>≤≥~])\s*)?(\d+(?:\.\d+)?)(?:\s*(?:\+-|±|\+\/-)\s*\d+(?:\.\d+)?)?(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?(?:\s*\(\s*\d+(?:\.\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?\s*\))?\s*(µg|ug|mg|ng|pg|fmol|pmol|nmol|umol|µmol)\s*\/\s*(kg|g)\b/gi;
// words that turn a number into a bound ("below 5 ug/kg", "more than 20 mg/kg") rather than a measured value
var BOUND_WORD_RE = /(?:below|under|less than|lower than|greater than|more than|higher than|above|over|at least|up to|>|<|≤|≥)\s*$/i;
var COMPLEX_RE = /hetero|homo(?:dimer|trimer|tetramer)|dimer|trimer|tetramer|complex|subunit/i;

function routeOf(t){
  if(/intracerebroventricular|intracerebral|\bi\.?c\.?v\.?\b/i.test(t)) return 'i.c.v.';
  if(/intraperitoneal|\bi\.p\./i.test(t)) return 'i.p.';
  if(/intravenous|\bi\.v\./i.test(t)) return 'i.v.';
  if(/subcutaneous|\bs\.c\./i.test(t)) return 's.c.';
  return '';
}
function speciesOf(t){
  if(/\b(mice|mouse|rats?|rabbits?|guinea|hamsters?)\b/i.test(t)) return 'Mammal';
  if(/crab|crayfish|shrimp|lobster|crustacean/i.test(t)) return 'Crustacean';
  if(/blowfl|\bflies\b|\bfly\b|drosophila|cockroach|americana|larva|lucilia|musca|spodoptera|heliothis|insect|locust|termite|cricket|moth|caesar|carnaria|melanogaster|\bbee\b|\bants?\b/i.test(t)) return 'Insect';
  if(/fish/i.test(t)) return 'Fish';
  return '';
}

// every LD50/PD50 measurement in the "Toxic dose" text (a record can report several: different routes, species, endpoints)
function parseLD50All(td, e){
  if(!td) return [];
  var out = [], mw = null;
  var clauses = td.split(/;\s*|\.\s+/).filter(function(c){ return /(?:LD|PD)\s*\(?\s*50/i.test(c); });
  clauses.forEach(function(clause){
    var clean = clause.trim().replace(/^TOXIC DOSE:\s*/i,'').replace(/\.$/,'');
    var ms = [], m;
    VIVO_RE.lastIndex = 0;
    while((m = VIVO_RE.exec(clause)) !== null) ms.push({m:m, idx:m.index, end:m.index+m[0].length});
    ms.forEach(function(x, k){
      var q = x.m[1];
      if(q==='>' || q==='<' || q==='≤' || q==='≥') return;      // bounds, not values
      if(BOUND_WORD_RE.test(clause.slice(Math.max(0, x.idx-16), x.idx))) return;
      var unit = x.m[4].toLowerCase(), den = DENOM_MULT[x.m[5].toLowerCase()], mult, converted = false;
      if(MASS_MULT[unit] !== undefined) mult = MASS_MULT[unit]*den;
      else {
        if(mw===null) mw = seqMW(matureSeqOf(e)) || 0;
        if(!mw || COMPLEX_RE.test(clause)) return;      // a molar dose of a multi-chain toxin can't be converted from one stored chain
        mult = MOLAR_MULT[unit]*mw*1000*den; converted = true;           // mol/kg x g/mol = g/kg -> mg/kg
      }
      var lo = parseFloat(x.m[2]), hi = x.m[3] ? parseFloat(x.m[3]) : null;
      if(hi!==null && hi<lo){ var t = lo; lo = hi; hi = t; }
      var win = clause.slice(x.end, k+1<ms.length ? ms[k+1].idx : clause.length);
      var label = null, lm, lre = /(LD|PD)\s*\(?\s*50/gi;
      while((lm = lre.exec(clause.slice(0, x.idx+1))) !== null) label = lm[1].toUpperCase();
      if(!label){ lre.lastIndex = 0; lm = lre.exec(clause); label = lm ? lm[1].toUpperCase() : 'LD'; }
      out.push({mg: lo*mult, hi: hi!==null ? hi*mult : null, raw: x.m[0].trim(), clause: clean, converted: converted,
        ep: label+'50', route: routeOf(win)||routeOf(clause)||'other', sp: speciesOf(win)||speciesOf(clause)||'Other'});
    });
  });
  return out;
}

var VITRO_RE = /\b(IC\(?50\)?|EC\(?50\)?|Kd|Ki)\)?(?:\s*(?:values?|of|is|are|was|were|=|:|~|≈|about|around|approximately|roughly|close to|estimated to be|=about)\s*)+(?:~|about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?(?:\s*(?:\+-|±|\+\/-)\s*\d+(?:\.\d+)?)?(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?(?:\s*(?:,|and)\s*\d+(?:\.\d+)?(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?)*)\s*(pM|nM|uM|µM|mM|pmol\/l|nmol\/l|umol\/l|µmol\/l|mmol\/l)(?![A-Za-z])/gi;
var VITRO_UNIT = {'pm':1e-3,'nm':1,'um':1e3,'µm':1e3,'mm':1e6,'pmol/l':1e-3,'nmol/l':1,'umol/l':1e3,'µmol/l':1e3,'mmol/l':1e6};
var VITRO_BOUND_RE = /(?:<|>|≤|≥|less than|greater than|more than|above|below)\s*$/i;
// classify by whichever target keyword sits closest to the value, so "trypsin (Kd=30 nM) and Kv channels" is an enzyme value
var VITRO_CTX = [
  ['Channel / receptor', /channel|receptor|nAChR|CHRN|Nav\d|Kv\d|Cav\d|ASIC|SCN\d|KCN|CACN|TRP[VAM]|P2X|P2RX\d|NMDA|GRIN\d|NR2[A-D]|AMPA|CHRM\d|MC\dR|GABA|glutamate|adrenergic|adrenoceptor|ADRA|SSTR|transporter|GPCR|muscarinic|opioid|vasopressin|ryanodine|RyR\d/gi],
  ['Cell / microbe / organism', /cytotox|cancer|tumou?r|cell line|proliferat|antimicrobial|antibacter|bacteri|fung|candida|\bMIC\b|larva|anthelmintic|platelet|aggregation|hemoly|haemoly|viab|apopto|HeLa|nematod|parasit|virus|viral|biofilm|erythrocyte/gi],
  ['Enzyme', /protease|proteinase|enzyme|trypsin|chymotrypsin|elastase|thrombin(?! receptor)|plasmin|kallikrein|factor X|phospholipase|metalloprotease|cholinesterase|cathepsin|MMP|peptidase|kinase|lipase/gi]
];
function vitroContext(win, pos){
  var best = null, bd = 1e9;
  VITRO_CTX.forEach(function(c){
    c[1].lastIndex = 0; var m;
    while((m = c[1].exec(win)) !== null){
      var d = Math.abs((m.index + m[0].length/2) - pos);
      if(d < bd){ bd = d; best = c[0]; }
    }
  });
  return best || 'Other';
}
// every IC50/EC50/Kd/Ki mention in a record's function text
function parseVitroAll(fn){
  if(!fn) return [];
  var out = [], m;
  VITRO_RE.lastIndex = 0;
  while((m = VITRO_RE.exec(fn)) !== null){
    if(VITRO_BOUND_RE.test(fn.slice(Math.max(0, m.index-14), m.index)) || /[<>≤≥]\s*$/.test(fn.slice(m.index, m.index+m[0].length).split(/\d/)[0])) continue;
    var unit = VITRO_UNIT[m[3].toLowerCase()];
    var s = fn.lastIndexOf('. ', m.index); s = s<0 ? 0 : s+2;
    var e = fn.indexOf('. ', m.index); e = e<0 ? fn.length : e+1;
    var kind = m[1].replace(/[()]/g,'').toUpperCase();
    if(kind==='KD') kind='Kd'; if(kind==='KI') kind='Ki';
    var clause = fn.slice(s,e).replace(/\s*\((?:PubMed|Ref)[^)]*\)/g,'').trim();
    var ctx = vitroContext(fn.slice(Math.max(0,m.index-110), m.index+90), Math.min(110, m.index) + m[0].length/2);
    // a list such as "IC50 of 369, 386 and 287 nM" holds one measurement per number; a range keeps its lower end
    var nums = m[2].replace(/(?:\+-|±|\+\/-)\s*\d+(?:\.\d+)?/g,'').split(/\s*(?:,|and)\s*/);
    nums.forEach(function(tok){
      var v = parseFloat(tok); if(!isFinite(v)) return;
      out.push({nm:v*unit, raw:m[0].trim(), kind:kind, clause:clause, ctx:ctx});
    });
  }
  return out;
}

var POT_ALL_VIVO = [], POT_ALL_VITRO = [];
var POTENCY_VIVO = [], POTENCY_VITRO = [];   // derived per-record lists for the current filters
var potMetric = 'vivo', potCat = '', potShown = 24, potRoute = '', potSpecies = '', potCtx = '';
function buildPotencyList(){
  POT_ALL_VIVO = []; POT_ALL_VITRO = [];
  ENTRIES.forEach(function(e){
    var a = parseLD50All(e.td, e);
    if(a.length) POT_ALL_VIVO.push({e:e, ms:a});
    var b = parseVitroAll(e.fn);
    if(b.length) POT_ALL_VITRO.push({e:e, ms:b});
  });
  refreshPotency();
  fillPotencyCatSelect();
}
// per record, the lowest value among measurements that pass the route / species / assay filters
function refreshPotency(){
  POTENCY_VIVO = []; POTENCY_VITRO = [];
  POT_ALL_VIVO.forEach(function(r){
    var best = null, n = 0;
    r.ms.forEach(function(x){
      if(potRoute && x.route!==potRoute) return;
      if(potSpecies && x.sp!==potSpecies) return;
      n++;
      if(!best || x.mg<best.mg) best = x;
    });
    if(best) POTENCY_VIVO.push({e:r.e, val:best.mg, hi:best.hi, raw:best.raw, clause:best.clause, converted:best.converted, ep:best.ep, route:best.route, sp:best.sp, n:n});
  });
  POT_ALL_VITRO.forEach(function(r){
    var best = null, n = 0;
    r.ms.forEach(function(x){
      if(potCtx && x.ctx!==potCtx) return;
      n++;
      if(!best || x.nm<best.nm) best = x;
    });
    if(best) POTENCY_VITRO.push({e:r.e, val:best.nm, raw:best.raw, clause:best.clause, kind:best.kind, ctx:best.ctx, n:n});
  });
  POTENCY_VIVO.sort(function(a,b){ return a.val-b.val; });
  POTENCY_VITRO.sort(function(a,b){ return a.val-b.val; });
}
function potBase(){ return potMetric==='vivo' ? POTENCY_VIVO : POTENCY_VITRO; }
function potList(){ var L = potBase(); return potCat ? L.filter(function(x){ return x.e.cat===potCat; }) : L; }
function fillPotencyCatSelect(){
  var L = potBase();
  var counts = {};
  L.forEach(function(x){ counts[x.e.cat] = (counts[x.e.cat]||0)+1; });
  var cats = Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; });
  if(potCat && !counts[potCat]) potCat = '';
  var sel = document.getElementById('potencyCatFilter');
  sel.innerHTML = '<option value="">All categories ('+L.length+')</option>'+
    cats.map(function(c){ return '<option value="'+esc(c)+'">'+esc(c)+' ('+counts[c]+')</option>'; }).join('');
  sel.value = potCat;
}
function fmtLD50(mgkg){
  if(mgkg < 1e-6) return (mgkg*1e9).toFixed(1)+' pg/kg';
  if(mgkg < 1e-3) return (mgkg*1e6).toFixed(1)+' ng/kg';
  if(mgkg < 1) return (mgkg*1000).toFixed(2)+' \u00b5g/kg';
  return mgkg.toFixed(2)+' mg/kg';
}
function fmtNM(nm){
  if(nm < 1) return (nm*1000).toFixed(1)+' pM';
  if(nm < 1000) return nm.toFixed(nm<10?2:1)+' nM';
  if(nm < 1e6) return (nm/1000).toFixed(1)+' \u00b5M';
  return (nm/1e6).toFixed(1)+' mM';
}
function potFmt(v){ return potMetric==='vivo' ? fmtLD50(v) : fmtNM(v); }

function renderPotencyLeaderboard(){
  var list = potList();
  var sp = {}; list.forEach(function(x){ sp[x.e.sci] = 1; });
  var vivoWord = potMetric==='vivo';
  document.getElementById('potKpis').innerHTML = [
    ['Records with in vivo LD50/PD50', fmtN(POT_ALL_VIVO.length), ''],
    ['Records with in vitro IC50/EC50/Kd/Ki', fmtN(POT_ALL_VITRO.length), ''],
    ['Most potent in this view', list.length ? potFmt(list[0].val) : '\u2014', ''],
    ['Species in this view', fmtN(Object.keys(sp).length), '']
  ].map(function(k){ return '<div class="kpi"><b>'+k[1]+'</b><span>'+k[0]+'</span></div>'; }).join('');
  document.getElementById('potencyCount').textContent = fmtN(list.length)+' values'+(potCat?' in '+potCat.split(' (')[0]:'');
  document.getElementById('potPlotTitle').textContent = vivoWord
    ? 'Each dot is one toxin: its lowest reported LD50/PD50 that matches the filters, on a log scale (mg/kg-equivalent) \u2014 further left = more lethal. Click a dot to open the record.'
    : 'Each dot is one toxin: its lowest reported IC50/EC50/Kd/Ki that matches the filters, on a log scale (nM) \u2014 further left = more potent. Click a dot to open the record.';
  renderPotencyPlot(list);

  var lo = list.length ? Math.log10(list[0].val) : 0, hi = list.length ? Math.log10(list[list.length-1].val) : 1;
  var color = vivoWord ? 'var(--coral)' : 'var(--teal)';
  var shown = list.slice(0, potShown);
  document.getElementById('potencyTable').innerHTML = shown.length ? shown.map(function(x,i){
    var e = x.e, pct = Math.max(6, 100*(hi-Math.log10(x.val))/((hi-lo)||1));
    var tag = vivoWord
      ? (x.converted ? ' <span title="converted from a molar dose using the molecular weight of the mature chain" style="color:var(--amber)">\u2248</span>' : '')+
        (x.hi ? ' <span title="reported as a range ('+esc(x.raw)+'); the lower bound is shown" style="color:var(--muted);font-size:10px">range</span>' : '')
      : ' <span style="color:var(--muted);font-size:10px">'+esc(x.kind)+'</span>';
    var meta = vivoWord ? x.ep+' \u00b7 '+x.route+' \u00b7 '+x.sp+(x.n>1 ? ' \u00b7 lowest of '+x.n : '')
                        : x.ctx+(x.n>1 ? ' \u00b7 lowest of '+x.n+' values' : '');
    return '<div class="icard2" data-id="'+esc(e.id)+'">'+
      '<div class="top"><span class="rk">#'+(i+1)+'</span><span class="val" style="color:'+color+'">'+potFmt(x.val)+tag+'</span></div>'+
      '<div class="nm">'+esc((e.pn||e.en).split(' (')[0])+'</div>'+
      '<div class="sub">'+esc(e.org.split(' (')[0])+' \u00b7 <span style="color:'+catColorVar(e.cat)+';font-style:normal">'+esc(e.cat.split(' (')[0])+'</span></div>'+
      '<div class="mini"><i style="width:'+pct.toFixed(0)+'%;background:'+color+'"></i></div>'+
      '<div class="sub" style="margin-top:4px;color:var(--faint);">'+esc(meta)+'</div>'+
      '<div class="ctx" title="'+esc(x.clause)+'">'+esc(x.clause.slice(0,160))+(x.clause.length>160?'\u2026':'')+'</div>'+
    '</div>';
  }).join('') : '<div class="empty-state">No parsed values in this selection.</div>';
  document.querySelectorAll('#potencyTable .icard2').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-id')); });
  });
  var more = document.getElementById('potMore');
  more.style.display = list.length > potShown ? '' : 'none';
  more.textContent = 'Show more ('+Math.min(24, list.length-potShown)+' of '+(list.length-potShown)+' remaining)';
}

function renderPotencyPlot(list){
  var host = document.getElementById('potPlot');
  if(!list.length){ host.innerHTML = '<div class="empty-state">Nothing to plot.</div>'; return; }
  var counts = {}; list.forEach(function(x){ counts[x.e.cat] = (counts[x.e.cat]||0)+1; });
  var order = Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; }).slice(0,8);
  var W=700, L=112, R=14, T=8, rowH=30, B=24, H=T+order.length*rowH+B;
  var vals = list.map(function(x){ return Math.log10(x.val); });
  var lo = Math.floor(Math.min.apply(null,vals)), hi = Math.ceil(Math.max.apply(null,vals));
  if(hi===lo) hi = lo+1;
  var step = Math.max(1, Math.ceil((hi-lo)/9));
  var s = '<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  for(var d=lo; d<=hi; d+=step){
    var x = L+(d-lo)/(hi-lo)*(W-L-R);
    s += '<line class="grid" x1="'+x+'" y1="'+T+'" x2="'+x+'" y2="'+(H-B)+'"/>'+
         '<text class="axis" x="'+x+'" y="'+(H-B+13)+'" text-anchor="middle">'+potFmt(Math.pow(10,d))+'</text>';
  }
  order.forEach(function(c,i){
    var y0 = T+i*rowH;
    s += '<line class="grid" x1="'+L+'" y1="'+(y0+rowH)+'" x2="'+(W-R)+'" y2="'+(y0+rowH)+'"/>'+
         '<text class="axis" x="'+(L-8)+'" y="'+(y0+rowH/2+3)+'" text-anchor="end">'+esc(c.split(' (')[0].slice(0,18))+'</text>';
  });
  list.forEach(function(it){
    var i = order.indexOf(it.e.cat); if(i<0) return;
    var cx = L+(Math.log10(it.val)-lo)/(hi-lo)*(W-L-R);
    var cy = T+i*rowH+rowH/2+(((insHash(it.e.id)%100)/100)-0.5)*(rowH-10);
    s += '<circle class="plot-dot" data-id="'+esc(it.e.id)+'" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="3.4" style="fill:'+catColorVar(it.e.cat)+'"><title>'+esc((it.e.pn||it.e.en).split(' (')[0])+' \u2014 '+potFmt(it.val)+'</title></circle>';
  });
  s += '</svg>';
  host.innerHTML = s;
  host.querySelectorAll('.plot-dot').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-id')); });
  });
}
