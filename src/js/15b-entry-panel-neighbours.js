/* js/15b-entry-panel-neighbours.js
   The detail panel's nearest-neighbour mini maps from the embeddings.
   Defines: embNeighbours, nnBackground, nnMiniMap, buildNeighbourMaps, buildNeighboursCard, rows, bindNeighbours
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- nearest neighbours in embedding space (entry panel) ---------- */
function embNeighbours(e, model, n){
  var q = e[model]; if(!q) return [];
  var best = [];
  for(var i=0;i<ENTRIES.length;i++){
    var o = ENTRIES[i];
    if(o===e || !o[model]) continue;
    var dx = o[model][0]-q[0], dy = o[model][1]-q[1], d = dx*dx+dy*dy;
    if(best.length===n && d>=best[n-1].d) continue;
    var j = best.length<n ? best.length : n-1;
    if(best.length<n) best.push(null);
    while(j>0 && best[j-1].d>d){ best[j]=best[j-1]; j--; }
    best[j] = {e:o, d:d};
  }
  return best;
}

/* two small maps: where this toxin's 15 nearest neighbours sit on each map, and where the OTHER map's neighbours sit */
var NN_BG = {};
function nnBackground(model){
  if(NN_BG[model]) return NN_BG[model];
  var pts = ENTRIES.filter(function(e){ return !!e[model]; });
  var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  pts.forEach(function(e){ var p=e[model]; if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<y0)y0=p[1]; if(p[1]>y1)y1=p[1]; });
  var W = 240, pad = 8, span = Math.max(x1-x0, y1-y0) || 1, sc = (W-2*pad)/span;
  var ox = pad + ((W-2*pad) - (x1-x0)*sc)/2, oy = pad + ((W-2*pad) - (y1-y0)*sc)/2;
  function X(v){ return ox + (v-x0)*sc; } function Y(v){ return W - (oy + (v-y0)*sc); }
  var d = pts.map(function(e){ var p=e[model]; return 'M'+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)+'h0'; }).join('');
  NN_BG[model] = {d:d, X:X, Y:Y, W:W};
  return NN_BG[model];
}
function nnMiniMap(e, model, mine, other, title){
  var bg = nnBackground(model), inMine = {}, inOther = {}, W = bg.W;
  mine.forEach(function(x){ inMine[x.e.id]=1; }); other.forEach(function(x){ inOther[x.e.id]=1; });
  var q = e[model], qx = bg.X(q[0]), qy = bg.Y(q[1]);
  // window that contains this toxin and every neighbour (both sets) on this map
  var xs=[qx], ys=[qy];
  mine.concat(other).forEach(function(x){ var p = x.e[model]; if(p){ xs.push(bg.X(p[0])); ys.push(bg.Y(p[1])); } });
  var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs), y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
  var half = Math.max((x1-x0), (y1-y0))/2*1.3; half = Math.max(half, 24);
  var cx = (x0+x1)/2, cy = (y0+y1)/2, zoom = half < W/2;
  var zv = (cx-half).toFixed(1)+' '+(cy-half).toFixed(1)+' '+(2*half).toFixed(1)+' '+(2*half).toFixed(1);
  var k = (2*half)/W;
  function R(px){ return 'style="r:calc('+px+'px*var(--k))"'; }
  var s = '<svg viewBox="'+(zoom ? zv : '0 0 '+W+' '+W)+'" data-full="0 0 '+W+' '+W+'" data-zoom="'+(zoom ? zv : '0 0 '+W+' '+W)+'" data-k="'+k.toFixed(4)+'" style="--k:'+(zoom ? k.toFixed(4) : 1)+'" role="img" aria-label="'+esc(title)+'">'+
    '<path d="'+bg.d+'" fill="none" stroke="var(--line-strong)" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".6"/>'+
    '<circle cx="'+qx.toFixed(1)+'" cy="'+qy.toFixed(1)+'" r="0" '+R(7)+' fill="none" stroke="var(--ink)" stroke-width="1.6" vector-effect="non-scaling-stroke"><title>This toxin</title></circle>';
  // the other model's neighbours: hollow rings at their position on THIS map
  other.forEach(function(x){ var p = x.e[model]; if(!p) return;
    s += '<circle cx="'+bg.X(p[0]).toFixed(1)+'" cy="'+bg.Y(p[1]).toFixed(1)+'" r="0" '+R(5.4)+' fill="none" stroke="var(--coral)" stroke-width="1.7" vector-effect="non-scaling-stroke"><title>'+esc((x.e.pn||x.e.en).split(' (')[0])+' (a neighbour on the other map)</title></circle>'; });
  // this map's own neighbours: filled dots
  mine.forEach(function(x){ var p = x.e[model]; if(!p) return;
    s += '<circle cx="'+bg.X(p[0]).toFixed(1)+'" cy="'+bg.Y(p[1]).toFixed(1)+'" r="0" '+R(3)+' fill="'+(inOther[x.e.id] ? 'var(--amber)' : 'var(--teal)')+'"><title>'+esc((x.e.pn||x.e.en).split(' (')[0])+(inOther[x.e.id] ? ' (a neighbour on both maps)' : ' (a neighbour on this map only)')+'</title></circle>'; });
  s += '<circle cx="'+qx.toFixed(1)+'" cy="'+qy.toFixed(1)+'" r="0" '+R(2.4)+' fill="var(--ink)"><title>This toxin</title></circle></svg>';
  return s;
}
function buildNeighbourMaps(e){
  var K = EMB_K, A = embNeighbours(e,'t5',K), B = embNeighbours(e,'prost',K);
  var inB = {}; B.forEach(function(x){ inB[x.e.id]=1; });
  var shared = A.filter(function(x){ return inB[x.e.id]; }).length;
  var jac = shared/(2*K-shared);
  var verdict = shared===0 ? 'no neighbours in common' : shared+' of '+K+' neighbours in common';
  return '<div class="nn-maps-top"><button type="button" class="toolbtn" data-nn-zoom aria-pressed="true" title="Switch between a close-up of this toxin&rsquo;s neighbourhood and the whole map">Showing a close-up &middot; click for the whole map</button></div>'+
    '<div class="nn-maps">'+
    '<div class="nn-map"><h6>ProtT5 map (sequence)</h6>'+nnMiniMap(e,'t5',A,B,'ProtT5 map')+'<div class="cap">'+K+' nearest on this map, and where ProstT5&rsquo;s '+K+' sit here</div></div>'+
    '<div class="nn-map"><h6>ProstT5 map (structure-aware)</h6>'+nnMiniMap(e,'prost',B,A,'ProstT5 map')+'<div class="cap">'+K+' nearest on this map, and where ProtT5&rsquo;s '+K+' sit here</div></div></div>'+
    '<div class="nn-maps-legend"><span><i style="background:var(--ink)"></i>this toxin</span><span><i style="background:var(--teal)"></i>neighbour on this map only</span>'+
    '<span><i style="background:var(--amber)"></i>neighbour on both maps</span><span><i style="border:1.6px solid var(--coral)"></i>other map&rsquo;s neighbour</span></div>'+
    '<div class="props-note" style="margin:0 0 12px;"><b>'+verdict.charAt(0).toUpperCase()+verdict.slice(1)+'</b> ('+Math.round(jac*100)+'% overlap by Jaccard, k = '+K+'). If the two models agree, the rings and dots sit together near the toxin; if they disagree, the rings are scattered away from it.</div>';
}

function buildNeighboursCard(e){
  if(!e.t5 || !e.prost) return '';
  var A = embNeighbours(e,'t5',10), B = embNeighbours(e,'prost',10);
  var inA = {}, inB = {};
  A.forEach(function(x){ inA[x.e.id]=1; }); B.forEach(function(x){ inB[x.e.id]=1; });
  var shared = A.filter(function(x){ return inB[x.e.id]; }).length;
  function rows(list, other, otherName){
    return list.map(function(x){
      var o = x.e, tags = '';
      if(other[o.id]) tags += '<span class="nn-tag both" title="Also among the 10 nearest in the '+otherName+' map">both models</span>';
      if(e._fam_name && o._fam_name===e._fam_name) tags += '<span class="nn-tag" title="Same UniProt protein family">same family</span>';
      if(x.d===0) tags += '<span class="nn-tag" title="Exactly the same position on the map">same spot</span>';
      return '<div class="nn-row" data-nn-open="'+esc(o.id)+'" title="Open this record">'+
        '<span class="dot" style="background:'+catColorVar(o.cat)+'"></span>'+
        '<div class="mid"><div class="nm">'+esc((o.pn||o.en).split(' (')[0])+'</div>'+
        '<div class="sub">'+esc(o.org.split(' (')[0])+' · '+esc(o.id)+'</div></div>'+
        '<div class="nn-tags">'+tags+'</div></div>';
    }).join('');
  }
  return icard('Nearest neighbours in embedding space', 'the 10 closest toxins on each language-model map',
    buildNeighbourMaps(e)+
    '<div class="nn-top"><div class="seg" data-nn-seg>'+
      '<button class="active" data-nn-model="t5">ProtT5 (sequence)</button>'+
      '<button data-nn-model="prost">ProstT5 (structure-aware)</button></div>'+
      '<span class="nn-shared">'+shared+' of 10 shared between models</span></div>'+
    '<div class="nn-list" data-nn-list="t5">'+rows(A,inB,'ProstT5')+'</div>'+
    '<div class="nn-list" data-nn-list="prost" style="display:none;">'+rows(B,inA,'ProtT5')+'</div>'+
    '<div class="props-note">Distances are measured on the 2D UMAP maps, so neighbours are approximate. A neighbour listed under both models is a robust relative; one that appears under only one is where sequence and fold views disagree. The model was run on mature chains.</div>');
}

function bindNeighbours(panel){
  panel.querySelectorAll('[data-nn-zoom]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var zoomed = btn.getAttribute('aria-pressed')==='true';
      btn.setAttribute('aria-pressed', zoomed ? 'false' : 'true');
      btn.innerHTML = zoomed ? 'Showing the whole map &middot; click for a close-up' : 'Showing a close-up &middot; click for the whole map';
      panel.querySelectorAll('.nn-map svg').forEach(function(sv){
        sv.setAttribute('viewBox', sv.getAttribute(zoomed ? 'data-full' : 'data-zoom'));
        sv.style.setProperty('--k', zoomed ? 1 : sv.getAttribute('data-k'));
      });
    });
  });
  panel.querySelectorAll('[data-nn-model]').forEach(function(b){
    b.addEventListener('click', function(){
      var m = b.getAttribute('data-nn-model');
      panel.querySelectorAll('[data-nn-model]').forEach(function(x){ x.classList.toggle('active', x===b); });
      panel.querySelectorAll('[data-nn-list]').forEach(function(l){ l.style.display = (l.getAttribute('data-nn-list')===m) ? '' : 'none'; });
    });
  });
  panel.querySelectorAll('[data-nn-open]').forEach(function(r){
    r.addEventListener('click', function(){ openDetail(r.getAttribute('data-nn-open')); });
  });
}
