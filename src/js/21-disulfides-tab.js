/* js/21-disulfides-tab.js
   Disulfides tab: connectivity patterns and bond counts.
   Defines: cysPattern, buildDsStats, dsMiniSvg, renderDsHistogram, renderDsPatterns, renderDsCatChart, renderDsUnpaired, renderDisulfidesTab
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   21. DISULFIDES — dedicated analysis page
   ============================================================ */
var DS_STATS = null;

function cysPattern(e){
  if(!e.ds || !e.ds.length || !e.seq) return null;
  var cysPos = [];
  matureRanges(e).forEach(function(rg){
    for(var i=rg[0]-1;i<rg[1];i++){ if(e.seq.charAt(i)==='C') cysPos.push(i+1); }
  });
  if(!cysPos.length) return null;
  var rankOf = {};
  cysPos.forEach(function(p,i){ rankOf[p]=i+1; });
  var pairs = [];
  e.ds.forEach(function(b){
    var r1 = rankOf[b[0]], r2 = rankOf[b[1]];
    if(!r1 || !r2) return; // bond touches a residue outside the mature chain (signal peptide/propeptide) — cleaved off, not part of the final toxin
    pairs.push(r1<r2 ? [r1,r2] : [r2,r1]);
  });
  if(!pairs.length) return null;
  pairs.sort(function(a,b){ return a[0]-b[0] || a[1]-b[1]; });
  var pairedRanks = {};
  pairs.forEach(function(p){ pairedRanks[p[0]]=1; pairedRanks[p[1]]=1; });
  var free = cysPos.length - Object.keys(pairedRanks).length;
  return {
    nCys: cysPos.length, nBonds: pairs.length, free: free,
    pattern: pairs.map(function(p){ return p[0]+'-'+p[1]; }).join(', '),
    pairs: pairs
  };
}

function buildDsStats(){
  var withData = [], hist = {}, patternGroups = {}, unpaired = [], catBonds = {};
  ENTRIES.forEach(function(e){
    if(!e.ds || !e.ds.length) return;
    withData.push(e);
    var n = e.ds.length;
    hist[n] = (hist[n]||0)+1;
    if(!catBonds[e.cat]) catBonds[e.cat] = {sum:0, n:0};
    catBonds[e.cat].sum += n; catBonds[e.cat].n++;

    var cp = cysPattern(e);
    e._cp = cp;
    if(!cp) return;
    if(cp.free > 0){
      unpaired.push(e);
    } else {
      if(!patternGroups[cp.pattern]) patternGroups[cp.pattern] = {pattern:cp.pattern, nCys:cp.nCys, pairs:cp.pairs, entries:[]};
      patternGroups[cp.pattern].entries.push(e);
    }
  });
  var totalBonds = withData.reduce(function(s,e){ return s+e.ds.length; },0);
  var patterns = Object.keys(patternGroups).map(function(k){ return patternGroups[k]; })
    .sort(function(a,b){ return b.entries.length - a.entries.length; });
  var catAvg = Object.keys(catBonds).map(function(c){ return {cat:c, avg:catBonds[c].sum/catBonds[c].n, n:catBonds[c].n}; })
    .filter(function(c){ return c.n >= 5; })
    .sort(function(a,b){ return b.avg-a.avg; });

  DS_STATS = {withData:withData, hist:hist, patterns:patterns, unpaired:unpaired, totalBonds:totalBonds, catAvg:catAvg};
}

function dsMiniSvg(pairs, nCys){
  var W = 220, X0 = 12, X1 = 208, y = 40;
  function X(rank){ return nCys>1 ? X0 + (rank-1)/(nCys-1)*(X1-X0) : (X0+X1)/2; }
  var s = '<svg class="ds-mini" viewBox="0 0 220 60" role="img">';
  var maxSpan = Math.max.apply(null, pairs.map(function(p){ return p[1]-p[0]; })) || 1;
  pairs.forEach(function(p){
    var x1=X(p[0]), x2=X(p[1]), span=p[1]-p[0];
    var peak = y - 6 - (span/maxSpan)*26;
    var mid=(x1+x2)/2;
    s += '<path d="M'+x1.toFixed(1)+' '+y+' Q '+mid.toFixed(1)+' '+peak.toFixed(1)+' '+x2.toFixed(1)+' '+y+'" fill="none" stroke="var(--coral)" stroke-width="1.2" opacity=".8"/>';
  });
  for(var r=1;r<=nCys;r++){
    s += '<circle cx="'+X(r).toFixed(1)+'" cy="'+y+'" r="3" fill="var(--ink-dim)"/>';
  }
  s += '</svg>';
  return s;
}

function renderDsHistogram(){
  var keys = Object.keys(DS_STATS.hist).map(Number).sort(function(a,b){ return a-b; });
  var maxV = Math.max.apply(null, keys.map(function(k){ return DS_STATS.hist[k]; }));
  var W=700,L=34,R=14,T=10,B=28,H=190;
  var barW = (W-L-R)/keys.length;
  var s = '<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  [0,0.25,0.5,0.75,1].forEach(function(p){
    var y = T+(1-p)*(H-T-B);
    s += '<line class="grid" x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'"/><text class="axis" x="'+(L-6)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(maxV*p)+'</text>';
  });
  keys.forEach(function(k,i){
    var h = (DS_STATS.hist[k]/maxV)*(H-T-B);
    var x = L+i*barW;
    s += '<rect x="'+(x+barW*0.12).toFixed(1)+'" y="'+(H-B-h).toFixed(1)+'" width="'+(barW*0.76).toFixed(1)+'" height="'+h.toFixed(1)+'" fill="var(--teal)"><title>'+k+' bond'+(k==1?'':'s')+': '+DS_STATS.hist[k]+' entries</title></rect>';
    if(keys.length<=16 || i%2===0) s += '<text class="axis" x="'+(x+barW/2).toFixed(1)+'" y="'+(H-B+13)+'" text-anchor="middle">'+k+'</text>';
  });
  s += '<text class="axis" x="'+((L+W-R)/2)+'" y="'+(H-2)+'" text-anchor="middle">number of disulfide bonds in the entry</text>';
  s += '</svg>';
  document.getElementById('dsHistogram').innerHTML = s;
}

var DS_KNOWN_SCAFFOLDS = {
  '1-4, 2-5, 3-6': 'inhibitor cystine knot (ICK/knottin) \u2014 a textbook disulfide-rich mini-protein scaffold, well studied as a drug-design template because its knotted topology is unusually resistant to heat, chemicals and proteolysis. A common starting point for grafting new bioactive loops onto a stable chassis.'
};
var DS_COMMON_THRESHOLD = 10; // >= this many entries = treated as an established, recurring scaffold rather than a one-off

function renderDsPatterns(){
  var top = DS_STATS.patterns.slice(0, 18);
  var singletons = DS_STATS.patterns.filter(function(g){ return g.entries.length===1; }).length;
  document.getElementById('dsPatternCount').textContent =
    fmtN(DS_STATS.patterns.length)+' distinct patterns across '+fmtN(DS_STATS.patterns.reduce(function(n,g){ return n+g.entries.length; },0))+' toxins \u2014 '+
    singletons+' of them ('+Math.round(singletons/DS_STATS.patterns.length*100)+'%) occur in just one toxin each';
  document.getElementById('dsPatternGrid').innerHTML = top.map(function(g){
    var cats = {}; g.entries.forEach(function(e){ cats[e.cat]=(cats[e.cat]||0)+1; });
    var catList = Object.keys(cats).sort(function(a,b){ return cats[b]-cats[a]; });
    var withPdb = g.entries.filter(function(e){ return e.pdb && e.pdb.length; }).length;
    var pdbPct = withPdb/g.entries.length*100;
    var known = DS_KNOWN_SCAFFOLDS[g.pattern];
    var tags = '<div class="ds-tags">'+
      (g.entries.length<DS_COMMON_THRESHOLD ? '<span class="ds-tag rare">found in few toxins</span>' : '')+
      (known ? '<span class="ds-tag scaffold">known drug-design scaffold</span>' : '')+
      '</div>';
    var famousNote = known ? '<div class="examples" style="color:var(--amber);margin-bottom:4px;">'+esc(known)+'</div>' : '';
    var exNames = g.entries.slice(0,3).map(function(e){ return (e.pn||e.en).split(' (')[0]; }).join('; ');
    return '<div class="icard2 ds-pattern-card">'+
      '<div class="top"><span class="nm" style="font-family:var(--font-mono);font-size:12px;">'+esc(g.pattern)+'</span><span class="val">'+g.entries.length+'</span></div>'+
      tags+
      dsMiniSvg(g.pairs, g.nCys)+
      famousNote+
      '<div class="ds-pdbbar" title="'+withPdb+' of '+g.entries.length+' entries with this pattern have a solved structure"><i style="width:'+pdbPct.toFixed(0)+'%"></i></div>'+
      '<div class="examples">'+withPdb+' of '+g.entries.length+' ('+pdbPct.toFixed(0)+'%) structurally characterized (PDB)</div>'+
      '<div class="examples"><b>'+catList.length+' animal group'+(catList.length===1?'':'s')+':</b> '+esc(catList.slice(0,4).join(', '))+'</div>'+
      '<div class="examples" title="'+esc(exNames)+'">e.g. '+esc(exNames.slice(0,90))+(exNames.length>90?'\u2026':'')+'</div>'+
    '</div>';
  }).join('');
}

function renderDsCatChart(){
  var maxV = DS_STATS.catAvg.length ? DS_STATS.catAvg[0].avg : 1;
  document.getElementById('dsCatChart').innerHTML = DS_STATS.catAvg.map(function(c){
    return '<div class="barrow"><div class="lbl">'+esc(c.cat.split(' (')[0])+'</div>'+
      '<div class="track"><div class="fill" style="width:'+(c.avg/maxV*100)+'%;background:'+catColorVar(c.cat)+'"></div></div>'+
      '<div class="val">'+c.avg.toFixed(1)+' avg \u00b7 n='+c.n+'</div></div>';
  }).join('');
}

function renderDsUnpaired(){
  document.getElementById('dsUnpairedCount').textContent = DS_STATS.unpaired.length+' entries';
  document.getElementById('dsUnpairedGrid').innerHTML = DS_STATS.unpaired.slice(0,24).map(function(e){
    var cp = e._cp;
    return '<div class="icard2 ds-unpaired-card" data-id="'+esc(e.id)+'">'+
      '<div class="top"><span class="nm">'+esc((e.pn||e.en).split(' (')[0])+'</span><span class="val" style="color:var(--coral)">'+cp.free+' free</span></div>'+
      '<div class="sub">'+esc(e.org.split(' (')[0])+' \u00b7 '+cp.nCys+' Cys, '+cp.nBonds+' bonds</div>'+
    '</div>';
  }).join('');
  document.querySelectorAll('#dsUnpairedGrid .ds-unpaired-card').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-id')); });
  });
}

function renderDisulfidesTab(){
  if(!DS_STATS) buildDsStats();
  var pct = Math.round(DS_STATS.withData.length/ENTRIES.length*100);
  document.getElementById('dsIntro').textContent =
    DS_STATS.withData.length+' of '+ENTRIES.length+' records ('+pct+'%) carry curated disulfide bond positions from UniProt.';
  document.getElementById('dsKpis').innerHTML = [
    ['Entries with curated bonds', fmtN(DS_STATS.withData.length)+' ('+pct+'%)', ''],
    ['Total bonds catalogued', fmtN(DS_STATS.totalBonds), ''],
    ['Avg. bonds per entry (with data)', (DS_STATS.totalBonds/DS_STATS.withData.length).toFixed(1), ''],
    ['Distinct connectivity patterns', fmtN(DS_STATS.patterns.length), ''],
    ['With an unpaired cysteine', fmtN(DS_STATS.unpaired.length), 'warn']
  ].map(function(k){ return '<div class="kpi '+k[2]+'"><b>'+k[1]+'</b><span>'+k[0]+'</span></div>'; }).join('');
  renderDsHistogram();
  renderDsPatterns();
  renderDsCatChart();
  renderDsUnpaired();
}
