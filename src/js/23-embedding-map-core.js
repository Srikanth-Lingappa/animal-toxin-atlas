/* js/23-embedding-map-core.js
   Embedding map: view, scales, zoom and nearest-point lookup.
   Defines: embSvgEl, embModelName, embBounds, embAspect, embFitView, embScale, embPxToData, embNearest, embUpdatePointSize, embApplyView, embResetView, embOnShow ...
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   23. EMBEDDING SPACE — ProtT5 / ProstT5 UMAP scatter
   Data-driven (primary) view of the Toxin Relationships tab; the keyword-based Shared Targets view is secondary.
   - Points have a FIXED on-screen size (px) so they separate as you zoom.
   - Hover/click use nearest-point-within-tolerance, not an exact hit.
   - Box selection (Select tool, or Shift+drag) fills a card list on the right.
   - Search highlights matches; selection and search persist across the two models.
   - Exports: CSV / FASTA (selection or all), SVG / PNG of the current view.
   ============================================================ */
var EMB_MODEL = 't5';
var EMB_COLOR_MODE = 'cat';
var EMB_TOOL = 'pan';              // 'pan' | 'select'
var EMB_VIEW = null;               // {x,y,w,h} current viewBox, kept at the element's aspect ratio
var EMB_DS_COLORS = {}, EMB_MECH_COLORS = {};
var EMB_PIXEL_R = 3.6;             // on-screen dot radius, px
var EMB_HIT_PX = 9;                // click/hover tolerance, px
var EMB_PTS = [];                  // entries that have coordinates (same order as EMB_NODES)
var EMB_NODES = [];                // <circle> elements, parallel to EMB_PTS
var EMB_SIZED = false;             // true once fitted against a real (visible) element size
var EMB_HOVER = null;
var EMB_SEL = new Set();           // selected accessions
var EMB_MATCH = new Set();         // search-matched accessions
var EMB_QUERY = '';
var EMB_LIST_SHOWN = 60;
var EMB_SHAPES = false;            // draw each group with its own marker shape as well as its colour
var EMB_SHAPE_PATHS = ['M1 0A1 1 0 1 0 -1 0A1 1 0 1 0 1 0Z','M-.9 -.9H.9V.9H-.9Z','M0 -1.3L1.2 .9H-1.2Z','M0 -1.3L1.3 0L0 1.3L-1.3 0Z','M0 1.3L1.2 -.9H-1.2Z','M-.35 -1.2H.35V-.35H1.2V.35H.35V1.2H-.35V.35H-1.2V-.35H-.35Z','M1.1 0L.55 .95H-.55L-1.1 0L-.55 -.95H.55Z'];
var EMB_SHAPE_IDX = {};            // legend label (lower-case) -> shape index for the current colour mode
var EMB_MODE_LABEL = {cat:'Animal group', cls:'Toxin class', pdb:'Structural coverage', ds:'Disulfide pattern', mech:'Mechanism of action', agree:'Model agreement'};

function embSvgEl(){ return document.getElementById('embSvg'); }
function embModelName(){ return EMB_MODEL==='t5' ? 'ProtT5' : 'ProstT5'; }

function embBounds(model){
  var xs=[], ys=[];
  ENTRIES.forEach(function(e){ var p = e[model]; if(p){ xs.push(p[0]); ys.push(p[1]); } });
  return {minX:Math.min.apply(null,xs), maxX:Math.max.apply(null,xs), minY:Math.min.apply(null,ys), maxY:Math.max.apply(null,ys)};
}

function embAspect(){
  var r = embSvgEl().getBoundingClientRect();
  return (r.width>0 && r.height>0) ? r.width/r.height : 700/560;
}

function embFitView(b, padFrac){
  var pf = (padFrac===undefined) ? 0.06 : padFrac;
  var padX = (b.maxX-b.minX)*pf || 1, padY = (b.maxY-b.minY)*pf || 1;
  var dw = (b.maxX-b.minX)+padX*2, dh = (b.maxY-b.minY)+padY*2;
  var ratio = embAspect();
  var w = dw, h = dh;
  if(w/h > ratio){ h = w/ratio; } else { w = h*ratio; }
  var cx = (b.minX+b.maxX)/2, cy = (b.minY+b.maxY)/2;
  return {x:cx-w/2, y:cy-h/2, w:w, h:h};
}

// pixels per data unit (uniform, honouring any letterboxing)
function embScale(rect){ return Math.min(rect.width/EMB_VIEW.w, rect.height/EMB_VIEW.h); }

function embPxToData(clientX, clientY){
  var rect = embSvgEl().getBoundingClientRect();
  var s = embScale(rect);
  var ox = (rect.width - EMB_VIEW.w*s)/2, oy = (rect.height - EMB_VIEW.h*s)/2;
  return {x: EMB_VIEW.x + (clientX-rect.left-ox)/s, y: EMB_VIEW.y + (clientY-rect.top-oy)/s, s:s};
}

function embNearest(clientX, clientY){
  var p = embPxToData(clientX, clientY);
  if(!isFinite(p.s) || p.s<=0) return null;
  var tol = EMB_HIT_PX / p.s, best = null, bd = tol*tol;
  for(var i=0;i<EMB_PTS.length;i++){
    var q = EMB_PTS[i][EMB_MODEL];
    var dx = q[0]-p.x, dy = q[1]-p.y, d = dx*dx+dy*dy;
    if(d < bd){ bd = d; best = EMB_PTS[i]; }
  }
  return best;
}

function embUpdatePointSize(){
  var svg = embSvgEl(), rect = svg.getBoundingClientRect();
  if(!EMB_VIEW || !rect.width || !rect.height) return false;
  svg.style.setProperty('--emb-r', EMB_PIXEL_R / embScale(rect));
  return true;
}

function embApplyView(){
  embSvgEl().setAttribute('viewBox', EMB_VIEW.x+' '+EMB_VIEW.y+' '+EMB_VIEW.w+' '+EMB_VIEW.h);
  embUpdatePointSize();
  embHideHover();
}

function embResetView(){
  EMB_VIEW = embFitView(embBounds(EMB_MODEL));
  embApplyView();
  var r = embSvgEl().getBoundingClientRect();
  EMB_SIZED = r.width>0 && r.height>0;
}

// the tab is display:none at load, so real sizes only exist once it's shown
function embOnShow(){
  if(!EMB_VIEW) return;
  if(!EMB_SIZED) embResetView(); else embUpdatePointSize();
}

function embZoomTo(list){
  if(!list || !list.length) return;
  var xs = list.map(function(e){ return e[EMB_MODEL][0]; }), ys = list.map(function(e){ return e[EMB_MODEL][1]; });
  var v = embFitView({minX:Math.min.apply(null,xs), maxX:Math.max.apply(null,xs), minY:Math.min.apply(null,ys), maxY:Math.max.apply(null,ys)}, 0.18);
  if(v.w < 2){ var k = 2/v.w, cx = v.x+v.w/2, cy = v.y+v.h/2; v.w*=k; v.h*=k; v.x=cx-v.w/2; v.y=cy-v.h/2; }
  EMB_VIEW = v;
  embApplyView();
}

// centre on one point (never zooms OUT if already closer) and ring it
function embFocus(e){
  var q = e[EMB_MODEL];
  var v = embFitView({minX:q[0]-1.5, maxX:q[0]+1.5, minY:q[1]-1.5, maxY:q[1]+1.5}, 0.06);
  if(v.w > EMB_VIEW.w) v = {x:q[0]-EMB_VIEW.w/2, y:q[1]-EMB_VIEW.h/2, w:EMB_VIEW.w, h:EMB_VIEW.h};
  EMB_VIEW = v;
  embApplyView();
  var hi = document.getElementById('embHi'), s = embScale(embSvgEl().getBoundingClientRect());
  hi.setAttribute('cx', q[0]); hi.setAttribute('cy', q[1]);
  hi.setAttribute('r', (EMB_PIXEL_R+6)/s);
  hi.style.display = '';
}

function embHideHover(){
  EMB_HOVER = null;
  var hi = document.getElementById('embHi'), tip = document.getElementById('embTip');
  if(hi) hi.style.display = 'none';
  if(tip) tip.style.display = 'none';
  embSvgEl().classList.remove('over-point');
}

function embShowHover(e, clientX, clientY){
  var svg = embSvgEl(), hi = document.getElementById('embHi'), tip = document.getElementById('embTip');
  var rect = svg.getBoundingClientRect(), s = embScale(rect), q = e[EMB_MODEL];
  hi.setAttribute('cx', q[0]); hi.setAttribute('cy', q[1]);
  hi.setAttribute('r', (EMB_PIXEL_R+3)/s);
  hi.style.display = '';
  tip.innerHTML = esc((e.pn||e.en).split(' (')[0])+'<i>'+esc(e.org.split(' (')[0])+' · '+esc(e.cat.split(' (')[0])+'</i>';
  tip.style.display = 'block';
  var x = clientX-rect.left+14, y = clientY-rect.top+14;
  if(x > rect.width-tip.offsetWidth-6) x = clientX-rect.left-tip.offsetWidth-14;
  if(y > rect.height-tip.offsetHeight-6) y = clientY-rect.top-tip.offsetHeight-14;
  tip.style.left = Math.max(4,x)+'px'; tip.style.top = Math.max(4,y)+'px';
  svg.classList.add('over-point');
  EMB_HOVER = e;
}
