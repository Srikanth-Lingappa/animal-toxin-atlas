/* js/22-taxonomy-tab.js
   Taxonomy tab: the tree of source organisms and its colouring.
   Defines: buildTaxTree, compressChain, rollupTax, pdbColor, dsColor, whoColor, mechColor, taxColorsFor, renderTaxNode, swatchLegendHtml, buildTaxLegendSwatches, repaintTax ...
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   22. TAXONOMY TAB — taxonomic tree of source organisms
   ============================================================ */
var TAX_ROOT = null;
var TAX_COLOR_MODE = 'cat';
var TAX_DS_COLORS = {}; // pattern string -> color, for the top N patterns
var TAX_MF_COLORS = {}; // GO molecular function term -> color, for the top N mechanisms

function buildTaxTree(){
  // root is a bare container — never rendered itself, only its (post-compression) children are
  var root = {name:'', rank:'', children:{}, isSpecies:false};
  Object.keys(DATA.lineage).forEach(function(sci){
    var lin = DATA.lineage[sci].concat([[sci,'species']]);
    var node = root;
    lin.forEach(function(pair){
      var name = pair[0], rank = pair[1];
      if(!node.children[name]) node.children[name] = {name:name, rank:rank, children:{}, isSpecies:false};
      node = node.children[name];
    });
    node.isSpecies = true;
    node.sci = sci;
  });
  compressChain(root);
  rollupTax(root);
  return root;
}

function compressChain(node){
  var keys = Object.keys(node.children);
  while(!node.isSpecies && keys.length===1){
    var child = node.children[keys[0]];
    node.mergedNames = (node.mergedNames || [node.name]).concat([child.name]);
    node.rank = child.rank;
    node.children = child.children;
    node.isSpecies = child.isSpecies;
    node.sci = child.sci;
    keys = Object.keys(node.children);
  }
  Object.keys(node.children).forEach(function(k){ compressChain(node.children[k]); });
}

function rollupTax(node){
  // a node can be BOTH a species (has its own UniProt records) AND a parent of other
  // nodes — e.g. "Vipera berus" has its own entries but also a "Vipera berus berus"
  // subspecies child. Compute this node's own contribution first, then fold in children.
  var ownRec=0, ownCat=null, ownWho=false, ownPdbPct=null, ownDs=null, ownMech=null, ownSp=0;
  if(node.isSpecies){
    ownSp = 1;
    var o = ORG_MAP[node.sci];
    ownRec = o ? o.entries.length : 0;
    ownCat = o ? o.cat : null;
    ownWho = !!(o && o.who);
    var withPdb = o ? o.entries.filter(function(e){ return e.pdb && e.pdb.length; }).length : 0;
    ownPdbPct = o && o.entries.length ? withPdb/o.entries.length : null;
    var tally = {}, mechTally = {};
    if(o) o.entries.forEach(function(e){
      if(e._cp && e._cp.free===0) tally[e._cp.pattern] = (tally[e._cp.pattern]||0)+1;
      (e.mfi||[]).forEach(function(i){
        var term = MF_LIST[i].term;
        if(term==='toxin activity') return; // true of almost every entry — not a useful discriminator here
        mechTally[term] = (mechTally[term]||0)+1;
      });
    });
    var top=null, topN=0;
    Object.keys(tally).forEach(function(p){ if(tally[p]>topN){ topN=tally[p]; top=p; } });
    ownDs = top;
    var topM=null, topMN=0;
    Object.keys(mechTally).forEach(function(p){ if(mechTally[p]>topMN){ topMN=mechTally[p]; topM=p; } });
    ownMech = topM;
  }
  var childKeys = Object.keys(node.children);
  if(!childKeys.length){
    node.recCount=ownRec; node.spCount=ownSp; node.cat=ownCat; node.who=ownWho; node.pdbPct=ownPdbPct; node.dsPattern=ownDs; node.mech=ownMech;
    return;
  }
  node.recCount = ownRec; node.spCount = ownSp; node.who = ownWho;
  var catTally={}, pdbSum = ownPdbPct!==null ? ownPdbPct*ownSp : 0, pdbN = ownPdbPct!==null ? ownSp : 0, dsTally={}, mechTally2={};
  if(ownCat) catTally[ownCat] = (catTally[ownCat]||0) + ownSp;
  if(ownDs) dsTally[ownDs] = (dsTally[ownDs]||0) + ownSp;
  if(ownMech) mechTally2[ownMech] = (mechTally2[ownMech]||0) + ownSp;
  childKeys.forEach(function(k){
    var c = node.children[k];
    rollupTax(c);
    node.recCount += c.recCount;
    node.spCount += c.spCount;
    if(c.who) node.who = true;
    if(c.cat) catTally[c.cat] = (catTally[c.cat]||0) + c.spCount;
    if(c.pdbPct!==null){ pdbSum += c.pdbPct*c.spCount; pdbN += c.spCount; }
    if(c.dsPattern) dsTally[c.dsPattern] = (dsTally[c.dsPattern]||0) + c.spCount;
    if(c.mech) mechTally2[c.mech] = (mechTally2[c.mech]||0) + c.spCount;
  });
  var topCat=null, topCatN=0;
  Object.keys(catTally).forEach(function(c){ if(catTally[c]>topCatN){ topCatN=catTally[c]; topCat=c; } });
  node.cat = topCat;
  node.pdbPct = pdbN ? pdbSum/pdbN : null;
  var topDs=null, topDsN=0;
  Object.keys(dsTally).forEach(function(p){ if(dsTally[p]>topDsN){ topDsN=dsTally[p]; topDs=p; } });
  node.dsPattern = topDs;
  var topMech=null, topMechN=0;
  Object.keys(mechTally2).forEach(function(p){ if(mechTally2[p]>topMechN){ topMechN=mechTally2[p]; topMech=p; } });
  node.mech = topMech;
  node.ownRec = ownRec;
}

function pdbColor(pct){
  if(pct===null) return 'var(--faint)';
  return pct>=0.66 ? 'var(--teal)' : pct>=0.34 ? 'var(--amber)' : 'var(--coral)';
}
function dsColor(pattern){
  if(!pattern) return 'var(--faint)';
  return TAX_DS_COLORS[pattern] || 'var(--faint)';
}
function whoColor(who){ return who ? 'var(--coral)' : 'var(--faint)'; }
function mechColor(term){
  if(!term) return 'var(--faint)';
  return TAX_MF_COLORS[term] || 'var(--faint)';
}

function taxColorsFor(node){
  return {
    cat: node.cat ? catColorVar(node.cat) : 'var(--faint)',
    pdb: pdbColor(node.pdbPct),
    who: whoColor(node.who),
    ds: dsColor(node.dsPattern),
    mech: mechColor(node.mech)
  };
}

function renderTaxNode(node, depth){
  var label = node.mergedNames ? node.mergedNames.join(' \u203a ') : node.name;
  var c = taxColorsFor(node);
  var swatch = '<span class="tax-swatch" data-c-cat="'+c.cat+'" data-c-pdb="'+c.pdb+'" data-c-who="'+c.who+'" data-c-ds="'+c.ds+'" data-c-mech="'+c.mech+'" style="background:'+c[TAX_COLOR_MODE]+'"></span>';
  var hasChildren = Object.keys(node.children).length > 0;

  if(node.isSpecies && !hasChildren){
    return '<div class="tax-leaf" data-sci="'+esc(node.sci)+'" data-name="'+esc(label.toLowerCase())+'">'+swatch+
      '<span class="tax-name">'+esc(label)+'</span>'+
      (node.who ? '<span class="tax-who">WHO</span>' : '')+
      '<span class="tax-n">'+node.recCount+' rec</span></div>';
  }

  var kids = Object.keys(node.children).sort(function(a,b){ return node.children[b].spCount - node.children[a].spCount; });
  var childHtml = kids.map(function(k){ return renderTaxNode(node.children[k], depth+1); }).join('');
  // a node can itself be a named species AND have children (e.g. subspecies) — in that
  // case give it a small inline link to open its own organism page without toggling the tree
  var selfLink = node.isSpecies ? '<a class="tax-self-link" data-sci="'+esc(node.sci)+'" title="This clade name is itself a species with '+(node.ownRec||0)+' record(s) — open its organism page">view\u00a0\u203a</a>' : '';
  return '<details'+(depth<1?' open':'')+' data-name="'+esc(label.toLowerCase())+'"><summary>'+swatch+
    '<span class="tax-name">'+esc(label)+'</span>'+
    '<span class="tax-rank">'+esc(node.rank)+'</span>'+
    (node.who ? '<span class="tax-who">WHO</span>' : '')+
    selfLink+
    '<span class="tax-n">'+node.spCount+' sp \u00b7 '+node.recCount+' rec</span></summary>'+
    '<div class="tax-children">'+childHtml+'</div></details>';
}

var TAX_LEGEND_INTRO = {
  cat: 'Each dot is colored by the dominant animal group below that point in the tree (a leaf is just its own group):',
  pdb: 'Each dot is colored by what share of records below that point have a solved (PDB) structure:',
  who: 'Each dot shows whether a WHO medically important snake species is somewhere below that point:',
  ds: 'Each dot is colored by the most common disulfide connectivity pattern below that point (top 10 patterns only; everything else is gray) &mdash; matching colors in distant branches is a sign of convergent evolution onto the same scaffold:',
  mech: 'Each dot is colored by the most common mechanism of action (GO molecular function, excluding the near-universal "toxin activity") below that point (top 10 only; everything else is gray) &mdash; matching colors in distant branches means unrelated animals target the same kind of molecule:'
};

function swatchLegendHtml(items){
  return '<div class="who-map-legend" style="margin-top:6px;">'+items.map(function(it){
    return '<span class="who-map-legend-item"><span class="who-map-swatch" style="background:'+it[0]+'"></span>'+it[1]+'</span>';
  }).join('')+'</div>';
}

function buildTaxLegendSwatches(){
  if(TAX_COLOR_MODE==='cat'){
    var seen = {};
    (function walk(n){ if(n.cat) seen[n.cat]=1; Object.keys(n.children).forEach(function(k){ walk(n.children[k]); }); })(TAX_ROOT);
    var cats = Object.keys(seen).sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); });
    return swatchLegendHtml(cats.map(function(c){ return [catColorVar(c), esc(c.split(' (')[0])]; }));
  }
  if(TAX_COLOR_MODE==='pdb'){
    return swatchLegendHtml([
      ['var(--teal)','mostly solved (&ge;66%)'], ['var(--amber)','partially solved (34&ndash;66%)'],
      ['var(--coral)','mostly unsolved (&lt;34%)'], ['var(--faint)','no structural data']
    ]);
  }
  if(TAX_COLOR_MODE==='who'){
    return swatchLegendHtml([['var(--coral)','WHO medically important species below'], ['var(--faint)','none below']]);
  }
  if(TAX_COLOR_MODE==='ds'){
    var dsItems = DS_STATS.patterns.slice(0,10).map(function(g,i){ return [classColor(i), '<span style="font-family:var(--font-mono)">'+esc(g.pattern)+'</span>']; });
    dsItems.push(['var(--faint)','other / none']);
    return swatchLegendHtml(dsItems);
  }
  // mech
  var mechTerms = Object.keys(TAX_MF_COLORS);
  var mechItems = mechTerms.map(function(t){ return [TAX_MF_COLORS[t], esc(t)]; });
  mechItems.push(['var(--faint)','other / none']);
  return swatchLegendHtml(mechItems);
}

function repaintTax(){
  document.querySelectorAll('#taxTree .tax-swatch').forEach(function(el){
    el.style.background = el.getAttribute('data-c-'+TAX_COLOR_MODE);
  });
  document.getElementById('taxLegend').innerHTML = TAX_LEGEND_INTRO[TAX_COLOR_MODE] + buildTaxLegendSwatches();
}

function renderTaxonTab(){
  if(!DS_STATS) buildDsStats();
  TAX_DS_COLORS = {};
  DS_STATS.patterns.slice(0,10).forEach(function(g,i){ TAX_DS_COLORS[g.pattern] = classColor(i); });
  TAX_MF_COLORS = {};
  MF_LIST.map(function(m,i){ return {term:m.term, n:MF_COUNT[i]}; })
    .filter(function(m){ return m.term!=='toxin activity'; })
    .sort(function(a,b){ return b.n-a.n; })
    .slice(0,10)
    .forEach(function(m,i){ TAX_MF_COLORS[m.term] = classColor(i); });
  TAX_ROOT = buildTaxTree();

  var phyla = Object.keys(TAX_ROOT.children).length;
  document.getElementById('taxIntro').textContent =
    'Built from NCBI taxonomic lineage for all '+fmtN(TAX_ROOT.spCount)+' source organisms in this dataset.';
  document.getElementById('taxKpis').innerHTML = [
    ['Source organisms (species)', fmtN(TAX_ROOT.spCount), ''],
    ['Major lineages at root', fmtN(phyla), ''],
    ['Toxin records represented', fmtN(TAX_ROOT.recCount), ''],
    ['WHO medically important lineages', TAX_ROOT.who ? 'present' : 'none', '']
  ].map(function(k){ return '<div class="kpi '+k[2]+'"><b>'+k[1]+'</b><span>'+k[0]+'</span></div>'; }).join('');

  var kids = Object.keys(TAX_ROOT.children).sort(function(a,b){ return TAX_ROOT.children[b].spCount - TAX_ROOT.children[a].spCount; });
  document.getElementById('taxTree').innerHTML = kids.map(function(k){ return renderTaxNode(TAX_ROOT.children[k], 0); }).join('');
  repaintTax();

  document.querySelectorAll('#taxTree .tax-leaf').forEach(function(el){
    el.addEventListener('click', function(){
      switchToTab('organism');
      openOrganism(el.getAttribute('data-sci'));
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
  document.querySelectorAll('#taxTree .tax-self-link').forEach(function(el){
    el.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      switchToTab('organism');
      openOrganism(el.getAttribute('data-sci'));
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });

  document.querySelectorAll('#taxColorMode button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#taxColorMode button').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      TAX_COLOR_MODE = b.getAttribute('data-m');
      repaintTax();
    });
  });

  var taxMatches = [], taxMatchIdx = -1;

  function taxGoToMatch(i){
    if(!taxMatches.length) return;
    taxMatchIdx = ((i % taxMatches.length) + taxMatches.length) % taxMatches.length;
    var el = taxMatches[taxMatchIdx];
    var target = el.tagName === 'DETAILS' ? el.querySelector('summary') : el;
    target.scrollIntoView({behavior:'smooth', block:'center'});
    target.classList.remove('tax-flash'); void target.offsetWidth; target.classList.add('tax-flash');
    document.getElementById('taxMatchCount').textContent = (taxMatchIdx+1)+' / '+taxMatches.length;
  }

  document.getElementById('taxSearchInput').addEventListener('input', debounce(function(e){
    var q = e.target.value.trim().toLowerCase();
    var all = document.querySelectorAll('#taxTree [data-name]');
    if(!q){
      all.forEach(function(el){ el.classList.remove('tax-dim','tax-match'); });
      document.getElementById('taxMatchNav').style.display = 'none';
      taxMatches = []; taxMatchIdx = -1;
      return;
    }
    var keep = new Set();
    taxMatches = [];
    all.forEach(function(el){
      var hit = el.getAttribute('data-name').indexOf(q) !== -1;
      el.classList.toggle('tax-match', hit);
      if(!hit) return;
      taxMatches.push(el);
      keep.add(el);
      // keep (and open) every ancestor <details> so the path down to this match stays visible —
      // everything NOT on a match's path gets hidden entirely, not just dimmed, so the list actually shrinks
      var startEl = el.tagName === 'DETAILS' ? el.parentElement : el;
      var anc = startEl.closest('details');
      while(anc){
        keep.add(anc);
        anc.open = true;
        anc = anc.parentElement.closest('details');
      }
    });
    all.forEach(function(el){ el.classList.toggle('tax-dim', !keep.has(el)); });
    document.getElementById('taxMatchNav').style.display = taxMatches.length ? '' : 'none';
    if(taxMatches.length) taxGoToMatch(0);
  }, 150));

  document.getElementById('taxNextMatch').addEventListener('click', function(){ taxGoToMatch(taxMatchIdx+1); });
  document.getElementById('taxPrevMatch').addEventListener('click', function(){ taxGoToMatch(taxMatchIdx-1); });
}
