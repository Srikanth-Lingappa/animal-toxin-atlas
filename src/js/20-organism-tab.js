/* js/20-organism-tab.js
   Organism tab: directory of source species and per-organism composition.
   Defines: classColor, buildOrgIndex, renderOrgCatStrip, byCatCount, renderOrgDirectory, openOrganism, renderOrgComposition
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   20. ORGANISM TAB — per-organism composition + record browser
   ============================================================ */
var ORG_MAP = {};      // sci name -> {sci, cn, cat, who, entries:[]}
var ORG_LIST = [];     // sci keys, sorted by record count desc
var CURRENT_ORG = null;
var orgViewMode = 'chart';

var CLASS_PALETTE = [
  'var(--cat-snake)','var(--cat-spider)','var(--cat-scorpion)','var(--cat-cone)',
  'var(--cat-hymenoptera)','var(--cat-cnidarian)','var(--cat-centipede)','var(--cat-fish)',
  'var(--cat-tick)','var(--cat-frog)','var(--cat-lizard)','var(--cat-snail)',
  'var(--cat-mammal)','var(--cat-caterpillar)','var(--cat-bug)','var(--cat-parasitoid)'
];
function classColor(i){ return i===-1 ? 'var(--faint)' : CLASS_PALETTE[((i%CLASS_PALETTE.length)+CLASS_PALETTE.length)%CLASS_PALETTE.length]; }

function buildOrgIndex(){
  ORG_MAP = {};
  ENTRIES.forEach(function(e){
    if(!ORG_MAP[e.sci]) ORG_MAP[e.sci] = {sci:e.sci, cn:e.cn||'', cat:e.cat, who:e.who||null, entries:[]};
    var o = ORG_MAP[e.sci];
    o.entries.push(e);
    if(!o.cn && e.cn) o.cn = e.cn;
    if(!o.who && e.who) o.who = e.who;
  });
  ORG_LIST = Object.keys(ORG_MAP).sort(function(a,b){
    return ORG_MAP[b].entries.length - ORG_MAP[a].entries.length;
  });
}

var orgCatFilter = null; // selected category name, or null for "all"

function renderOrgCatStrip(){
  var cats = Object.keys(byCatCount()).sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); });
  var html = '<span class="chip'+(orgCatFilter===null?' active':'')+'" data-cat="" style="--dot:var(--faint)"><span class="dot"></span>Clear</span>';
  html += cats.map(function(cat){
    var active = (orgCatFilter===cat);
    return '<span class="chip'+(active?' active':'')+'" data-cat="'+esc(cat)+'" style="--dot:'+catColorVar(cat)+'">'+
      '<span class="dot"></span>'+esc(cat)+'<span class="n">'+(CAT_COUNT[cat]||0)+'</span></span>';
  }).join('');
  var strip = document.getElementById('orgCatStrip');
  strip.innerHTML = html;
  strip.querySelectorAll('.chip').forEach(function(el){
    el.addEventListener('click', function(){
      var cat = el.getAttribute('data-cat');
      orgCatFilter = cat || null;
      renderOrgCatStrip();
      renderOrgDirectory(document.getElementById('orgSearchInput').value);
    });
  });
}
function byCatCount(){
  var out = {};
  ORG_LIST.forEach(function(sci){ out[ORG_MAP[sci].cat] = true; });
  return out;
}

function renderOrgDirectory(filterText){
  var f = (filterText||'').trim().toLowerCase();
  var keys = ORG_LIST;
  if(f){
    keys = keys.filter(function(sci){
      var o = ORG_MAP[sci];
      return sci.toLowerCase().indexOf(f)!==-1 || (o.cn && o.cn.toLowerCase().indexOf(f)!==-1);
    });
  }
  if(orgCatFilter){
    keys = keys.filter(function(sci){ return ORG_MAP[sci].cat === orgCatFilter; });
  }
  var byCat = {};
  keys.forEach(function(sci){
    var cat = ORG_MAP[sci].cat;
    (byCat[cat] = byCat[cat] || []).push(sci);
  });
  var cats = Object.keys(byCat).sort(function(a,b){ return (CAT_COUNT[b]||0)-(CAT_COUNT[a]||0); });

  var html = cats.map(function(cat){
    var dot = catColorVar(cat);
    var rows = byCat[cat].map(function(sci){
      var o = ORG_MAP[sci];
      var whoTag = o.who ? ' <span class="who-badge" style="vertical-align:middle;"><span class="dot"></span>WHO</span>' : '';
      return '<div class="org-dir-row" data-sci="'+esc(sci)+'">'+
        '<div><div class="org-dir-sci">'+esc(sci)+whoTag+'</div>'+(o.cn?'<div class="org-dir-cn">'+esc(o.cn)+'</div>':'')+'</div>'+
        '<div class="org-dir-n">'+fmtN(o.entries.length)+' record'+(o.entries.length===1?'':'s')+'</div>'+
      '</div>';
    }).join('');
    return '<div class="org-cat-title" style="--dot:'+dot+'"><span class="dot"></span>'+esc(cat)+
      '<span class="n">'+byCat[cat].length+' organism'+(byCat[cat].length===1?'':'s')+'</span></div>'+rows;
  }).join('');

  document.getElementById('orgDirList').innerHTML = html || '<div class="empty-state"><div class="big">No matching organisms</div></div>';
  document.querySelectorAll('#orgDirList .org-dir-row').forEach(function(el){
    el.addEventListener('click', function(){
      openOrganism(el.getAttribute('data-sci'));
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
}

function openOrganism(sci){
  var o = ORG_MAP[sci];
  if(!o) return;
  CURRENT_ORG = sci;
  orgViewMode = 'chart';
  document.querySelectorAll('.org-comp-toggle button').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-orgview')==='chart');
  });
  document.getElementById('orgDirectory').style.display = 'none';
  document.getElementById('orgDetailWrap').style.display = '';

  var catChip = document.getElementById('orgCatChip');
  catChip.style.setProperty('--dot', catColorVar(o.cat));
  catChip.innerHTML = '<span class="dot"></span>'+esc(o.cat);
  document.getElementById('orgSciHeading').textContent = sci;
  document.getElementById('orgCnHeading').textContent = o.cn || '';

  var badges = '';
  if(o.who){
    badges = '<span class="who-badge"><span class="dot"></span>WHO medically important — '+
      esc(o.who.map(function(w){ return w.subregion; }).join(', '))+'</span>';
  }
  document.getElementById('orgBadgesRow').innerHTML = badges;

  var withPdb = o.entries.filter(function(e){ return e.pdb && e.pdb.length; }).length;
  var withIpr = o.entries.filter(function(e){ return e.ipr && e.ipr.length; }).length;
  var lens = o.entries.filter(function(e){ return e.len; }).map(function(e){ return e.len; });
  var avgLen = lens.length ? Math.round(lens.reduce(function(a,b){ return a+b; },0)/lens.length) : null;
  var stats = [
    ['Records', fmtN(o.entries.length)],
    ['With 3D structure', fmtN(withPdb)],
    ['With InterPro signature', fmtN(withIpr)],
    ['Avg. sequence length', avgLen ? avgLen+' aa' : '—']
  ];
  document.getElementById('orgStatLine').innerHTML = stats.map(function(s){
    return '<div class="s"><b>'+s[1]+'</b><span>'+s[0]+'</span></div>';
  }).join('');

  document.getElementById('orgCompSub').textContent =
    fmtN(o.entries.length)+' record'+(o.entries.length===1?'':'s')+' grouped by broad toxin class';
  renderOrgComposition(o);

  document.getElementById('orgRecordsList').innerHTML = o.entries
    .slice().sort(function(a,b){ return (a.pn||a.en||'').localeCompare(b.pn||b.en||''); })
    .map(renderRow).join('');
  wireRowClicks(document.getElementById('orgRecordsList'));
}

function renderOrgComposition(o){
  var cc = {};
  o.entries.forEach(function(e){
    var key = (e.cls!==null && e.cls!==undefined) ? e.cls : -1;
    cc[key] = (cc[key]||0)+1;
  });
  var keys = Object.keys(cc).map(Number).sort(function(a,b){ return cc[b]-cc[a]; });
  var total = o.entries.length;
  var segments = keys.map(function(k){
    return {
      key:k, name: k===-1 ? 'Unclassified' : DATA.classList[k],
      n: cc[k], pct: cc[k]/total*100, color: classColor(k)
    };
  });

  var acc = 0;
  var gradParts = segments.map(function(s){
    var start=acc; acc+=s.pct;
    return s.color+' '+start.toFixed(3)+'% '+acc.toFixed(3)+'%';
  });
  var pieStyle = segments.length<=1
    ? 'background:'+(segments[0]?segments[0].color:'var(--faint)')+';'
    : 'background:conic-gradient('+gradParts.join(', ')+');';
  var legend = segments.map(function(s){
    return '<div class="pie-legend-row"><span class="pie-legend-dot" style="background:'+s.color+'"></span>'+
      '<span class="pie-legend-name">'+esc(s.name)+'</span>'+
      '<span class="pie-legend-n">'+s.n+' ('+s.pct.toFixed(0)+'%)</span></div>';
  }).join('');
  document.getElementById('orgCompChart').innerHTML =
    '<div class="pie-chart" style="'+pieStyle+'"></div>'+
    '<div class="pie-legend">'+legend+'</div>';

  var maxN = segments.length ? segments[0].n : 1;
  document.getElementById('orgCompList').innerHTML = segments.map(function(s){
    return '<div class="barrow"><div class="lbl">'+esc(s.name)+'</div>'+
      '<div class="track"><div class="fill" style="width:'+(s.n/maxN*100)+'%;background:'+s.color+'"></div></div>'+
      '<div class="val">'+s.n+' ('+s.pct.toFixed(0)+'%)</div></div>';
  }).join('');

  document.getElementById('orgCompChart').style.display = (orgViewMode==='chart') ? '' : 'none';
  document.getElementById('orgCompList').style.display = (orgViewMode==='list') ? '' : 'none';
}
