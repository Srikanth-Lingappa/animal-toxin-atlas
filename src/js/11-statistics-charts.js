/* js/11-statistics-charts.js
   Statistics > Overview: group, class, family, organism, InterPro and mechanism charts, and the selected-group highlight.
   Defines: scopedEntries, quantile, gcls, bindGroupRows, setStatsScope, renderScopePill, renderHighlights, renderCategoryChart, renderOrganismChart, renderClassChart, renderFamilyChart, renderIprChart ...
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   11. STATS TAB CHARTS
   ============================================================ */
var statsScope = null; // category name string, or null for "all"
var LEN_BINS = [[0,25],[25,50],[50,75],[75,100],[100,125],[125,150],[150,200],[200,300],[300,500],[500,Infinity]];

function scopedEntries(){
  return statsScope ? ENTRIES.filter(function(e){ return e.cat === statsScope; }) : ENTRIES;
}

function quantile(sorted, q){
  if(!sorted.length) return 0;
  var pos = (sorted.length-1)*q, base = Math.floor(pos), rest = pos-base;
  return sorted[base+1]!==undefined ? sorted[base]+rest*(sorted[base+1]-sorted[base]) : sorted[base];
}

function gcls(c){ return statsScope ? (statsScope===c ? ' gsel' : ' gdim') : ''; }
function bindGroupRows(root){
  document.querySelectorAll(root+' [data-grp]').forEach(function(el){
    el.addEventListener('click', function(){ setStatsScope(el.getAttribute('data-grp')); });
  });
}
function setStatsScope(cat){
  statsScope = (statsScope === cat) ? null : cat;
  renderAllStats();
}

function renderScopePill(){
  var el = document.getElementById('scopePill');
  if(!statsScope){ el.innerHTML=''; return; }
  el.innerHTML = '<div class="scope-pill" style="--dot:'+catColorVar(statsScope)+'">Scoped to <b>'+esc(statsScope)+'</b>'+
    '<button id="clearScopeBtn" title="Clear scope">✕</button></div>';
  document.getElementById('clearScopeBtn').addEventListener('click', function(){ statsScope=null; renderAllStats(); });
}

function renderHighlights(){
  var list = scopedEntries().filter(function(e){ return e.len; });
  if(!list.length){ document.getElementById('hlRibbon').innerHTML=''; return; }
  var byLen = list.slice().sort(function(a,b){ return b.len-a.len; });
  var byCite = list.slice().sort(function(a,b){ return (b.pm?b.pm.length:0)-(a.pm?a.pm.length:0); });
  var byPdb = list.slice().sort(function(a,b){ return (b.pdb?b.pdb.length:0)-(a.pdb?a.pdb.length:0); });
  var byKw = list.slice().sort(function(a,b){ return (b.kw?b.kw.length:0)-(a.kw?a.kw.length:0); });

  var cards = [
    ['Longest sequence', byLen[0].len+' aa', byLen[0], list.filter(function(x){ return x.len===byLen[0].len; }).length],
    ['Shortest sequence', byLen[byLen.length-1].len+' aa', byLen[byLen.length-1], list.filter(function(x){ return x.len===byLen[byLen.length-1].len; }).length],
    ['Most-cited', (byCite[0].pm?byCite[0].pm.length:0)+' papers', byCite[0], list.filter(function(x){ return (x.pm?x.pm.length:0)===(byCite[0].pm?byCite[0].pm.length:0); }).length],
    ['Most 3D structures', (byPdb[0].pdb?byPdb[0].pdb.length:0)+' PDB', byPdb[0], list.filter(function(x){ return (x.pdb?x.pdb.length:0)===(byPdb[0].pdb?byPdb[0].pdb.length:0); }).length],
    ['Most annotated', (byKw[0].kw?byKw[0].kw.length:0)+' keywords', byKw[0], list.filter(function(x){ return (x.kw?x.kw.length:0)===(byKw[0].kw?byKw[0].kw.length:0); }).length]
  ];
  document.getElementById('hlRibbon').innerHTML = cards.map(function(c,idx){
    var e = c[2];
    var pname = (e.pn||e.en).split(' (')[0];
    return '<div class="hl-card" data-hlid="'+esc(e.id)+'">'+
      '<div class="hlabel">'+c[0]+'</div><div class="hval">'+c[1]+'</div>'+
      '<div class="hname">'+esc(pname)+'</div><div class="horg">'+esc(e.org.split(' (')[0])+(c[3]>1?' \u00b7 tied with '+(c[3]-1)+' other'+(c[3]>2?'s':''):'')+'</div></div>';
  }).join('');
  document.querySelectorAll('#hlRibbon .hl-card').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-hlid')); });
  });
}

function renderCategoryChart(){
  var cats = DATA.catList.slice().sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); });
  var maxCat = Math.max.apply(null, cats.map(function(c){ return CAT_COUNT[c]||0; }));
  document.getElementById('chartCategory').innerHTML = cats.map(function(c){
    var n = CAT_COUNT[c]||0;
    var pct = maxCat ? (n/maxCat*100) : 0;
    var cls = 'barrow clickable'+(statsScope===c?' scoped':'')+gcls(c);
    return '<div class="'+cls+'" data-catrow="'+esc(c)+'"><div class="lbl">'+esc(c)+'</div>'+
      '<div class="track"><div class="fill" style="width:'+pct+'%;background:'+catColorVar(c)+'"></div></div>'+
      '<div class="val">'+fmtN(n)+'</div></div>';
  }).join('');
  document.querySelectorAll('#chartCategory [data-catrow]').forEach(function(el){
    el.addEventListener('click', function(){ setStatsScope(el.getAttribute('data-catrow')); });
  });
}

function renderOrganismChart(sub){
  var orgCount = {};
  sub.forEach(function(e){ orgCount[e.org] = (orgCount[e.org]||0)+1; });
  var orgTop = Object.keys(orgCount).sort(function(a,b){ return orgCount[b]-orgCount[a]; }).slice(0,12);
  var maxOrg = orgCount[orgTop[0]]||1;
  document.getElementById('subOrganism').textContent = statsScope ? 'within '+statsScope : 'by number of characterized toxins';
  document.getElementById('chartOrganism').innerHTML = orgTop.length ? orgTop.map(function(o){
    var n = orgCount[o];
    var short = o.split(' (')[0];
    return '<div class="barrow"><div class="lbl" title="'+esc(o)+'"><em>'+esc(short)+'</em></div>'+
      '<div class="track"><div class="fill" style="width:'+(n/maxOrg*100)+'%;background:var(--amber)"></div></div>'+
      '<div class="val">'+n+'</div></div>';
  }).join('') : '<div style="color:var(--faint);font-size:11.5px;">no data</div>';
}

function renderClassChart(sub){
  var cc = {};
  sub.forEach(function(e){ if(e.cls!==null && e.cls!==undefined) cc[e.cls]=(cc[e.cls]||0)+1; });
  var top = Object.keys(cc).map(Number).sort(function(a,b){ return cc[b]-cc[a]; }).slice(0,12);
  var maxV = top.length ? cc[top[0]] : 1;
  document.getElementById('subClass').textContent = statsScope ? 'within '+statsScope : 'broad grouping, e.g. 3FTx, SVMP, PLA2, disintegrin';
  document.getElementById('chartClass').innerHTML = top.length ? top.map(function(i){
    var n = cc[i];
    return '<div class="barrow"><div class="lbl" title="'+esc(DATA.classList[i])+'">'+esc(DATA.classList[i])+'</div>'+
      '<div class="track"><div class="fill" style="width:'+(n/maxV*100)+'%;background:var(--amber)"></div></div>'+
      '<div class="val">'+n+'</div></div>';
  }).join('') : '<div style="color:var(--faint);font-size:11.5px;">no data</div>';
}

function renderFamilyChart(sub){
  var fc = {};
  sub.forEach(function(e){ if(e.fam!==null && e.fam!==undefined) fc[e.fam]=(fc[e.fam]||0)+1; });
  var top = Object.keys(fc).map(Number).sort(function(a,b){ return fc[b]-fc[a]; }).slice(0,12);
  var maxV = top.length ? fc[top[0]] : 1;
  document.getElementById('subFamily').textContent = statsScope ? 'within '+statsScope : 'specific UniProt family / superfamily classification';
  document.getElementById('chartFamily').innerHTML = top.length ? top.map(function(i){
    var n = fc[i];
    return '<div class="barrow"><div class="lbl" title="'+esc(DATA.famList[i])+'">'+esc(DATA.famList[i])+'</div>'+
      '<div class="track"><div class="fill" style="width:'+(n/maxV*100)+'%;background:var(--teal)"></div></div>'+
      '<div class="val">'+n+'</div></div>';
  }).join('') : '<div style="color:var(--faint);font-size:11.5px;">no data</div>';
}

function renderIprChart(sub){
  var ic = {};
  sub.forEach(function(e){ (e.ipr||[]).forEach(function(i){ ic[i]=(ic[i]||0)+1; }); });
  var top = Object.keys(ic).map(Number).sort(function(a,b){ return ic[b]-ic[a]; }).slice(0,12);
  var maxV = top.length ? ic[top[0]] : 1;
  document.getElementById('subIpr').textContent = (statsScope ? 'within '+statsScope+', ' : '')+'domain/family signatures matched on the sequence, top 12';
  document.getElementById('chartIpr').innerHTML = top.length ? top.map(function(i){
    var n = ic[i];
    var id = DATA.iprList[i];
    return '<div class="barrow"><div class="lbl"><a href="https://www.ebi.ac.uk/interpro/entry/InterPro/'+esc(id)+'/" target="_blank" rel="noopener" style="color:inherit;">'+esc(id)+'</a></div>'+
      '<div class="track"><div class="fill" style="width:'+(n/maxV*100)+'%;background:var(--teal)"></div></div>'+
      '<div class="val">'+n+'</div></div>';
  }).join('') : '<div style="color:var(--faint);font-size:11.5px;">no data</div>';
}

function renderMfChart(sub){
  var mc = {};
  sub.forEach(function(e){ (e.mfi||[]).forEach(function(i){ mc[i]=(mc[i]||0)+1; }); });
  var top = Object.keys(mc).map(Number).sort(function(a,b){ return mc[b]-mc[a]; }).slice(0,12);
  var maxV = top.length ? mc[top[0]] : 1;
  document.getElementById('subMf').textContent = (statsScope ? 'within '+statsScope+', ' : '')+'GO molecular function \u2014 what the toxin does to its target, top 12';
  document.getElementById('chartMf').innerHTML = top.length ? top.map(function(i){
    var n = mc[i], m = MF_LIST[i];
    return '<div class="barrow"><div class="lbl"><a href="https://www.ebi.ac.uk/QuickGO/term/GO:'+m.go+'" target="_blank" rel="noopener" style="color:inherit;" title="'+esc(m.term)+'">'+esc(m.term)+'</a></div>'+
      '<div class="track"><div class="fill" style="width:'+(n/maxV*100)+'%;background:var(--amber)"></div></div>'+
      '<div class="val">'+n+'</div></div>';
  }).join('') : '<div style="color:var(--faint);font-size:11.5px;">no data</div>';
}

function renderHistogram(sub){
  var counts = LEN_BINS.map(function(){ return 0; });
  sub.forEach(function(e){
    if(e.len===null) return;
    for(var i=0;i<LEN_BINS.length;i++){
      if(e.len>=LEN_BINS[i][0] && e.len<LEN_BINS[i][1]){ counts[i]++; break; }
    }
  });
  var maxH = Math.max.apply(null,counts);
  document.getElementById('statsScope2').textContent = (statsScope?statsScope+', ':'')+'amino acids, '+fmtN(sub.length)+' records';
  document.getElementById('histChart').innerHTML = counts.map(function(c,i){
    var h = maxH ? Math.max(2, c/maxH*130) : 2;
    return '<div class="histbar" style="height:'+h+'px" title="'+LEN_BINS[i][0]+'–'+(isFinite(LEN_BINS[i][1])?LEN_BINS[i][1]:'∞')+' aa: '+c+'"></div>';
  }).join('');
  document.getElementById('histAxis').innerHTML = LEN_BINS.map(function(b){
    return '<span>'+b[0]+(isFinite(b[1])?'':'+')+'</span>';
  }).join('');
}

function renderCoverage(sub){
  var n = sub.length || 1;
  var metrics = [
    ['Has 3D structure (PDB)', sub.filter(function(e){ return e.pdb && e.pdb.length; }).length],
    ['Has an AlphaFold model', sub.filter(function(e){ return e.af; }).length],
    ['InterPro domain/family assigned', sub.filter(function(e){ return e.ipr && e.ipr.length; }).length],
    ['Enzymatic (has EC number)', sub.filter(function(e){ return e.ec && e.ec.length; }).length],
    ['Toxic dose reported', sub.filter(function(e){ return e.td && e.td.length; }).length],
    ['Post-translational mod. noted', sub.filter(function(e){ return e.ptm && e.ptm.length; }).length],
    ['Molecular function (GO) assigned', sub.filter(function(e){ return e.mf && e.mf.length; }).length],
    ['Well studied (5+ publications)', sub.filter(function(e){ return e.pm && e.pm.length>=5; }).length]
  ];
  document.getElementById('subCoverage').textContent = (statsScope?statsScope+', ':'')+fmtN(sub.length)+' records';
  document.getElementById('chartCoverage').innerHTML = metrics.map(function(m){
    var pct = (m[1]/n*100);
    return '<div class="barrow"><div class="lbl">'+m[0]+'</div>'+
      '<div class="track"><div class="fill" style="width:'+pct+'%;background:var(--teal)"></div></div>'+
      '<div class="val">'+pct.toFixed(0)+'%</div></div>';
  }).join('');
}

function renderBoxPlot(){
  var cats = DATA.catList.slice().sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); });
  var globalMax = 1;
  var rows = cats.map(function(c){
    var lens = ENTRIES.filter(function(e){ return e.cat===c && e.len; }).map(function(e){ return e.len; }).sort(function(a,b){ return a-b; });
    if(!lens.length) return null;
    var min = lens[0], max = lens[lens.length-1];
    var q1 = quantile(lens,0.25), med = quantile(lens,0.5), q3 = quantile(lens,0.75);
    globalMax = Math.max(globalMax, max);
    return {c:c, min:min, max:max, q1:q1, med:med, q3:q3};
  }).filter(Boolean);

  var logMax = Math.log(globalMax+1);
  function pct(v){ return (Math.log(v+1)/logMax*100); }

  document.getElementById('boxPlot').innerHTML = rows.map(function(r){
    var scoped = statsScope===r.c ? ' scoped' : '';
    return '<div class="boxrow clickable'+scoped+gcls(r.c)+'" data-grp="'+esc(r.c)+'">'+
      '<div class="lbl" style="color:'+(statsScope===r.c?'var(--amber)':'')+'">'+esc(r.c)+'</div>'+
      '<div class="btrack" title="'+r.c+': min '+r.min+', median '+Math.round(r.med)+', max '+r.max+' aa">'+
        '<div class="bwhisker" style="left:'+pct(r.min)+'%;width:'+(pct(r.max)-pct(r.min))+'%;"></div>'+
        '<div class="bcap" style="left:'+pct(r.min)+'%;"></div>'+
        '<div class="bcap" style="left:'+pct(r.max)+'%;"></div>'+
        '<div class="bbox" style="left:'+pct(r.q1)+'%;width:'+(pct(r.q3)-pct(r.q1))+'%;background:'+catColorVar(r.c)+';"></div>'+
        '<div class="bmed" style="left:'+pct(r.med)+'%;"></div>'+
      '</div></div>';
  }).join('');
  bindGroupRows('#boxPlot');
}

function renderMatrix(){
  var topClasses = DATA.classList.map(function(_,i){return i;})
    .sort(function(a,b){ return CLASS_COUNT[b]-CLASS_COUNT[a]; }).slice(0,8);
  var cats = DATA.catList.slice().sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); });

  var grid = {};
  ENTRIES.forEach(function(e){
    if(e.cls===null || e.cls===undefined) return;
    if(topClasses.indexOf(e.cls)===-1) return;
    var key = e.cat+'|'+e.cls;
    grid[key] = (grid[key]||0)+1;
  });
  var maxCell = 1;
  Object.keys(grid).forEach(function(k){ maxCell = Math.max(maxCell, grid[k]); });

  var el = document.getElementById('matrixChart');
  el.style.gridTemplateColumns = '130px repeat('+topClasses.length+', 1fr)';

  var html = '<div class="mhead"></div>';
  topClasses.forEach(function(ci){
    html += '<div class="mhead" title="'+esc(DATA.classList[ci])+'">'+esc(DATA.classList[ci].replace(/\s*\([^)]*\)/,''))+'</div>';
  });
  cats.forEach(function(c){
    var scoped = statsScope===c;
    html += '<div class="mrowlabel clickable'+gcls(c)+'" data-grp="'+esc(c)+'" style="'+(scoped?'color:var(--amber);font-weight:600;':'')+'">'+esc(c)+'</div>';
    topClasses.forEach(function(ci){
      var n = grid[c+'|'+ci]||0;
      var alpha = n ? 0.12 + 0.7*(n/maxCell) : 0;
      var bg = n ? 'color-mix(in srgb, '+catColorVar(c)+' '+(alpha*100).toFixed(0)+'%, transparent)' : 'transparent';
      html += '<div class="mcell clickable'+(n?'':' zero')+gcls(c)+'" data-grp="'+esc(c)+'" style="background:'+bg+'">'+(n||'·')+'</div>';
    });
  });
  el.innerHTML = html;
  bindGroupRows('#matrixChart');
}
