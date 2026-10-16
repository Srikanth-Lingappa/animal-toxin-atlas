/* js/23d-embedding-drawing.js
   Embedding map: drawing the points and the highlight states.
   Defines: renderEmbPlot, embApplyStates
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- drawing + highlight states ---------- */
function renderEmbPlot(){
  EMB_PTS = ENTRIES.filter(function(e){ return !!e[EMB_MODEL]; });
  EMB_SHAPE_IDX = {};
  embLegendItems().forEach(function(it, i){ EMB_SHAPE_IDX[it.l.toLowerCase()] = i; });
  var html = EMB_PTS.map(function(e){
    var p = e[EMB_MODEL];
    if(EMB_SHAPES) return '<path class="emb-point shp" d="'+embShapeOf(e)+'" style="--tx:'+p[0]+'px;--ty:'+p[1]+'px;fill:'+embColor(e)+'"/>';
    return '<circle class="emb-point" cx="'+p[0]+'" cy="'+p[1]+'" style="fill:'+embColor(e)+'"/>';
  });
  html.push('<circle id="embHi" class="emb-hi" r="0" style="display:none"/>');
  var svg = embSvgEl();
  svg.innerHTML = html.join('');
  EMB_NODES = Array.prototype.slice.call(svg.children, 0, EMB_PTS.length);
  document.getElementById('embLegend').innerHTML = EMB_LEGEND_INTRO[EMB_COLOR_MODE] + embLegendSwatches();
  EMB_HOVER = null;
  embApplyStates();
  embRenderSide();
}

function embApplyStates(){
  var svg = embSvgEl(), hasSel = EMB_SEL.size>0, hasMatch = EMB_MATCH.size>0;
  svg.classList.toggle('has-sel', hasSel);
  svg.classList.toggle('has-match', hasMatch);
  var hi = document.getElementById('embHi');
  var front = [];
  for(var i=0;i<EMB_PTS.length;i++){
    var id = EMB_PTS[i].id, n = EMB_NODES[i];
    var s = hasSel && EMB_SEL.has(id), m = hasMatch && EMB_MATCH.has(id);
    n.classList.toggle('sel', s);
    n.classList.toggle('match', m);
    if(s || m) front.push(n);
  }
  // highlighted points are drawn last so they sit on top of the grey crowd
  front.forEach(function(n){ svg.insertBefore(n, hi); });
}
