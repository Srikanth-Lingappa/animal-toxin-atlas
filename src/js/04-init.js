/* js/04-init.js
   init(): builds the lookup tables, derives per-record values and starts every tab.
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   4. INIT
   ============================================================ */
async function init(){
  try{
    DATA = await loadData();
  }catch(err){
    document.getElementById('rowList').innerHTML =
      '<div class="empty-state"><div class="big">This browser can\'t unpack the dataset.</div>'+
      'Please open Animal Toxin Atlas in an up-to-date Chrome, Edge, Firefox or Safari.</div>';
    document.getElementById('headCount').textContent = 'load failed';
    console.error(err);
    return;
  }

  ENTRIES = DATA.entries;
  buildMfIndex();
  ENTRIES.forEach(function(e){
    var kwNames = e.kw.map(function(i){ return DATA.kwList[i]; }).join(' ');
    var famName = (e.fam !== null && e.fam !== undefined) ? DATA.famList[e.fam] : '';
    var clsName = (e.cls !== null && e.cls !== undefined) ? DATA.classList[e.cls] : '';
    var iprNames = (e.ipr||[]).map(function(i){ return DATA.iprList[i]; }).join(' ');
    var mfNames = (e.mfi||[]).map(function(i){ return MF_LIST[i].term; }).join(' ');
    e._s = (
      (e.en||'')+' '+(e.pn||'')+' '+(e.gn||'')+' '+(e.org||'')+' '+(e.id||'')+' '+
      (e.fn||'')+' '+(e.ts||'')+' '+kwNames+' '+famName+' '+clsName+' '+(e.ec||'')+' '+iprNames+' '+mfNames
    ).toLowerCase();
    e._fam_name = famName;
    e._cls_name = clsName;
  });

  // counts
  ENTRIES.forEach(function(e){
    CAT_COUNT[e.cat] = (CAT_COUNT[e.cat]||0)+1;
  });
  KW_COUNT = new Array(DATA.kwList.length).fill(0);
  ENTRIES.forEach(function(e){ e.kw.forEach(function(i){ KW_COUNT[i]++; }); });
  FAM_COUNT = new Array(DATA.famList.length).fill(0);
  ENTRIES.forEach(function(e){ if(e.fam !== null && e.fam !== undefined) FAM_COUNT[e.fam]++; });
  CLASS_COUNT = new Array(DATA.classList.length).fill(0);
  ENTRIES.forEach(function(e){ if(e.cls !== null && e.cls !== undefined) CLASS_COUNT[e.cls]++; });
  IPR_COUNT = new Array(DATA.iprList.length).fill(0);
  ENTRIES.forEach(function(e){ (e.ipr||[]).forEach(function(i){ IPR_COUNT[i]++; }); });
  FAM_TO_CLASS = new Array(DATA.famList.length).fill(null);
  ENTRIES.forEach(function(e){
    if(e.fam !== null && e.fam !== undefined && e.cls !== null && e.cls !== undefined){
      FAM_TO_CLASS[e.fam] = e.cls;
    }
  });

  document.getElementById('headCount').textContent = fmtN(ENTRIES.length)+' records';
  document.getElementById('aboutTotal').textContent = fmtN(ENTRIES.length);
  renderReferences();

  buildWhoMap();
  tagWhoEntries();
  buildOrgIndex();

  buildCatStrip();
  buildStatLine();
  buildClassSelect();
  buildFamilySelect('');
  buildIprSelect();
  buildMfSelect();
  buildPeSelect();
  buildKwList('');
  buildStatsTab();
  buildConvergenceStats();
  renderConvergenceTable();
  renderConvergenceScatter();
  buildPotencyList();
  renderPotencyLeaderboard();
  buildGapList();
  renderGapFinder();
  buildWhoCoverage();
  renderWhoInsight();
  renderOrgDirectory('');
  renderDisulfidesTab();
  renderTaxonTab();
  renderEmbeddingTab();
  renderOrgCatStrip();
  bindEvents();
  applyAndRender();
}
