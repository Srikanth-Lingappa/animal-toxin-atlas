/* js/12-events-and-tabs.js
   Event handlers for the whole page: tab switching, filter inputs, statistics sub-tabs and keyboard handling.
   Defines: debounce, bindEvents
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   12. EVENTS + TABS
   ============================================================ */
function debounce(fn,ms){
  var t; return function(){ var args=arguments,ctx=this; clearTimeout(t);
    t=setTimeout(function(){ fn.apply(ctx,args); },ms); };
}

function bindEvents(){
  document.getElementById('searchInput').addEventListener('input', debounce(function(e){
    state.q = e.target.value; state.page = 1; applyAndRender();
  },160));

  document.getElementById('lenMin').addEventListener('input', debounce(function(e){
    state.lenMin = e.target.value===''?null:parseInt(e.target.value,10);
    state.page=1; applyAndRender();
  },200));
  document.getElementById('lenMax').addEventListener('input', debounce(function(e){
    state.lenMax = e.target.value===''?null:parseInt(e.target.value,10);
    state.page=1; applyAndRender();
  },200));

  document.getElementById('has3d').addEventListener('change', function(e){
    state.has3d = e.target.checked; state.page=1; applyAndRender();
  });
  document.getElementById('hasEc').addEventListener('change', function(e){
    state.hasEc = e.target.checked; state.page=1; applyAndRender();
  });
  document.getElementById('hasWho').addEventListener('change', function(e){
    state.hasWho = e.target.checked; state.page=1; applyAndRender();
  });
  document.getElementById('excludeFrag').addEventListener('change', function(e){
    state.excludeFrag = e.target.checked; state.page=1; applyAndRender();
  });
  document.getElementById('peSelect').addEventListener('change', function(e){
    state.pe = e.target.value; state.page=1; applyAndRender();
  });

  document.getElementById('familySelect').addEventListener('change', function(e){
    state.fam = e.target.value; state.page=1; applyAndRender();
  });

  document.getElementById('iprSelect').addEventListener('change', function(e){
    state.ipr = e.target.value; state.page=1; applyAndRender();
  });
  document.getElementById('mfSelect').addEventListener('change', function(e){
    state.mf = e.target.value; state.page=1; applyAndRender();
  });

  document.getElementById('classSelect').addEventListener('change', function(e){
    state.cls = e.target.value;
    state.fam = ''; // reset the finer family pick when the broad class changes
    buildFamilySelect(state.cls);
    state.page=1; applyAndRender();
  });

  document.getElementById('kwFilterInput').addEventListener('input', debounce(function(e){
    buildKwList(e.target.value);
  },120));

  document.getElementById('sortSelect').addEventListener('change', function(e){
    state.sort = e.target.value; state.page=1; applyAndRender();
  });

  document.getElementById('clearFilters').addEventListener('click', resetFilters);

  document.getElementById('exportCsv').addEventListener('click', function(){ exportCsv(); });
  document.getElementById('exportFasta').addEventListener('click', function(){ exportFasta(); });

  document.getElementById('whoExportCsv').addEventListener('click', function(){
    var header = ['Region','Subregion','Species','Toxin Records','Has Characterized Toxin'];
    var lines = [header.join(',')];
    WHO_SNAKES.forEach(function(r){
      r.subregions.forEach(function(sr){
        sr.species.forEach(function(sp){
          var n = WHO_COUNTS[sp.toLowerCase()]||0;
          lines.push([r.region, sr.name, sp, n, n>0?'yes':'no'].map(csvEscape).join(','));
        });
      });
    });
    triggerDownload('animal-toxin-atlas-who-coverage.csv', lines.join('\n'));
  });

  document.getElementById('dsExportCsv').addEventListener('click', function(){
    if(!DS_STATS || !DS_STATS.patterns.length){ toast('Nothing to export'); return; }
    var header = ['Pattern','Num Cysteines','Num Bonds','Entry Count','With PDB Structure','PDB %','Animal Groups','Example Accessions'];
    var lines = [header.join(',')];
    DS_STATS.patterns.forEach(function(g){
      var cats = {}; g.entries.forEach(function(e){ cats[e.cat]=(cats[e.cat]||0)+1; });
      var catList = Object.keys(cats).sort(function(a,b){ return cats[b]-cats[a]; });
      var withPdb = g.entries.filter(function(e){ return e.pdb && e.pdb.length; }).length;
      var row = [
        g.pattern, g.nCys, g.pairs.length, g.entries.length, withPdb,
        (withPdb/g.entries.length*100).toFixed(1),
        catList.join('; '),
        g.entries.slice(0,10).map(function(e){ return e.id; }).join('; ')
      ].map(csvEscape);
      lines.push(row.join(','));
    });
    triggerDownload('animal-toxin-atlas-disulfide-patterns.csv', lines.join('\n'));
  });

  document.getElementById('orgExportCsv').addEventListener('click', function(){
    var o = ORG_MAP[CURRENT_ORG];
    if(!o){ toast('Open an organism first'); return; }
    exportCsv(o.entries, (CURRENT_ORG.replace(/\s+/g,'_'))+'.csv');
  });
  document.getElementById('orgExportFasta').addEventListener('click', function(){
    var o = ORG_MAP[CURRENT_ORG];
    if(!o){ toast('Open an organism first'); return; }
    exportFasta(o.entries, (CURRENT_ORG.replace(/\s+/g,'_'))+'.fasta');
  });

  document.getElementById('runSearchBtn').addEventListener('click', runSimilaritySearch);
  document.getElementById('tryExampleBtn').addEventListener('click', tryExampleSequence);
  document.getElementById('clearSearchBtn').addEventListener('click', clearSimilaritySearch);

  document.getElementById('detailBackdrop').addEventListener('click', closeDetail);
  document.getElementById('compareGoBtn').addEventListener('click', openCompareOverlay);
  document.getElementById('compareClearBtn').addEventListener('click', function(){
    COMPARE_IDS = []; renderCompareTray(); syncCompareCheckboxes();
  });
  document.getElementById('compareBackdrop').addEventListener('click', closeCompareOverlay);
  document.getElementById('infoBackdrop').addEventListener('click', closeInfoOverlay);
  ['potSpecies','potRoute','potCtx'].forEach(function(id){
    document.getElementById(id).addEventListener('change', function(ev){
      if(id==='potSpecies') potSpecies = ev.target.value; else if(id==='potRoute') potRoute = ev.target.value; else potCtx = ev.target.value;
      potShown = 24; refreshPotency(); fillPotencyCatSelect(); renderPotencyLeaderboard();
    });
  });
  document.getElementById('potencyCatFilter').addEventListener('change', function(e){
    potCat = e.target.value || ''; potShown = 24; renderPotencyLeaderboard();
  });
  document.querySelectorAll('#potMetric button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#potMetric button').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      potMetric = b.getAttribute('data-m'); potCat = ''; potShown = 24;
      document.getElementById('potSpecies').style.display = document.getElementById('potRoute').style.display = (potMetric==='vivo') ? '' : 'none';
      document.getElementById('potCtx').style.display = (potMetric==='vitro') ? '' : 'none';
      fillPotencyCatSelect(); renderPotencyLeaderboard();
    });
  });
  document.getElementById('potMore').addEventListener('click', function(){ potShown += 24; renderPotencyLeaderboard(); });
  document.querySelectorAll('#gapFilter button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#gapFilter button').forEach(function(x){ x.classList.toggle('active', x===b); });
      gapFilter = b.getAttribute('data-f'); gapShown = 24; renderGapFinder();
    });
  });
  document.getElementById('gapSortSel').addEventListener('change', function(e){ gapSort = e.target.value; gapShown = 24; renderGapFinder(); });
  document.getElementById('gapSearch').addEventListener('input', debounce(function(e){ gapQuery = e.target.value.trim().toLowerCase(); gapShown = 24; renderGapFinder(); },120));
  document.querySelectorAll('#aaMode button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#aaMode button').forEach(function(x){ x.classList.toggle('active', x===b); });
      aaMode = b.getAttribute('data-m'); renderAaChart(scopedEntries());
    });
  });
  document.getElementById('gapMore').addEventListener('click', function(){ gapShown += 24; renderGapFinder(); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      closeDetail();
      closeMobileFilters();
      closeCompareOverlay();
      closeInfoOverlay();
    }
  });

  // mobile filters drawer
  document.getElementById('fbarToggle').addEventListener('click', function(){
    var more = document.getElementById('fbarMore'), open = more.hasAttribute('hidden');
    if(open) more.removeAttribute('hidden'); else more.setAttribute('hidden','');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // tabs
  document.querySelectorAll('.viewtabs button[data-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){
      switchToTab(btn.getAttribute('data-tab'));
    });
  });

  // insights sub-tabs
  document.querySelectorAll('[data-subtab]').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('[data-subtab]').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var sub = btn.getAttribute('data-subtab');
      document.getElementById('insight-potency').style.display = (sub==='potency') ? '' : 'none';
      document.getElementById('insight-gaps').style.display = (sub==='gaps') ? '' : 'none';
    });
  });

  // statistics sub-tabs
  document.querySelectorAll('[data-ssub]').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('[data-ssub]').forEach(function(b){ b.classList.toggle('active', b===btn); });
      var sub = btn.getAttribute('data-ssub');
      document.getElementById('stats-overview').style.display = (sub==='overview') ? '' : 'none';
      document.getElementById('stats-seq').style.display = (sub==='seq') ? '' : 'none';
    });
  });

  // disulfide sub-tabs
  document.querySelectorAll('[data-dsub]').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('[data-dsub]').forEach(function(b){ b.classList.toggle('active', b===btn); });
      var sub = btn.getAttribute('data-dsub');
      document.getElementById('ds-patterns').style.display = (sub==='patterns') ? '' : 'none';
      document.getElementById('ds-counts').style.display = (sub==='counts') ? '' : 'none';
    });
  });

  // toxin-relationships sub-tabs
  document.querySelectorAll('[data-rsub]').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('[data-rsub]').forEach(function(b){ b.classList.toggle('active', b===btn); });
      var sub = btn.getAttribute('data-rsub');
      document.getElementById('rel-embed').style.display = (sub==='embed') ? '' : 'none';
      document.getElementById('rel-targets').style.display = (sub==='targets') ? '' : 'none';
      if(sub==='embed') embOnShow();
    });
  });

  // organism tab
  document.getElementById('orgSearchInput').addEventListener('input', debounce(function(e){
    renderOrgDirectory(e.target.value);
  },120));
  document.getElementById('orgBackBtn').addEventListener('click', function(){
    CURRENT_ORG = null;
    document.getElementById('orgDetailWrap').style.display = 'none';
    document.getElementById('orgDirectory').style.display = '';
  });
  document.querySelectorAll('.org-comp-toggle button').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.org-comp-toggle button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      orgViewMode = btn.getAttribute('data-orgview');
      if(CURRENT_ORG) renderOrgComposition(ORG_MAP[CURRENT_ORG]);
    });
  });
}
