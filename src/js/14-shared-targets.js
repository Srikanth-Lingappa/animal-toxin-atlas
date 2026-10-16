/* js/14-shared-targets.js
   Toxin Relationships > shared targets: the keyword-based view (named "convergence" in the code).
   Defines: buildConvergenceStats, renderConvergenceTable, renderConvergenceScatter, xPos, yPos, rPos, selectConvergence, renderConvergenceDetail
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   14. CONVERGENCE EXPLORER
   ============================================================ */
var TARGET_KEYWORDS = [
 'Voltage-gated sodium channel impairing toxin','Proton-gated sodium channel impairing toxin',
 'Voltage-gated potassium channel impairing toxin','Calcium-activated potassium channel impairing toxin',
 'Voltage-gated calcium channel impairing toxin','Ryanodine-sensitive calcium-release channel impairing toxin',
 'Voltage-gated chloride channel impairing toxin','Acetylcholine receptor inhibiting toxin',
 'G protein-coupled acetylcholine receptor impairing toxin','G protein-coupled receptor impairing toxin',
 'Bradykinin receptor impairing toxin','Ionotropic glutamate receptor inhibitor',
 'Complement system impairing toxin','Phospholipase A2 inhibitor','Metalloprotease inhibitor',
 'Serine protease inhibitor','Platelet aggregation inhibiting toxin','Platelet aggregation activating toxin',
 'Blood coagulation cascade activating toxin','Blood coagulation cascade inhibiting toxin',
 'Cell adhesion impairing toxin','Cytolysis','Dermonecrotic toxin','Myotoxin','Cardiotoxin',
 'Hemorrhagic toxin','Fibrinogenolytic toxin','Fibrinolytic toxin','Presynaptic neurotoxin','Postsynaptic neurotoxin'
];
var CONV_STATS = []; // {kwIdx, name, hits:[entries], cats:Set, classes:Set}
var convActiveIdx = null;

function buildConvergenceStats(){
  var kwIdx = {}; DATA.kwList.forEach(function(k,i){ kwIdx[k]=i; });
  CONV_STATS = TARGET_KEYWORDS.map(function(name){
    var ki = kwIdx[name];
    if(ki===undefined) return null;
    var hits = ENTRIES.filter(function(e){ return e.kw.indexOf(ki)!==-1; });
    var cats = new Set(hits.map(function(e){ return e.cat; }));
    var classes = new Set(hits.filter(function(e){ return e.cls!==null&&e.cls!==undefined; }).map(function(e){ return e.cls; }));
    return {name:name, kwIdx:ki, hits:hits, cats:cats, classes:classes};
  }).filter(Boolean).filter(function(s){ return s.hits.length>0; });
  CONV_STATS.sort(function(a,b){ return (b.classes.size-a.classes.size) || (b.cats.size-a.cats.size); });
}

function renderConvergenceTable(){
  var maxClasses = Math.max.apply(null, CONV_STATS.map(function(s){ return s.classes.size; }));
  document.getElementById('convTable').innerHTML = CONV_STATS.map(function(s,i){
    return '<div class="conv-row'+(convActiveIdx===i?' active':'')+'" data-convidx="'+i+'">'+
      '<div class="cname">'+esc(s.name)+'</div>'+
      '<div class="cval">'+fmtN(s.hits.length)+'</div>'+
      '<div class="cval">'+s.cats.size+'</div>'+
      '<div class="cval'+(s.classes.size>=6?' hi':'')+'">'+s.classes.size+'</div>'+
    '</div>';
  }).join('');
  document.querySelectorAll('#convTable .conv-row').forEach(function(el){
    el.addEventListener('click', function(){
      var i = parseInt(el.getAttribute('data-convidx'),10);
      selectConvergence((convActiveIdx===i) ? null : i);
    });
  });
}

function renderConvergenceScatter(){
  var maxLineages = Math.max.apply(null, CONV_STATS.map(function(s){ return s.cats.size; }));
  var maxClasses = Math.max.apply(null, CONV_STATS.map(function(s){ return s.classes.size; }));
  var maxCount = Math.max.apply(null, CONV_STATS.map(function(s){ return s.hits.length; }));
  var W=700, H=400, mL=48, mR=26, mT=26, mB=54;
  var pw=W-mL-mR, ph=H-mT-mB;
  function xPos(v){ return mL + (maxLineages>1 ? (v-1)/(maxLineages-1) : 0.5) * pw; }
  function yPos(v){ return mT + ph - (maxClasses>1 ? (v-1)/(maxClasses-1) : 0.5) * ph; }
  function rPos(c){ var rMin=4,rMax=20; var t = maxCount ? Math.sqrt(c)/Math.sqrt(maxCount) : 0; return rMin+t*(rMax-rMin); }

  var yStep = maxClasses>18 ? 4 : (maxClasses>8 ? 2 : 1);
  var yticks=[]; for(var v=1; v<=maxClasses; v+=yStep) yticks.push(v);
  if(yticks[yticks.length-1]!==maxClasses) yticks.push(maxClasses);
  var xticks=[]; for(var v=1; v<=maxLineages; v++) xticks.push(v);

  var svg = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;">';
  yticks.forEach(function(v){
    var y=yPos(v);
    svg += '<line x1="'+mL+'" x2="'+(W-mR)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)" stroke-width="1"/>';
    svg += '<text x="'+(mL-8)+'" y="'+(y+3)+'" text-anchor="end" font-size="9.5" fill="var(--muted)" font-family="Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">'+v+'</text>';
  });
  xticks.forEach(function(v){
    var x=xPos(v);
    svg += '<text x="'+x+'" y="'+(H-mB+16)+'" text-anchor="middle" font-size="9.5" fill="var(--muted)" font-family="Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">'+v+'</text>';
  });
  svg += '<line x1="'+mL+'" x2="'+mL+'" y1="'+mT+'" y2="'+(H-mB)+'" stroke="var(--line-strong)"/>';
  svg += '<line x1="'+mL+'" x2="'+(W-mR)+'" y1="'+(H-mB)+'" y2="'+(H-mB)+'" stroke="var(--line-strong)"/>';
  svg += '<text x="'+(mL+pw/2)+'" y="'+(H-6)+'" text-anchor="middle" font-size="10.5" fill="var(--muted)" font-family="Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">taxonomic lineages hit \u2192</text>';
  svg += '<text x="12" y="'+(mT+ph/2)+'" text-anchor="middle" font-size="10.5" fill="var(--muted)" font-family="Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif" transform="rotate(-90 12 '+(mT+ph/2)+')">independent toxin classes \u2192</text>';

  var order = CONV_STATS.map(function(_,i){ return i; }).sort(function(a,b){ return CONV_STATS[b].hits.length-CONV_STATS[a].hits.length; });
  order.forEach(function(i){
    var s = CONV_STATS[i];
    var tally={}; s.hits.forEach(function(e){ tally[e.cat]=(tally[e.cat]||0)+1; });
    var domCat = Object.keys(tally).sort(function(a,b){ return tally[b]-tally[a]; })[0];
    var cx=xPos(s.cats.size), cy=yPos(s.classes.size), r=rPos(s.hits.length);
    var isActive = (convActiveIdx===i);
    svg += '<circle data-convidx="'+i+'" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+r.toFixed(1)+'" fill="'+catColorVar(domCat)+'" '+
      'fill-opacity="'+(isActive?0.85:0.5)+'" stroke="'+(isActive?'var(--amber)':'var(--bg-elev)')+'" stroke-width="'+(isActive?2.5:1)+'" style="cursor:pointer;">'+
      '<title>'+esc(s.name)+' \u2014 '+fmtN(s.hits.length)+' records, '+s.cats.size+' lineages, '+s.classes.size+' classes</title></circle>';
  });
  svg += '</svg>';
  document.getElementById('convScatter').innerHTML = svg;
  document.querySelectorAll('#convScatter circle').forEach(function(el){
    el.addEventListener('click', function(){
      var i = parseInt(el.getAttribute('data-convidx'),10);
      selectConvergence((convActiveIdx===i) ? null : i);
    });
  });
}

function selectConvergence(i){
  convActiveIdx = i;
  renderConvergenceTable();
  renderConvergenceScatter();
  renderConvergenceDetail();
}

function renderConvergenceDetail(){
  if(convActiveIdx===null){ closeInfoOverlay(); return; }
  var s = CONV_STATS[convActiveIdx];

  var byCat = {};
  s.hits.forEach(function(e){
    if(!byCat[e.cat]) byCat[e.cat] = {};
    var clsName = (e.cls!==null&&e.cls!==undefined) ? DATA.classList[e.cls] : 'Unclassified';
    if(!byCat[e.cat][clsName]) byCat[e.cat][clsName] = [];
    byCat[e.cat][clsName].push(e);
  });
  var cats = Object.keys(byCat).sort(function(a,b){ return Object.keys(byCat[b]).length-Object.keys(byCat[a]).length; });

  var summary = 'Reached by <b>'+s.classes.size+'</b> distinct toxin '+(s.classes.size===1?'class':'classes')+
    ' across <b>'+s.cats.size+'</b> taxonomic '+(s.cats.size===1?'lineage':'lineages')+' — '+
    (s.classes.size>=6 ? 'a strong signal of convergent evolution: unrelated protein folds independently arriving at the same target.' :
     s.cats.size>1 ? 'more than one lineage reaches this target, worth a closer look.' :
     'currently concentrated in a single lineage in this dataset.');

  var html = icard('Convergence summary', null, summary);
  cats.forEach(function(cat){
    var classNames = Object.keys(byCat[cat]).sort(function(a,b){ return byCat[cat][b].length-byCat[cat][a].length; });
    html += '<div class="conv-group"><div class="cgcat"><span class="dot" style="background:'+catColorVar(cat)+'"></span>'+esc(cat)+
      ' <span style="color:var(--faint)">— '+classNames.length+' toxin '+(classNames.length===1?'class':'classes')+'</span></div>';
    html += '<div class="conv-examples">';
    classNames.forEach(function(cn){
      var ex = byCat[cat][cn][0];
      html += '<span class="conv-ex" data-openid="'+esc(ex.id)+'">'+esc((ex.pn||ex.en).split(' (')[0])+
        '<span class="exfam">'+esc(cn)+' · '+byCat[cat][cn].length+'×</span></span>';
    });
    html += '</div></div>';
  });

  openInfoOverlay(esc(s.name), html, function(){
    convActiveIdx = null;
    renderConvergenceTable();
    renderConvergenceScatter();
  });
  document.getElementById('infoOverlay').querySelectorAll('[data-openid]').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(el.getAttribute('data-openid')); });
  });
}
