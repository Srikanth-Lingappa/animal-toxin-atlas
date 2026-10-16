/* js/23e-embedding-selection-and-search.js
   Embedding map: box selection and the search box.
   Defines: embSelectRect, embClearSelection, embHay, embRunSearch
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- selection ---------- */
function embSelectRect(ax, ay, bx, by, add){
  var x0 = Math.min(ax,bx), x1 = Math.max(ax,bx), y0 = Math.min(ay,by), y1 = Math.max(ay,by);
  var next = add ? new Set(EMB_SEL) : new Set();
  for(var i=0;i<EMB_PTS.length;i++){
    var q = EMB_PTS[i][EMB_MODEL];
    if(q[0]>=x0 && q[0]<=x1 && q[1]>=y0 && q[1]<=y1) next.add(EMB_PTS[i].id);
  }
  EMB_SEL = next;
  EMB_TOP_DIS = false;
  embApplyStates();
  embRenderSide();
}
function embClearSelection(){
  EMB_TOP_DIS = false;
  if(!EMB_SEL.size) return;
  EMB_SEL = new Set();
  embApplyStates();
  embRenderSide();
}

/* ---------- search ---------- */
function embHay(e){
  if(e._eh === undefined){
    e._eh = [e.pn, e.en, e.gn, e.org, e.cn, e.id, e._fam_name, e._cls_name, e.cat].join(' ').toLowerCase();
  }
  return e._eh;
}
function embRunSearch(){
  var q = document.getElementById('embSearch').value.trim().toLowerCase();
  var cnt = document.getElementById('embSearchCount');
  EMB_QUERY = q;
  EMB_MATCH = new Set();
  if(q.length >= 2){
    var terms = q.split(/\s+/);
    EMB_PTS.forEach(function(e){
      var h = embHay(e);
      if(terms.every(function(t){ return h.indexOf(t) !== -1; })) EMB_MATCH.add(e.id);
    });
    cnt.textContent = EMB_MATCH.size ? fmtN(EMB_MATCH.size)+(EMB_MATCH.size===1?' match':' matches') : 'no match';
  } else {
    cnt.textContent = '';
  }
  embApplyStates();
  embRenderSide();
}
