/* js/11b-sequence-and-alphafold-stats.js
   Statistics > Sequence & AlphaFold: amino acid composition, cysteine content, pI and pLDDT charts.
   Defines: aaColor, matSeq, renderAaChart, renderCysChart, renderPiChart, plb, renderPlHist, renderPlRegions, renderPlGroups, renderAllStats, buildStatsTab
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- sequence composition + AlphaFold confidence stats ---------- */
var aaMode = 'mature';
var AA_ORDER = 'ACDEFGHIKLMNPQRSTVWY';
var AA_NAME = {A:'Alanine',R:'Arginine',N:'Asparagine',D:'Aspartate',C:'Cysteine',Q:'Glutamine',E:'Glutamate',G:'Glycine',H:'Histidine',I:'Isoleucine',L:'Leucine',K:'Lysine',M:'Methionine',F:'Phenylalanine',P:'Proline',S:'Serine',T:'Threonine',W:'Tryptophan',Y:'Tyrosine',V:'Valine'};
// UniProtKB/Swiss-Prot complete-database composition, release 2026_03 (percent)
var AA_SWISSPROT = {A:8.25,R:5.52,N:4.06,D:5.46,C:1.38,Q:3.93,E:6.71,G:7.07,H:2.27,I:5.90,L:9.64,K:5.79,M:2.41,F:3.86,P:4.75,S:6.66,T:5.36,W:1.10,Y:2.92,V:6.85};
function aaColor(a){ return a==='C' ? 'var(--coral)' : 'KRHDE'.indexOf(a)>=0 ? 'var(--amber)' : 'AVLIMFW'.indexOf(a)>=0 ? 'var(--teal)' : 'var(--muted)'; }
function matSeq(e){ if(e._mat===undefined) e._mat = e.seq ? matureSeqOf(e) : null; return e._mat; }

function renderAaChart(sub){
  var cnt = {}, tot = 0, recs = 0;
  AA_ORDER.split('').forEach(function(a){ cnt[a]=0; });
  sub.forEach(function(e){
    var q = aaMode==='mature' ? matSeq(e) : e.seq;
    if(!q) return; recs++;
    for(var i=0;i<q.length;i++){ var a=q[i]; if(cnt[a]!==undefined){ cnt[a]++; tot++; } }
  });
  document.getElementById('subAa').textContent = (statsScope?statsScope+', ':'')+fmtN(recs)+' records, '+fmtN(tot)+' residues ('+(aaMode==='mature'?'signal peptide and propeptide removed':'full translated precursor')+'). Tick = Swiss-Prot overall composition; × = enrichment over it.';
  var rows = AA_ORDER.split('').map(function(a){ return {a:a, p: tot? cnt[a]/tot*100 : 0}; }).sort(function(x,y){ return y.p-x.p; });
  var mx = Math.max(12, Math.max.apply(null, rows.map(function(r){ return Math.max(r.p, AA_SWISSPROT[r.a]); })))*1.05;
  document.getElementById('chartAa').innerHTML = rows.map(function(r){
    var sp = AA_SWISSPROT[r.a], x = r.p/sp;
    return '<div class="barrow"><div class="lbl" title="'+AA_NAME[r.a]+'"><b style="font-family:var(--font-mono);color:var(--ink)">'+r.a+'</b> '+AA_NAME[r.a]+'</div>'+
      '<div class="track"><div class="fill" style="width:'+(r.p/mx*100)+'%;background:'+aaColor(r.a)+'"></div><div class="tick" style="left:'+(sp/mx*100)+'%" title="Swiss-Prot overall composition '+sp.toFixed(2)+'%"></div></div>'+
      '<div class="val"><b>'+r.p.toFixed(1)+'%</b> · '+(x>=1.995||x<0.505 ? x.toFixed(1) : x.toFixed(2))+'×</div></div>';
  }).join('');
}

function renderCysChart(){
  var g = {};
  ENTRIES.forEach(function(e){
    var q = matSeq(e); if(!q || !q.length) return;
    var o = g[e.cat] || (g[e.cat] = {n:0, sum:0});
    o.n++; o.sum += q.split('C').length-1 > 0 ? (q.split('C').length-1)/q.length*100 : 0;
  });
  var rows = Object.keys(g).map(function(c){ return {c:c, v:g[c].sum/g[c].n, n:g[c].n}; }).sort(function(a,b){ return b.v-a.v; });
  var mx = rows.length ? rows[0].v : 1;
  document.getElementById('chartCys').innerHTML = rows.map(function(r){
    return '<div class="barrow clickable'+(statsScope===r.c?' scoped':'')+gcls(r.c)+'" data-grp="'+esc(r.c)+'"><div class="lbl" title="'+esc(r.c)+' ('+r.n+' records)">'+esc(r.c.split(' (')[0])+'</div>'+
      '<div class="track"><div class="fill" style="width:'+(r.v/mx*100)+'%;background:'+catColorVar(r.c)+'"></div></div>'+
      '<div class="val">'+r.v.toFixed(1)+'%</div></div>';
  }).join('');
  bindGroupRows('#chartCys');
}

function renderPiChart(sub){
  var bins = []; for(var i=0;i<10;i++) bins.push(0);   // 3-4, 4-5 ... 12+
  var n = 0, basic = 0, acidic = 0;
  sub.forEach(function(e){
    var q = matSeq(e); if(!q || q.length<2) return;
    if(e._pi===undefined) e._pi = isoelectricPoint(q);
    var b = Math.max(0, Math.min(9, Math.floor(e._pi)-3)); bins[b]++; n++;
    if(e._pi>8) basic++; else if(e._pi<6) acidic++;
  });
  var mx = Math.max.apply(null, bins);
  document.getElementById('subPi').textContent = (statsScope?statsScope+', ':'')+'calculated from the mature region · '+(n?Math.round(basic/n*100):0)+'% basic (pI > 8), '+(n?Math.round(acidic/n*100):0)+'% acidic (pI < 6)';
  document.getElementById('piChart').innerHTML = bins.map(function(c,i){
    return '<div class="histbar" style="height:'+(mx? Math.max(2,c/mx*240):2)+'px" title="pI '+(i+3)+(i===9?'+':'–'+(i+4))+': '+c+' records"></div>';
  }).join('');
  document.getElementById('piAxis').innerHTML = bins.map(function(c,i){ return '<span>'+(i+3)+(i===9?'+':'')+'</span>'; }).join('');
}

var PLC = ['#0053d6','#65cbf3','#ffdb13','#ff7d45'];
function plb(m){ return m>=90?0:m>=70?1:m>=50?2:3; }
function renderPlHist(sub){
  var bins = []; for(var i=0;i<8;i++) bins.push(0);   // 30-40 ... 100
  var n = 0, ok70 = 0;
  sub.forEach(function(e){
    if(e.plm===undefined) return;
    n++; if(e.plm>=70) ok70++;
    bins[Math.max(0, Math.min(7, Math.floor(e.plm/10)-3))]++;
  });
  var mx = Math.max.apply(null, bins);
  document.getElementById('subPl').textContent = (statsScope?statsScope+', ':'')+fmtN(n)+' records with an AlphaFold model · '+(n?Math.round(ok70/n*100):0)+'% have mean pLDDT ≥ 70';
  document.getElementById('plChart').innerHTML = bins.map(function(c,i){
    var lo = (i+3)*10;
    return '<div class="histbar" style="height:'+(mx? Math.max(2,c/mx*130):2)+'px;background:'+PLC[plb(lo+5)]+';opacity:.9" title="pLDDT '+lo+'–'+(lo+10)+': '+c+' records"></div>';
  }).join('');
  document.getElementById('plAxis').innerHTML = bins.map(function(c,i){ return '<span>'+((i+3)*10)+'</span>'; }).join('');
}
function renderPlRegions(sub){
  var R = {sp:[0,0,0,0], pro:[0,0,0,0], mat:[0,0,0,0]};
  sub.forEach(function(e){
    if(!e.pl) return;
    var off = e.plo||0, L = e.pl.length;
    var add = function(k, a, b){ for(var i=Math.max(a-1,off);i<b;i++){ if(i-off>=L) break; R[k][plb(+e.pl[i-off]*10+5)]++; } };
    if(e.sp) add('sp', e.sp[0], e.sp[1]);
    (e.pro||[]).forEach(function(r){ add('pro', r[0], r[1]); });
    matureRanges(e).forEach(function(r){ add('mat', r[0], r[1]); });
  });
  var rows = [['Signal peptide','sp'],['Propeptide','pro'],['Mature chain','mat']];
  document.getElementById('subPlReg').textContent = (statsScope?statsScope+', ':'')+'share of residues in each confidence band — the regions removed before secretion are the least confidently modelled';
  document.getElementById('chartPlReg').innerHTML = rows.map(function(r){
    var v = R[r[1]], t = v[0]+v[1]+v[2]+v[3];
    if(!t) return '<div class="barrow" style="grid-template-columns:110px 1fr 70px"><div class="lbl">'+r[0]+'</div><div class="track"></div><div class="val">no data</div></div>';
    return '<div class="barrow" style="grid-template-columns:110px 1fr 70px"><div class="lbl">'+r[0]+'</div>'+
      '<div class="plreg">'+v.map(function(n,i){ return n? '<i style="width:'+(n/t*100)+'%;background:'+PLC[i]+'" title="'+Math.round(n/t*100)+'% '+['> 90','70–90','50–70','< 50'][i]+'"></i>' : ''; }).join('')+'</div>'+
      '<div class="val" title="residues analysed">'+fmtN(t)+' aa</div></div>'+
      '<div class="props-note" style="margin:-4px 0 4px 120px;">'+Math.round((v[0]+v[1])/t*100)+'% confident or better · '+Math.round(v[3]/t*100)+'% very low</div>';
  }).join('');
}
function renderPlGroups(){
  var g = {};
  ENTRIES.forEach(function(e){ if(e.plm===undefined) return; var o = g[e.cat] || (g[e.cat]={n:0,s:0}); o.n++; o.s+=e.plm; });
  var rows = Object.keys(g).filter(function(c){ return g[c].n>=10; }).map(function(c){ return {c:c, v:g[c].s/g[c].n, n:g[c].n}; }).sort(function(a,b){ return b.v-a.v; });
  document.getElementById('chartPlGroup').innerHTML = rows.map(function(r){
    return '<div class="barrow clickable'+(statsScope===r.c?' scoped':'')+gcls(r.c)+'" data-grp="'+esc(r.c)+'"><div class="lbl" title="'+esc(r.c)+' ('+r.n+' models)">'+esc(r.c.split(' (')[0])+'</div>'+
      '<div class="track"><div class="fill" style="width:'+r.v+'%;background:'+PLC[plb(r.v)]+'"></div></div>'+
      '<div class="val">'+r.v.toFixed(0)+'</div></div>';
  }).join('');
  bindGroupRows('#chartPlGroup');
}

function renderAllStats(){
  var sub = scopedEntries();
  renderScopePill();
  renderHighlights();
  renderCategoryChart();
  renderOrganismChart(sub);
  renderClassChart(sub);
  renderFamilyChart(sub);
  renderIprChart(sub);
  renderMfChart(sub);
  renderHistogram(sub);
  renderCoverage(sub);
  renderBoxPlot();
  renderMatrix();
  renderAaChart(sub);
  renderCysChart();
  renderPiChart(sub);
  renderPlHist(sub);
  renderPlRegions(sub);
  renderPlGroups();
}

function buildStatsTab(){
  renderAllStats();
}
