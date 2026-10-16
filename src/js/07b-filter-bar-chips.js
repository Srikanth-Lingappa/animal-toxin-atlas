/* js/07b-filter-bar-chips.js
   Filter bar: reset, active-filter chips and the "More filters" toggle.
   Defines: resetFilters, selText, activeFilterList, clearOneFilter, renderActiveChips, applyAndRender
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- filter bar: reset, active-filter chips ---------- */
function resetFilters(){
  state = {q:'',cats:new Set(),kws:new Set(),fam:'',cls:'',ipr:'',mf:'',lenMin:null,lenMax:null,has3d:false,hasEc:false,hasWho:false,excludeFrag:false,pe:'',sort:state.sort,page:1};
  ['searchInput','lenMin','lenMax','kwFilterInput'].forEach(function(id){ document.getElementById(id).value=''; });
  ['has3d','hasEc','hasWho','excludeFrag'].forEach(function(id){ document.getElementById(id).checked=false; });
  ['peSelect','classSelect','iprSelect','mfSelect'].forEach(function(id){ document.getElementById(id).value=''; });
  buildFamilySelect('');
  buildKwList('');
  document.querySelectorAll('#catStrip .chip.active').forEach(function(el){ el.classList.remove('active'); });
  applyAndRender();
}
function selText(id){ var el = document.getElementById(id); var o = el.options[el.selectedIndex]; return o ? o.textContent.replace(/\s*\(\d[\d,]*\)\s*$/,'').trim() : ''; }
function activeFilterList(){
  var L = [];
  if(state.q.trim()) L.push({k:'q', t:'Search: \u201c'+state.q.trim()+'\u201d', more:false});
  if(state.lenMin!==null || state.lenMax!==null) L.push({k:'len', t:'Length '+(state.lenMin!==null?state.lenMin:'0')+'\u2013'+(state.lenMax!==null?state.lenMax:'\u221e')+' aa', more:false});
  [['has3d','3D structure'],['hasEc','Enzyme (EC)'],['hasWho','WHO species'],['excludeFrag','No fragments']].forEach(function(f){ if(state[f[0]]) L.push({k:f[0], t:f[1], more:false}); });
  if(state.pe) L.push({k:'pe', t:'Evidence: '+selText('peSelect'), more:true});
  if(state.cls) L.push({k:'cls', t:'Class: '+selText('classSelect'), more:true});
  if(state.fam) L.push({k:'fam', t:'Family: '+selText('familySelect'), more:true});
  if(state.ipr) L.push({k:'ipr', t:'InterPro: '+selText('iprSelect'), more:true});
  if(state.mf) L.push({k:'mf', t:'Mechanism: '+selText('mfSelect'), more:true});
  state.kws.forEach(function(i){ L.push({k:'kw:'+i, t:'Keyword: '+DATA.kwList[i], more:true}); });
  return L;
}
function clearOneFilter(k){
  if(k==='q'){ state.q=''; document.getElementById('searchInput').value=''; }
  else if(k==='len'){ state.lenMin=state.lenMax=null; document.getElementById('lenMin').value=document.getElementById('lenMax').value=''; }
  else if(k==='pe'){ state.pe=''; document.getElementById('peSelect').value=''; }
  else if(k==='cls'){ state.cls=''; state.fam=''; document.getElementById('classSelect').value=''; buildFamilySelect(''); }
  else if(k==='fam'){ state.fam=''; document.getElementById('familySelect').value=''; }
  else if(k==='ipr'){ state.ipr=''; document.getElementById('iprSelect').value=''; }
  else if(k==='mf'){ state.mf=''; document.getElementById('mfSelect').value=''; }
  else if(k.indexOf('kw:')===0){ state.kws.delete(parseInt(k.slice(3),10)); buildKwList(document.getElementById('kwFilterInput').value); }
  else { state[k]=false; document.getElementById(k).checked=false; }
  state.page = 1; applyAndRender();
}
function renderActiveChips(){
  var L = activeFilterList();
  var host = document.getElementById('activeChips');
  host.innerHTML = L.map(function(f){ return '<span class="achip"><span title="'+esc(f.t)+'">'+esc(f.t)+'</span><button data-clr="'+esc(f.k)+'" aria-label="Remove filter">\u2715</button></span>'; }).join('');
  host.querySelectorAll('[data-clr]').forEach(function(b){ b.addEventListener('click', function(){ clearOneFilter(b.getAttribute('data-clr')); }); });
  var hidden = L.filter(function(f){ return f.more; }).length;
  var badge = document.getElementById('fbarBadge');
  badge.textContent = hidden; if(hidden) badge.removeAttribute('hidden'); else badge.setAttribute('hidden','');
  var any = L.length>0 || state.cats.size>0;
  var cb = document.getElementById('clearFilters');
  if(any) cb.removeAttribute('hidden'); else cb.setAttribute('hidden','');
}

function applyAndRender(){
  filteredCache = computeFiltered();
  renderResults();
  renderActiveChips();
}
