/* js/08-results-list.js
   Renders the results list and its pagination.
   Defines: renderResults, wireRowClicks, renderRow, renderPagination
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   8. RENDER RESULTS LIST
   ============================================================ */
function renderResults(){
  var list = filteredCache;
  var total = list.length;
  document.getElementById('resCount').textContent = fmtN(total);
  document.getElementById('resCountLabel').textContent = total === 1 ? 'record' : 'records';

  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if(state.page > totalPages) state.page = totalPages;
  if(state.page < 1) state.page = 1;

  var start = (state.page-1)*PAGE_SIZE;
  var pageItems = list.slice(start, start+PAGE_SIZE);

  var rowsEl = document.getElementById('rowList');
  if(!pageItems.length){
    rowsEl.innerHTML = '<div class="empty-state"><div class="big">No matching records</div>'+
      'Try widening your filters or clearing the search term.</div>';
  } else {
    rowsEl.innerHTML = pageItems.map(renderRow).join('');
    wireRowClicks(rowsEl);
  }
  renderPagination(totalPages);
}

function wireRowClicks(container){
  container.querySelectorAll('.entry-row').forEach(function(el){
    el.addEventListener('click', function(ev){
      if(ev.target.classList.contains('cmpchk')) return;
      openDetail(el.getAttribute('data-id'));
    });
    var chk = el.querySelector('.cmpchk');
    if(chk) chk.addEventListener('change', function(){
      if(chk.checked) addToCompare(el.getAttribute('data-id'));
      else removeFromCompare(el.getAttribute('data-id'));
    });
  });
}

function renderRow(e){
  var dot = catColorVar(e.cat);
  var pdbBadge = (e.pdb && e.pdb.length) ? '<div class="entry-pdb">'+e.pdb.length+' PDB</div>' : '<div></div>';
  var whoBadge = e.who ? '<span class="who-badge" title="WHO medically important species — '+esc(e.who.map(function(w){return w.subregion;}).join('; '))+'"><span class="dot"></span>WHO</span>' : '';
  var fragBadge = e.frag ? '<span class="frag-badge" title="Incomplete (fragment) sequence">Fragment</span>' : '';
  var gene = e.gn ? '<span class="gene">'+esc(e.gn.split(/\s+/)[0])+'</span>' : '';
  var pname = e.pn ? e.pn.split(' (')[0] : e.en;
  var inCmp = COMPARE_IDS.indexOf(e.id)!==-1;
  return '<div class="entry-row'+(inCmp?' in-compare':'')+'" data-id="'+esc(e.id)+'" style="--dot:'+dot+'">'+
    '<input type="checkbox" class="cmpchk" title="add to compare" '+(inCmp?'checked':'')+'>'+
    '<span class="catdot"></span>'+
    '<div class="entry-main">'+
      '<div class="pname">'+esc(pname)+'</div>'+
      '<div class="meta"><span class="org">'+esc(e.org.split(' (')[0])+'</span>'+
      '<span class="acc">'+esc(e.id)+'</span>'+gene+whoBadge+fragBadge+'</div>'+
    '</div>'+
    '<div class="entry-side"><span class="len">'+(e.len||'—')+' aa</span></div>'+
    pdbBadge+
  '</div>';
}

function renderPagination(totalPages){
  var el = document.getElementById('pagination');
  if(totalPages <= 1){ el.innerHTML=''; return; }
  var p = state.page;
  var pages = [];
  var addPage = function(n){ pages.push(n); };
  addPage(1);
  for(var i=p-2;i<=p+2;i++){ if(i>1 && i<totalPages) addPage(i); }
  addPage(totalPages);
  pages = Array.from(new Set(pages)).sort(function(a,b){return a-b;});

  var html = '<button data-pg="prev" '+(p<=1?'disabled':'')+'>‹ prev</button>';
  var last = 0;
  pages.forEach(function(n){
    if(last && n-last>1) html += '<span class="pgap">…</span>';
    html += '<button data-pg="'+n+'" class="'+(n===p?'cur':'')+'">'+n+'</button>';
    last = n;
  });
  html += '<button data-pg="next" '+(p>=totalPages?'disabled':'')+'>next ›</button>';
  el.innerHTML = html;
  el.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-pg');
      if(v==='prev') state.page = Math.max(1,state.page-1);
      else if(v==='next') state.page = state.page+1;
      else state.page = parseInt(v,10);
      renderResults();
      document.querySelector('.resultsCol').scrollIntoView({block:'start', behavior:'smooth'});
    });
  });
}
