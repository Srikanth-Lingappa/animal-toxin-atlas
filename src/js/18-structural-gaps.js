/* js/18-structural-gaps.js
   Insights > Structural gaps: families with no solved structure and their AlphaFold confidence.
   Defines: plBand, buildGapList, gapPass, gapSorted, openGap, renderGapFinder, gapMemberRows, showGapDetail
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   18. STRUCTURAL COVERAGE GAP-FINDER
   Ranks protein families (min 12 records) by the LOWEST share
   solved experimentally (PDB) — a target list for structural work.
   ============================================================ */
var GAP_LIST = [];
var PL_COL = ['#0053d6','#65cbf3','#ffdb13','#ff7d45'];
var PL_LBL = ['very high','confident','low','very low'];
function plBand(m){ return m>=90 ? 0 : m>=70 ? 1 : m>=50 ? 2 : 3; }
var GAP_MIN_MODELS = 5;      // a family mean is only shown when at least this many unsolved members have a model
function buildGapList(){
  var byFam = {};
  ENTRIES.forEach(function(e){
    if(e.fam===null || e.fam===undefined) return;
    if(!byFam[e.fam]) byFam[e.fam] = [];
    byFam[e.fam].push(e);
  });
  GAP_LIST = Object.keys(byFam).map(function(famIdx){
    var list = byFam[famIdx];
    var solved = function(e){ return e.pdb && e.pdb.length; };
    var withPdb = list.filter(solved).length;
    var withAF = list.filter(function(e){ return e.af; }).length;
    var mod = list.filter(function(e){ return e.plm!==undefined && !solved(e); });
    var mean = mod.length ? mod.reduce(function(s,e){ return s+e.plm; },0)/mod.length : null;
    var bands = [0,0,0,0]; mod.forEach(function(e){ bands[plBand(e.plm)]++; });
    var shown = (mean!==null && mod.length>=GAP_MIN_MODELS);
    return {
      famIdx: parseInt(famIdx,10), name: DATA.famList[famIdx], n: list.length,
      withPdb: withPdb, pdbPct: withPdb/list.length,
      withAF: withAF, afPct: withAF/list.length,
      plN: mod.length, plMean: mean, plShown: shown, plBands: bands,
      entries: list
    };
  }).filter(function(f){ return f.n>=12; });
}
var gapActiveIdx = null, gapSort = 'pct', gapShown = 24, gapFilter = 'all', gapQuery = '';
function gapPass(f){
  if(gapFilter==='unsolved' && f.withPdb!==0) return false;
  if(gapFilter==='cand' && !(f.withPdb===0 && f.plShown && f.plMean>=70)) return false;
  if(gapQuery && f.name.toLowerCase().indexOf(gapQuery)===-1) return false;
  return true;
}
function gapSorted(list){
  var cmp = {
    pct: function(a,b){ return (a.pdbPct-b.pdbPct) || (b.n-a.n); },
    n: function(a,b){ return (b.n-a.n) || (a.pdbPct-b.pdbPct); },
    hi: function(a,b){ return ((b.plShown?b.plMean:-1)-(a.plShown?a.plMean:-1)) || (b.n-a.n); },
    lo: function(a,b){ return ((a.plShown?a.plMean:999)-(b.plShown?b.plMean:999)) || (b.n-a.n); }
  }[gapSort];
  return list.sort(cmp);
}
function openGap(idx){
  var f = GAP_LIST.find(function(x){ return x.famIdx===idx; });
  if(f){ gapActiveIdx = idx; renderGapFinder(); showGapDetail(f); }
}
function renderGapFinder(){
  var zeroList = GAP_LIST.filter(function(f){ return f.withPdb===0; });
  var cand = zeroList.filter(function(f){ return f.plShown && f.plMean>=70; });
  var totalRec = GAP_LIST.reduce(function(s,f){ return s+f.n; },0);
  var solved = GAP_LIST.reduce(function(s,f){ return s+f.withPdb; },0);
  var candRec = cand.reduce(function(s,f){ return s+f.n; },0);
  document.getElementById('gapKpis').innerHTML = [
    ['Families analysed (≥12 records)', fmtN(GAP_LIST.length), ''],
    ['With no solved structure', fmtN(zeroList.length), 'warn'],
    ['…of which confidently modelled', fmtN(cand.length), 'hi'],
    ['Records in those families', fmtN(candRec), 'hi'],
    ['Records with a PDB structure', (totalRec? (solved/totalRec*100).toFixed(0):0)+'%', '']
  ].map(function(k){ return '<div class="kpi '+k[2]+'"><b>'+k[1]+'</b><span>'+k[0]+'</span></div>'; }).join('');

  var list = gapSorted(GAP_LIST.filter(gapPass));
  document.getElementById('gapCount').textContent = 'showing '+Math.min(gapShown,list.length)+' of '+list.length+' families';
  var passSet = {}; list.forEach(function(f){ passSet[f.famIdx] = 1; });

  // bubble plot: x = family size, y = % solved, colour = mean pLDDT of the unsolved members
  var W=700,H=270,L=52,R=14,T=10,B=32;
  var maxN = Math.max.apply(null, GAP_LIST.map(function(f){ return f.n; }));
  var lo = Math.log10(12), hi = Math.log10(Math.max(maxN,13));
  function X(n){ return L+(Math.log10(n)-lo)/(hi-lo)*(W-L-R); }
  var yMax = Math.min(1, Math.max(0.2, Math.ceil(Math.max.apply(null, GAP_LIST.map(function(f){ return f.pdbPct; }))*10)/10));
  function Y(p){ return T+(1-p/yMax)*(H-T-B); }
  var s = '<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  var yTicks = []; for(var yt=0; yt<=yMax+1e-9; yt+=(yMax>0.5 ? 0.25 : 0.1)) yTicks.push(yt);
  yTicks.forEach(function(p){
    s += '<line class="grid" x1="'+L+'" y1="'+Y(p)+'" x2="'+(W-R)+'" y2="'+Y(p)+'"/><text class="axis" x="'+(L-6)+'" y="'+(Y(p)+3)+'" text-anchor="end">'+Math.round(p*100)+'%</text>';
  });
  [12,25,50,100,250,500,1000].forEach(function(n){
    if(n>Math.pow(10,hi)) return;
    s += '<line class="grid" x1="'+X(n)+'" y1="'+T+'" x2="'+X(n)+'" y2="'+(H-B)+'"/><text class="axis" x="'+X(n)+'" y="'+(H-B+13)+'" text-anchor="middle">'+n+'</text>';
  });
  s += '<text class="axis" x="'+((L+W-R)/2)+'" y="'+(H-2)+'" text-anchor="middle">number of records in the family (more →)</text>'+
       '<text class="axis" transform="translate(9,'+((T+H-B)/2)+') rotate(-90)" text-anchor="middle">% of records with a solved structure</text>';
  GAP_LIST.slice().sort(function(a,b){ return (passSet[a.famIdx]?1:0)-(passSet[b.famIdx]?1:0); }).forEach(function(f){
    var jx = ((insHash(String(f.famIdx))%9)-4)*1.4, jy = ((insHash('y'+f.famIdx)%9)-4)*0.9;
    var on = !!passSet[f.famIdx];
    var fill = f.plShown ? PL_COL[plBand(f.plMean)] : 'var(--faint)';
    var tip = esc(f.name)+': '+f.withPdb+' of '+f.n+' records solved'+(f.plShown ? ' · mean pLDDT of unsolved members '+f.plMean.toFixed(0) : ' · too few AlphaFold models for a mean');
    s += '<circle class="plot-dot'+(on?'':' dim')+'" data-fam="'+f.famIdx+'" cx="'+(X(f.n)+jx).toFixed(1)+'" cy="'+(Y(f.pdbPct)+jy).toFixed(1)+'" r="'+(on?5.2:4)+'" style="fill:'+fill+'"><title>'+tip+'</title></circle>';
  });
  s += '</svg>';
  var host = document.getElementById('gapPlot');
  host.innerHTML = s;
  host.querySelectorAll('.plot-dot').forEach(function(el){
    el.addEventListener('click', function(){ openGap(parseInt(el.getAttribute('data-fam'),10)); });
  });

  // cards: mean pLDDT is the headline number
  document.getElementById('gapTable').innerHTML = list.slice(0,gapShown).map(function(f){
    var pct = f.pdbPct*100;
    var c = f.plShown ? PL_COL[plBand(f.plMean)] : 'var(--line-strong)';
    var badge = f.plShown
      ? '<span class="gap-pl" style="--c:'+c+'"><b>'+f.plMean.toFixed(0)+'</b><small>mean pLDDT</small></span>'
      : '<span class="gap-pl none" style="--c:'+c+'"><b>—</b><small>'+(f.plN? 'only '+f.plN+' model'+(f.plN===1?'':'s') : 'no model')+'</small></span>';
    return '<div class="icard2 gap-card'+(gapActiveIdx===f.famIdx?' active':'')+'" data-fam="'+f.famIdx+'">'+
      '<div class="top"><span class="nm" title="'+esc(f.name)+'">'+esc(f.name)+'</span>'+badge+'</div>'+
      '<div class="mini"><i style="width:'+Math.max(pct,2)+'%;background:'+(pct===0?'var(--coral)':'var(--teal)')+'"></i></div>'+
      '<div class="sub" style="font-style:normal"><b style="color:'+(pct===0?'var(--coral)':'var(--teal)')+'">'+pct.toFixed(0)+'% solved</b> · '+f.withPdb+' of '+f.n+' · '+f.withAF+' with AlphaFold model</div>'+
    '</div>';
  }).join('') || '<div class="insight-sub">No families match this filter.</div>';
  document.querySelectorAll('#gapTable .icard2').forEach(function(el){
    el.addEventListener('click', function(){ openGap(parseInt(el.getAttribute('data-fam'),10)); });
  });
  var more = document.getElementById('gapMore');
  more.style.display = list.length > gapShown ? '' : 'none';
  more.textContent = 'Show more ('+(list.length-gapShown)+' remaining)';
}
var gapMembersShown = 40;
function gapMemberRows(f){
  var solved = function(e){ return e.pdb && e.pdb.length; };
  var rank = function(e){ return solved(e) ? 2 : (e.plm!==undefined ? 0 : 1); };
  var arr = f.entries.slice().sort(function(a,b){
    return (rank(a)-rank(b)) || ((b.plm||0)-(a.plm||0)) || ((b.len||0)-(a.len||0));
  });
  return arr.slice(0,gapMembersShown).map(function(e){
    var chip;
    if(solved(e)) chip = '<span class="gm-chip solved">PDB · '+e.pdb.length+'</span>';
    else if(e.plm!==undefined) chip = '<span class="gm-chip" style="--c:'+PL_COL[plBand(e.plm)]+'"><b>'+e.plm.toFixed(0)+'</b> pLDDT</span>';
    else chip = '<span class="gm-chip none">'+(e.af?'model length differs':'no structure')+'</span>';
    return '<div class="gm-row" data-openid="'+esc(e.id)+'"><span class="gm-nm">'+esc((e.pn||e.en).split(' (')[0])+'<span class="exfam">'+esc(e.org.split(' (')[0])+' · '+esc(e.id)+' · '+(e.len||'?')+' aa</span></span>'+chip+'</div>';
  }).join('');
}
function showGapDetail(f){
  gapMembersShown = 40;
  var unsolved = f.n - f.withPdb;
  var kp = [
    [f.n, 'records'],
    [f.withPdb+' ('+(f.pdbPct*100).toFixed(0)+'%)', 'solved in the PDB'],
    [f.withAF, 'with an AlphaFold model'],
    [f.plShown ? f.plMean.toFixed(1) : '—', 'mean pLDDT, unsolved members']
  ].map(function(k,i){ return '<div class="kpi'+(i===3&&f.plShown?' pl':'')+'"'+(i===3&&f.plShown?' style="--c:'+PL_COL[plBand(f.plMean)]+'"':'')+'><b>'+k[0]+'</b><span>'+k[1]+'</span></div>'; }).join('');
  var tot = f.plBands.reduce(function(a,b){ return a+b; },0);
  var bar = '', leg = '';
  if(tot){
    bar = '<div class="gap-bar">'+f.plBands.map(function(n,i){ return n? '<i style="width:'+(n/tot*100)+'%;background:'+PL_COL[i]+'" title="'+n+' member'+(n===1?'':'s')+' — '+PL_LBL[i]+'"></i>' : ''; }).join('')+'</div>';
    leg = '<div class="seqmap-legend">'+f.plBands.map(function(n,i){ return '<span><i style="background:'+PL_COL[i]+'"></i>'+PL_LBL[i]+' · '+n+'</span>'; }).join('')+'</div>';
  }
  var cats = {}; f.entries.forEach(function(e){ cats[e.cat]=(cats[e.cat]||0)+1; });
  var catTxt = Object.keys(cats).sort(function(a,b){ return cats[b]-cats[a]; }).slice(0,5).map(function(c){ return esc(c.split(' (')[0])+' '+cats[c]; }).join(' · ');
  var verdict = '';
  if(f.withPdb===0 && f.plShown) verdict = 'No member has a solved structure, and the '+f.plN+' modelled members average pLDDT '+f.plMean.toFixed(1)+' ('+PL_LBL[plBand(f.plMean)]+' confidence)'+(f.plMean>=70 ? ' — a good candidate where a prediction can stand in until an experimental structure exists.' : ' — the models are uncertain, so experimental work is the only reliable route.');
  else if(f.withPdb===0) verdict = 'No member has a solved structure, and too few have an AlphaFold model to judge its confidence.';
  else if(f.plShown) verdict = f.withPdb+' of '+f.n+' records are solved; the '+f.plN+' unsolved members that have a model average pLDDT '+f.plMean.toFixed(1)+' ('+PL_LBL[plBand(f.plMean)]+' confidence).';
  else verdict = f.withPdb+' of '+f.n+' records are solved.';
  var html = '<div class="kpi-row" style="margin-bottom:12px;">'+kp+'</div>'+
    icard('Structural coverage', null, verdict+(tot ? '<div style="margin-top:10px;">'+bar+leg+'</div>' : '')+'<div class="props-note" style="margin-top:8px;">Animal groups: '+catTxt+'</div>')+
    '<div class="gm-head">Members &mdash; unsolved with the most confident models first</div>'+
    '<div class="gm-list" id="gapMembers">'+gapMemberRows(f)+'</div>'+
    (f.n>gapMembersShown ? '<button class="toolbtn" id="gapMembersMore" style="margin-top:8px;">Show all '+f.n+' members</button>' : '');
  openInfoOverlay(esc(f.name), html, function(){
    gapActiveIdx = null;
    renderGapFinder();
  });
  var ov = document.getElementById('infoOverlay');
  var bind = function(){ ov.querySelectorAll('[data-openid]').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-openid')); });
  }); };
  bind();
  var mb = document.getElementById('gapMembersMore');
  if(mb) mb.addEventListener('click', function(){
    gapMembersShown = f.n; document.getElementById('gapMembers').innerHTML = gapMemberRows(f); mb.style.display = 'none'; bind();
  });
}
