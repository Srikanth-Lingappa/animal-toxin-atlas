/* js/06-family-and-keyword-select.js
   Browse filter controls: toxin class, protein family, InterPro, mechanism and keyword lists.
   Defines: buildClassSelect, buildFamilySelect, buildIprSelect, parseMfTerms, buildMfIndex, buildMfSelect, buildKwList
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   6. FAMILY SELECT + KEYWORD LIST
   ============================================================ */
function buildClassSelect(){
  var idxs = DATA.classList.map(function(_,i){ return i; })
    .filter(function(i){ return CLASS_COUNT[i] > 0; })
    .sort(function(a,b){ return CLASS_COUNT[b]-CLASS_COUNT[a]; });
  var opts = idxs.map(function(i){
    return '<option value="'+i+'">'+esc(DATA.classList[i])+' ('+CLASS_COUNT[i]+')</option>';
  }).join('');
  var sel = document.getElementById('classSelect');
  sel.innerHTML = '<option value="">All classes</option>'+opts;
}

function buildFamilySelect(classFilter){
  var idxs = DATA.famList.map(function(_,i){ return i; })
    .filter(function(i){
      if(FAM_COUNT[i] <= 0) return false;
      if(classFilter !== undefined && classFilter !== '' && classFilter !== null){
        return String(FAM_TO_CLASS[i]) === String(classFilter);
      }
      return true;
    })
    .sort(function(a,b){ return DATA.famList[a].localeCompare(DATA.famList[b]); });
  var opts = idxs.map(function(i){
    return '<option value="'+i+'">'+esc(DATA.famList[i])+' ('+FAM_COUNT[i]+')</option>';
  }).join('');
  var sel = document.getElementById('familySelect');
  sel.innerHTML = '<option value="">'+(classFilter ? 'All families in this class' : 'All families')+'</option>'+opts;
  // keep current selection if it's still valid, else reset
  if(state.fam !== '' && idxs.indexOf(parseInt(state.fam,10)) === -1){
    state.fam = '';
  }
  sel.value = state.fam;
}

function buildIprSelect(){
  var idxs = DATA.iprList.map(function(_,i){ return i; })
    .filter(function(i){ return IPR_COUNT[i] > 0; })
    .sort(function(a,b){ return IPR_COUNT[b]-IPR_COUNT[a]; });
  var opts = idxs.map(function(i){
    return '<option value="'+i+'">'+esc(DATA.iprList[i])+' ('+IPR_COUNT[i]+')</option>';
  }).join('');
  var sel = document.getElementById('iprSelect');
  sel.innerHTML = '<option value="">All InterPro entries</option>'+opts;
}

// Mechanism of action (GO molecular function) — parsed client-side from the "mf" text
// UniProt already gave us, e.g. "sodium channel inhibitor activity [GO:0019871]"
function parseMfTerms(mfRaw){
  if(!mfRaw) return [];
  return mfRaw.split(';').map(function(s){
    var m = s.trim().match(/^(.*)\s\[GO:(\d+)\]$/);
    return m ? {term:m[1].trim(), go:m[2]} : null;
  }).filter(Boolean);
}
function buildMfIndex(){
  var termToIdx = {};
  MF_LIST = [];
  ENTRIES.forEach(function(e){
    var parsed = parseMfTerms(e.mf);
    e.mfi = parsed.map(function(p){
      if(!(p.term in termToIdx)){
        termToIdx[p.term] = MF_LIST.length;
        MF_LIST.push({term:p.term, go:p.go});
      }
      return termToIdx[p.term];
    });
  });
  MF_COUNT = new Array(MF_LIST.length).fill(0);
  ENTRIES.forEach(function(e){ e.mfi.forEach(function(i){ MF_COUNT[i]++; }); });
}
function buildMfSelect(){
  var idxs = MF_LIST.map(function(_,i){ return i; })
    .filter(function(i){ return MF_COUNT[i] > 0; })
    .sort(function(a,b){ return MF_COUNT[b]-MF_COUNT[a]; });
  var opts = idxs.map(function(i){
    return '<option value="'+i+'">'+esc(MF_LIST[i].term)+' ('+MF_COUNT[i]+')</option>';
  }).join('');
  var sel = document.getElementById('mfSelect');
  sel.innerHTML = '<option value="">All mechanisms</option>'+opts;
}

function buildKwList(filterText){
  var idxs = DATA.kwList.map(function(_,i){ return i; })
    .filter(function(i){ return KW_COUNT[i] > 0; });
  if(filterText){
    var f = filterText.toLowerCase();
    idxs = idxs.filter(function(i){ return DATA.kwList[i].toLowerCase().indexOf(f) !== -1; });
  }
  idxs.sort(function(a,b){ return KW_COUNT[b]-KW_COUNT[a]; });
  var html = idxs.map(function(i){
    var checked = state.kws.has(i) ? 'checked' : '';
    return '<div class="kwrow"><label><input type="checkbox" data-kw="'+i+'" '+checked+'>'+
      '<span>'+esc(DATA.kwList[i])+'</span></label><span class="kn">'+KW_COUNT[i]+'</span></div>';
  }).join('') || '<div style="font-size:11.5px;color:var(--faint);padding:6px 2px;">no matches</div>';
  document.getElementById('kwList').innerHTML = html;
  document.querySelectorAll('#kwList input[type=checkbox]').forEach(function(cb){
    cb.addEventListener('change', function(){
      var i = parseInt(cb.getAttribute('data-kw'),10);
      if(cb.checked) state.kws.add(i); else state.kws.delete(i);
      state.page = 1;
      applyAndRender();
    });
  });
}
