/* js/23h-embedding-wiring.js
   Embedding map: builds the tab and wires its events.
   Defines: renderEmbeddingTab, setBox, endGesture
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- wiring ---------- */
function renderEmbeddingTab(){
  if(!DS_STATS) buildDsStats();
  EMB_DS_COLORS = {};
  DS_STATS.patterns.slice(0,10).forEach(function(g,i){ EMB_DS_COLORS[g.pattern] = classColor(i); });
  EMB_MECH_COLORS = {};
  MF_LIST.map(function(m,i){ return {term:m.term, n:MF_COUNT[i]}; })
    .filter(function(m){ return m.term!=='toxin activity'; })
    .sort(function(a,b){ return b.n-a.n; })
    .slice(0,10)
    .forEach(function(m,i){ EMB_MECH_COLORS[m.term] = classColor(i); });

  embResetView();
  renderEmbPlot();

  var svg = embSvgEl(), box = document.getElementById('embBox');
  var gesture = null;
  var DRAG_PX = 4;

  function setBox(g, cx, cy){
    var r = svg.getBoundingClientRect();
    var x0 = Math.min(g.x0,cx)-r.left, y0 = Math.min(g.y0,cy)-r.top;
    box.style.left = x0+'px'; box.style.top = y0+'px';
    box.style.width = Math.abs(cx-g.x0)+'px'; box.style.height = Math.abs(cy-g.y0)+'px';
    box.style.display = 'block';
  }

  svg.addEventListener('pointerdown', function(ev){
    if(ev.button !== 0) return;
    var boxMode = (EMB_TOOL==='select') || ev.shiftKey;
    gesture = {kind: boxMode ? 'box' : 'pan', x0:ev.clientX, y0:ev.clientY, lastX:ev.clientX, lastY:ev.clientY, moved:false, add:ev.shiftKey};
    try{ svg.setPointerCapture(ev.pointerId); }catch(err){}
  });

  svg.addEventListener('pointermove', function(ev){
    if(gesture){
      if(!gesture.moved){
        var dx = ev.clientX-gesture.x0, dy = ev.clientY-gesture.y0;
        if(Math.sqrt(dx*dx+dy*dy) < DRAG_PX) return;
        gesture.moved = true;
        embHideHover();
        if(gesture.kind==='pan') svg.classList.add('dragging');
      }
      if(gesture.kind==='pan'){
        var s = embScale(svg.getBoundingClientRect());
        EMB_VIEW.x -= (ev.clientX-gesture.lastX)/s;
        EMB_VIEW.y -= (ev.clientY-gesture.lastY)/s;
        gesture.lastX = ev.clientX; gesture.lastY = ev.clientY;
        svg.setAttribute('viewBox', EMB_VIEW.x+' '+EMB_VIEW.y+' '+EMB_VIEW.w+' '+EMB_VIEW.h);
      } else {
        setBox(gesture, ev.clientX, ev.clientY);
      }
      return;
    }
    var near = embNearest(ev.clientX, ev.clientY);
    if(near) embShowHover(near, ev.clientX, ev.clientY);
    else if(EMB_HOVER) embHideHover();
  });

  function endGesture(ev, cancelled){
    var g = gesture;
    gesture = null;
    box.style.display = 'none';
    svg.classList.remove('dragging');
    if(!g || cancelled) return;
    if(g.moved && g.kind==='box'){
      var a = embPxToData(g.x0, g.y0), b = embPxToData(ev.clientX, ev.clientY);
      embSelectRect(a.x, a.y, b.x, b.y, g.add);
    } else if(!g.moved){
      // a tap/click that never became a drag: open the nearest point within tolerance
      var near = embNearest(ev.clientX, ev.clientY);
      if(near) openDetail(near.id);
      else if(g.kind==='box' && !g.add) embClearSelection();
    }
  }
  svg.addEventListener('pointerup', function(ev){ endGesture(ev, false); });
  svg.addEventListener('pointercancel', function(ev){ endGesture(ev, true); });
  svg.addEventListener('pointerleave', function(){ if(!gesture) embHideHover(); });

  svg.addEventListener('wheel', function(ev){
    ev.preventDefault();
    var p = embPxToData(ev.clientX, ev.clientY);
    var factor = ev.deltaY > 0 ? 1.18 : 1/1.18;
    var maxW = embFitView(embBounds(EMB_MODEL)).w*4;
    var newW = Math.max(0.02, Math.min(EMB_VIEW.w*factor, maxW));
    var k = newW/EMB_VIEW.w;
    EMB_VIEW.x = p.x - (p.x-EMB_VIEW.x)*k;
    EMB_VIEW.y = p.y - (p.y-EMB_VIEW.y)*k;
    EMB_VIEW.w = newW; EMB_VIEW.h = EMB_VIEW.h*k;
    embApplyView();
  }, {passive:false});

  window.addEventListener('resize', function(){ if(EMB_VIEW) embUpdatePointSize(); });

  // side-panel cards: click = open record, ⌖ = locate on map
  document.getElementById('embSideList').addEventListener('click', function(ev){
    var loc = ev.target.closest('.loc');
    if(loc){ var e = findEntry(loc.getAttribute('data-loc')); if(e) embFocus(e); return; }
    var card = ev.target.closest('.emb-card');
    if(card) openDetail(card.getAttribute('data-id'));
  });

  document.getElementById('embResetView').addEventListener('click', embResetView);
  document.querySelectorAll('#embTool button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#embTool button').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      EMB_TOOL = b.getAttribute('data-t');
      svg.classList.toggle('tool-select', EMB_TOOL==='select');
    });
  });
  document.querySelectorAll('#embModel button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#embModel button').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      EMB_MODEL = b.getAttribute('data-m');
      embResetView();
      renderEmbPlot();
    });
  });
  document.querySelectorAll('#embColorMode button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#embColorMode button').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      EMB_COLOR_MODE = b.getAttribute('data-m');
      embWithAgreement(renderEmbPlot);
    });
  });

  var inp = document.getElementById('embSearch');
  inp.addEventListener('input', debounce(embRunSearch, 150));
  inp.addEventListener('keydown', function(ev){
    if(ev.key==='Enter'){ embRunSearch(); if(EMB_MATCH.size) embZoomTo(EMB_PTS.filter(function(e){ return EMB_MATCH.has(e.id); })); }
    else if(ev.key==='Escape'){ inp.value=''; embRunSearch(); }
  });

  document.getElementById('embShapes').addEventListener('click', function(){
    EMB_SHAPES = !EMB_SHAPES;
    this.classList.toggle('on', EMB_SHAPES); this.setAttribute('aria-pressed', EMB_SHAPES ? 'true' : 'false');
    renderEmbPlot();
  });
  // click a legend entry to select every toxin in that group (colour-independent way to find a group)
  document.getElementById('embLegend').addEventListener('click', function(ev){
    var b = ev.target.closest('.emb-lg'); if(!b) return;
    var lbl = b.getAttribute('data-lbl').toLowerCase();
    var ids = EMB_PTS.filter(function(e){ return embGroup(e).label.toLowerCase()===lbl; }).map(function(e){ return e.id; });
    var same = ids.length===EMB_SEL.size && ids.every(function(id){ return EMB_SEL.has(id); });
    EMB_SEL = same ? new Set() : new Set(ids);
    EMB_TOP_DIS = false;
    embApplyStates(); embRenderSide();
  });
  document.querySelectorAll('#embTopDis button').forEach(function(btn){
    btn.addEventListener('click', function(){
      var v = btn.getAttribute('data-n'), n = (v==='zero') ? 'zero' : parseInt(v,10);
      if(EMB_TOP_DIS && EMB_TOP_N===n){ embClearSelection(); return; }   // click the active segment again to clear
      EMB_TOP_N = n; embTopDisagreements(n);
    });
  });
  document.getElementById('embExpCsv').addEventListener('click', embExportCsv);
  document.getElementById('embExpFasta').addEventListener('click', embExportFasta);
  document.getElementById('embExpSvg').addEventListener('click', embExportSvg);
  document.getElementById('embExpPng').addEventListener('click', embExportPng);
}
