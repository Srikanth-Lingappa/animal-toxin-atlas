/* js/23f-embedding-side-panel.js
   Embedding map: the side panel next to the map.
   Defines: embSideData, embSyncTopDis, embRenderSide
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- side panel ---------- */
function embSideData(){
  if(EMB_SEL.size) return {mode:'sel', list:EMB_PTS.filter(function(e){ return EMB_SEL.has(e.id); })};
  if(EMB_MATCH.size) return {mode:'match', list:EMB_PTS.filter(function(e){ return EMB_MATCH.has(e.id); })};
  return {mode:'none', list:[]};
}

function embSyncTopDis(){
  var box = document.getElementById('embTopDis'); if(!box) return;
  box.querySelectorAll('button').forEach(function(b){
    var v = b.getAttribute('data-n'), n = (v==='zero') ? 'zero' : parseInt(v,10), on = !!(EMB_TOP_DIS && EMB_TOP_N===n);
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if(v==='zero' && EMB_AGREE_READY){ var z = EMB_AGREE_RANK.filter(function(e){ return e._ag.j===0; }).length; b.textContent = 'All ' + fmtN(z) + ' with none shared'; }
  });
}
function embRenderSide(resetShown){
  embSyncTopDis();
  if(resetShown !== false) EMB_LIST_SHOWN = 60;
  var head = document.getElementById('embSideHead'), comp = document.getElementById('embSideComp'), list = document.getElementById('embSideList');
  var d = embSideData();
  if(d.mode==='none'){
    head.innerHTML = '<div class="emb-empty"><b>Nothing selected</b>Drag a box on the map to list those toxins here &mdash; switch the tool to <b style="display:inline;font-size:inherit">Select</b>, or hold <b style="display:inline;font-size:inherit">Shift</b> while dragging. Or use the search box to find a toxin, species or family.</div>';
    comp.innerHTML = ''; list.innerHTML = '';
    var de = document.getElementById('embSideDesc'); if(de) de.style.display = 'none';
    return;
  }
  var n = d.list.length;
  var title = d.mode==='sel' ? fmtN(n)+' selected' : fmtN(n)+(n===1?' match':' matches');
  var sub = (d.mode==='sel' && EMB_TOP_DIS) ? 'most divergent between ProtT5 and ProstT5 (of '+fmtN(EMB_AGREE_RANK.length)+')'
    : d.mode==='sel'
    ? (EMB_MATCH.size ? fmtN(EMB_MATCH.size)+' search matches highlighted too' : 'drag again to replace · Shift+drag to add')
    : 'search: “'+EMB_QUERY+'”';
  head.innerHTML = '<div class="emb-sel-top"><div><b>'+title+'</b><small title="'+esc(sub)+'">'+esc(sub)+'</small></div><span>'+
    '<button class="toolbtn" id="embBtnZoom" title="Zoom the map to these points">Zoom to</button> '+
    (d.mode==='sel' ? '<button class="toolbtn" id="embBtnClear">Clear</button>'
                    : '<button class="toolbtn" id="embBtnSelMatches" title="Turn these search matches into a selection">Select all</button>')+
    '</span></div>';
  document.getElementById('embBtnZoom').addEventListener('click', function(){ embZoomTo(d.list); });
  var bc = document.getElementById('embBtnClear'); if(bc) bc.addEventListener('click', embClearSelection);
  var bs = document.getElementById('embBtnSelMatches');
  if(bs) bs.addEventListener('click', function(){ EMB_SEL = new Set(EMB_MATCH); embApplyStates(); embRenderSide(); });

  var descEl = document.getElementById('embSideDesc');
  if(descEl){
    descEl.innerHTML = (d.mode==='sel' && EMB_TOP_DIS)
      ? (function(){
          var zero = EMB_AGREE_RANK.filter(function(e){ return e._ag.j===0; }).length, tot = EMB_AGREE_RANK.length;
          return '<b>What this is.</b> The '+fmtN(n)+' toxins whose closest relatives differ most between the two maps. For each one, ProtT5 (sequence) and ProstT5 (structure-aware) place it among different neighbours. '+
            '<b>'+fmtN(zero)+' of '+fmtN(tot)+' toxins ('+Math.round(zero/tot*100)+'%)</b> share none of their 15 nearest neighbours between the two maps, so any list of 100 or 250 is a cut through that group, ordered by how far apart the neighbours really are. '+
            'Open a card and look at the two small maps in its &ldquo;Nearest neighbours&rdquo; section to see how the neighbourhoods differ; unusual folds, fragments and divergent paralogs are typical here.';
        })()
      : '';
    descEl.style.display = descEl.innerHTML ? '' : 'none';
  }

  // composition by whatever the map is currently coloured by
  var tally = {}, colors = {};
  d.list.forEach(function(e){ var g = embGroup(e); tally[g.label] = (tally[g.label]||0)+1; colors[g.label] = g.color; });
  var labels = Object.keys(tally).sort(function(a,b){ return tally[b]-tally[a]; });
  var top = labels.slice(0,5), rest = labels.slice(5).reduce(function(s,l){ return s+tally[l]; }, 0);
  var segs = top.map(function(l){ return {l:l, n:tally[l], c:colors[l]}; });
  if(rest) segs.push({l:'+ '+(labels.length-5)+' more', n:rest, c:'var(--line-strong)'});
  comp.innerHTML =
    '<div class="emb-compbar">'+segs.map(function(s){ return '<i style="width:'+(s.n/n*100)+'%;background:'+s.c+'" title="'+esc(s.l)+': '+s.n+'"></i>'; }).join('')+'</div>'+
    '<div class="emb-compline">'+segs.map(function(s){ return '<span><span class="sw" style="background:'+s.c+'"></span>'+esc(s.l)+' '+s.n+'</span>'; }).join('')+'</div>';

  var sorted = d.list.slice().sort(function(a,b){
    return (a.cat||'').localeCompare(b.cat||'') || (a.pn||a.en||'').localeCompare(b.pn||b.en||'');
  });
  var shown = sorted.slice(0, EMB_LIST_SHOWN);
  list.innerHTML = shown.map(function(e){
    return '<div class="emb-card" data-id="'+esc(e.id)+'">'+
      '<span class="dot" style="background:'+embColor(e)+'"></span>'+
      '<div class="mid"><div class="nm" title="'+esc((e.pn||e.en).split(' (')[0])+'">'+esc((e.pn||e.en).split(' (')[0])+'</div>'+
      '<div class="sub">'+esc(e.org.split(' (')[0])+' · '+esc(e.id)+(EMB_AGREE_READY && e._ag && (EMB_COLOR_MODE==='agree'||EMB_TOP_DIS) ? ' · '+Math.round(e._ag.j*100)+'% shared' : '')+'</div></div>'+
      '<button class="loc" data-loc="'+esc(e.id)+'" title="locate on the map">⌖</button></div>';
  }).join('') + (sorted.length > shown.length
    ? '<button class="toolbtn more-btn" id="embMore">Show '+Math.min(60, sorted.length-shown.length)+' more ('+fmtN(sorted.length-shown.length)+' remaining)</button>' : '');
  var more = document.getElementById('embMore');
  if(more) more.addEventListener('click', function(){ EMB_LIST_SHOWN += 60; embRenderSide(false); });
}
