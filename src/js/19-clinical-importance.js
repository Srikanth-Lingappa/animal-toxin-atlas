/* js/19-clinical-importance.js
   Clinical Importance tab: WHO coverage by subregion and the map.
   Defines: buildWhoCoverage, renderWhoInsight, renderWhoMap
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   19. CLINICAL IMPORTANCE (WHO) — coverage view
   Cross-references WHO's medically important snake list against
   the dataset: which of those species already have characterized
   toxin records here, and which have none at all.
   ============================================================ */
var WHO_COUNTS = {};
var WHO_ORGSCI = {}; // species lookup key -> a matching entry's canonical e.sci
function buildWhoCoverage(){
  WHO_COUNTS = {};
  WHO_ORGSCI = {};
  ENTRIES.forEach(function(e){
    if(!e.who) return;
    var orgName = (e.org||'').split(' (')[0].trim().toLowerCase();
    var twoWord = orgName.split(/\s+/).slice(0,2).join(' ');
    var key = WHO_SPECIES_MAP[orgName] ? orgName : twoWord;
    WHO_COUNTS[key] = (WHO_COUNTS[key]||0)+1;
    if(!WHO_ORGSCI[key]) WHO_ORGSCI[key] = e.sci;
  });
}

function renderWhoInsight(){
  var totalSpecies = WHO_SPECIES_LIST.length;
  var withHits = WHO_SPECIES_LIST.filter(function(sp){ return (WHO_COUNTS[sp.toLowerCase()]||0) > 0; }).length;
  var subregionCount = WHO_SNAKES.reduce(function(n,r){ return n + r.subregions.length; }, 0);
  var recs = ENTRIES.filter(function(e){ return e.who; }).length;
  document.getElementById('whoCount').textContent = 'Click a species chip to open its organism page, or a map marker to jump to its area.';
  document.getElementById('whoKpis').innerHTML = [
    ['WHO-listed species', fmtN(totalSpecies), ''],
    ['With \u22651 toxin record', fmtN(withHits)+' ('+Math.round(withHits/totalSpecies*100)+'%)', ''],
    ['No record yet', fmtN(totalSpecies-withHits), 'warn'],
    ['Toxin records from these species', fmtN(recs), ''],
    ['Geographic areas', fmtN(subregionCount), '']
  ].map(function(k){ return '<div class="kpi '+k[2]+'"><b>'+k[1]+'</b><span>'+k[0]+'</span></div>'; }).join('');

  var html = '';
  WHO_SNAKES.forEach(function(r){
    r.subregions.forEach(function(sr){
      var total = sr.species.length;
      var cov = sr.species.filter(function(sp){ return (WHO_COUNTS[sp.toLowerCase()]||0) > 0; }).length;
      var chips = sr.species.slice().sort(function(a,b){ return a.localeCompare(b); }).map(function(sp){
        var n = WHO_COUNTS[sp.toLowerCase()]||0;
        return n ? '<span class="sp-chip" data-sp="'+esc(sp)+'" title="'+n+' record'+(n===1?'':'s')+'">'+esc(sp)+'<small>'+n+'</small></span>'
                 : '<span class="sp-chip none" title="no characterized toxin records yet">'+esc(sp)+'</span>';
      }).join('');
      html += '<div class="who-card" data-subregion="'+esc(sr.name)+'">'+
        '<h4>'+esc(sr.name)+'<span>'+cov+' / '+total+'</span></h4>'+
        '<div class="bar"><i style="width:'+(total?cov/total*100:0)+'%"></i></div>'+
        '<div class="sp-chips">'+chips+'</div></div>';
    });
  });
  document.getElementById('whoTable').innerHTML = html;
  document.querySelectorAll('#whoTable .sp-chip[data-sp]').forEach(function(el){
    el.addEventListener('click', function(){
      var key = el.getAttribute('data-sp').toLowerCase();
      if(!WHO_COUNTS[key]) return;
      switchToTab('organism');
      openOrganism(WHO_ORGSCI[key]);
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
  renderWhoMap();
}

// approximate representative point for each WHO subregion, in the base map's
// own coordinate space (viewBox "30.767 241.591 784.077 458.627") — picked
// from real country centroids, not exact borders (see caption in the UI)
var WHO_SUBREGION_XY = {
  'North Africa & Middle East': [465, 445],
  'Central sub-Saharan Africa': [445, 512],
  'Eastern sub-Saharan Africa': [500, 535],
  'Southern sub-Saharan Africa': [475, 585],
  'Western sub-Saharan Africa': [400, 500],
  'Central Asia': [555, 410],
  'East Asia': [660, 410],
  'South Asia': [605, 465],
  'South-East Asia': [670, 500],
  'Australo-Papua': [740, 590],
  'Central Europe': [440, 400],
  'Eastern Europe': [475, 395],
  'Western Europe': [406, 404],
  'North America': [170, 355],
  'Caribbean': [225, 478],
  'Central America': [203, 498],
  'South America': [255, 545]
};

function renderWhoMap(){
  var g = document.getElementById('whoMapMarkers');
  if(!g) return;
  var markers = [];
  WHO_SNAKES.forEach(function(r){
    r.subregions.forEach(function(sr){
      var xy = WHO_SUBREGION_XY[sr.name];
      if(!xy) return;
      var total = sr.species.length;
      var covered = sr.species.filter(function(sp){ return (WHO_COUNTS[sp.toLowerCase()]||0) > 0; }).length;
      var ratio = total ? covered/total : 0;
      var radius = Math.max(7, Math.min(24, Math.sqrt(total) * 5.2));
      var color = covered===0 ? null : (ratio >= 0.66 ? 'var(--teal)' : ratio >= 0.34 ? 'var(--amber)' : 'var(--coral)');
      markers.push({name:sr.name, x:xy[0], y:xy[1], r:radius, color:color, total:total, covered:covered});
    });
  });
  g.innerHTML = markers.map(function(m){
    var hollow = m.color===null;
    return '<g class="who-marker'+(hollow?' hollow':'')+'" data-subregion="'+esc(m.name)+'">'+
      '<title>'+esc(m.name)+' \u2014 '+m.covered+' of '+m.total+' WHO species characterized</title>'+
      '<circle cx="'+m.x+'" cy="'+m.y+'" r="'+m.r.toFixed(1)+'"'+(hollow?'':' style="fill:'+m.color+'"')+'/>'+
    '</g>';
  }).join('');

  g.querySelectorAll('.who-marker').forEach(function(el){
    el.addEventListener('click', function(){
      var name = el.getAttribute('data-subregion');
      var target = document.querySelector('.who-card[data-subregion="'+CSS.escape(name)+'"]');
      if(!target) return;
      target.scrollIntoView({behavior:'smooth', block:'center'});
      target.classList.remove('flash');
      void target.offsetWidth; // restart animation if clicked twice
      target.classList.add('flash');
    });
  });
}
