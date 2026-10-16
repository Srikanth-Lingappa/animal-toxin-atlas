/* js/05-category-strip.js
   The animal-group strip and the record count line at the top of Browse.
   Defines: buildCatStrip, buildStatLine
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   5. CATEGORY STRIP + STAT LINE
   ============================================================ */
function buildCatStrip(){
  var cats = DATA.catList.slice().sort(function(a,b){
    return (CAT_COUNT[b]||0) - (CAT_COUNT[a]||0);
  });
  var html = cats.map(function(c){
    var n = CAT_COUNT[c]||0;
    var dot = catColorVar(c);
    return '<div class="chip" data-cat="'+esc(c)+'" style="--dot:'+dot+'">'+
      '<span class="dot"></span>'+esc(c)+'<span class="n">'+fmtN(n)+'</span></div>';
  }).join('');
  document.getElementById('catStrip').innerHTML = html;
  document.querySelectorAll('#catStrip .chip').forEach(function(el){
    el.addEventListener('click', function(){
      var c = el.getAttribute('data-cat');
      if(state.cats.has(c)) state.cats.delete(c); else state.cats.add(c);
      el.classList.toggle('active');
      state.page = 1;
      applyAndRender();
    });
  });
}

function buildStatLine(){
  var withPdb = ENTRIES.filter(function(e){ return e.pdb && e.pdb.length; }).length;
  var withIpr = ENTRIES.filter(function(e){ return e.ipr && e.ipr.length; }).length;
  var orgs = new Set(ENTRIES.map(function(e){ return e.org; })).size;
  var fams = DATA.famList.length;
  var stats = [
    ['Records', fmtN(ENTRIES.length)],
    ['Source organisms', fmtN(orgs)],
    ['Protein families', fmtN(fams)],
    ['With 3D structure', fmtN(withPdb)],
    ['With InterPro signature', fmtN(withIpr)]
  ];
  document.getElementById('statLine').innerHTML = stats.map(function(s){
    return '<div class="s"><b>'+s[1]+'</b><span>'+s[0]+'</span></div>';
  }).join('');
}
