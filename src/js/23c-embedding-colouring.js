/* js/23c-embedding-colouring.js
   Embedding map: colouring, grouping and legend.
   Defines: embGroup, embColor, embLegendItems, embLegendSwatches, embShapeOf
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- colouring / grouping ---------- */
function embGroup(e){
  var m = EMB_COLOR_MODE, other = 'var(--faint)';
  if(m==='cat') return {label: e.cat ? e.cat.split(' (')[0] : 'Unclassified', color: e.cat ? catColorVar(e.cat) : other};
  if(m==='cls'){
    var has = (e.cls!==null && e.cls!==undefined);
    return {label: has ? DATA.classList[e.cls] : 'Unclassified', color: has ? classColor(e.cls) : other};
  }
  if(m==='agree'){ var bk = embAgreeBucket(e); return {label:bk.label, color:bk.color}; }
  if(m==='pdb'){
    var p = !!(e.pdb && e.pdb.length);
    return {label: p ? 'Has PDB structure' : 'No PDB structure', color: p ? 'var(--teal)' : other};
  }
  if(m==='ds'){
    var c = e._cp && e._cp.free===0 && EMB_DS_COLORS[e._cp.pattern];
    return {label: c ? e._cp.pattern : 'other / unpaired / no data', color: c || other};
  }
  if(e.mfi){
    for(var i=0;i<e.mfi.length;i++){
      var t = MF_LIST[e.mfi[i]].term;
      if(EMB_MECH_COLORS[t]) return {label:t, color:EMB_MECH_COLORS[t]};
    }
  }
  return {label:'other / no data', color:other};
}
function embColor(e){ return embGroup(e).color; }

var EMB_LEGEND_INTRO = {
  cat: 'Colored by animal group:', cls: 'Colored by broad toxin class:',
  pdb: '<span style="color:var(--teal)">teal</span> = has a solved (PDB) structure, <span style="color:var(--faint)">gray</span> = none:',
  ds: 'Colored by disulfide connectivity pattern (top 10; gray = other/unpaired/no data):',
  agree: 'Colored by how much a toxin\'s 15 nearest neighbours in the ProtT5 map are the same toxins as in the ProstT5 map:',
  mech: 'Colored by mechanism of action (top 10, excluding "toxin activity"; gray = other/no data):'
};

// plain-text legend entries (HTML and the exported SVG both build from these)
function embLegendItems(){
  if(EMB_COLOR_MODE==='cat'){
    var seen={}; ENTRIES.forEach(function(e){ if(e.cat) seen[e.cat]=1; });
    return Object.keys(seen).sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); })
      .map(function(c){ return {c:catColorVar(c), l:c.split(' (')[0]}; });
  }
  if(EMB_COLOR_MODE==='cls'){
    var cc={}; ENTRIES.forEach(function(e){ if(e.cls!==null&&e.cls!==undefined) cc[e.cls]=(cc[e.cls]||0)+1; });
    return Object.keys(cc).map(Number).sort(function(a,b){ return cc[b]-cc[a]; }).slice(0,12)
      .map(function(i){ return {c:classColor(i), l:DATA.classList[i]}; });
  }
  if(EMB_COLOR_MODE==='agree'){
    var cnt = null;
    if(EMB_AGREE_READY){ cnt = EMB_AGREE_BUCKETS.map(function(){ return 0; });
      ENTRIES.forEach(function(e){ if(e._ag){ var b = embAgreeBucket(e); cnt[EMB_AGREE_BUCKETS.indexOf(b)]++; } }); }
    return EMB_AGREE_BUCKETS.map(function(b,i){ return {c:b.color, l:b.label, n:(cnt ? cnt[i] : null)}; });
  }
  if(EMB_COLOR_MODE==='pdb') return [{c:'var(--teal)', l:'has PDB structure'}, {c:'var(--faint)', l:'none'}];
  if(EMB_COLOR_MODE==='ds'){
    var items = DS_STATS.patterns.slice(0,10).map(function(g,i){ return {c:classColor(i), l:g.pattern, mono:true}; });
    items.push({c:'var(--faint)', l:'other / unpaired / no data'});
    return items;
  }
  var m = Object.keys(EMB_MECH_COLORS).map(function(t){ return {c:EMB_MECH_COLORS[t], l:t}; });
  m.push({c:'var(--faint)', l:'other / no data'});
  return m;
}
function embLegendSwatches(){
  return '<div class="who-map-legend" style="margin-top:6px;">'+embLegendItems().map(function(it, i){
    var sw = EMB_SHAPES
      ? '<svg class="lg-shape" width="12" height="12" viewBox="-1.5 -1.5 3 3"><path d="'+EMB_SHAPE_PATHS[i % EMB_SHAPE_PATHS.length]+'" fill="'+it.c+'"/></svg>'
      : '<span class="who-map-swatch" style="background:'+it.c+'"></span>';
    return '<button type="button" class="who-map-legend-item emb-lg" data-lbl="'+esc(it.l)+'" title="Click to select every toxin in this group">'+sw+
      (it.mono ? '<span style="font-family:var(--font-mono)">'+esc(it.l)+'</span>' : esc(it.l))+(it.n!=null ? ' <span style="color:var(--muted)">\u00b7 '+fmtN(it.n)+'</span>' : '')+'</button>';
  }).join('')+'</div>';
}
function embShapeOf(e){
  var i = EMB_SHAPE_IDX[embGroup(e).label.toLowerCase()];
  return EMB_SHAPE_PATHS[(i===undefined ? 0 : i) % EMB_SHAPE_PATHS.length];
}
