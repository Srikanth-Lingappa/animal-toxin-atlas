/* js/16-compare.js
   Compare tray and the side-by-side comparison overlay.
   Defines: addToCompare, removeFromCompare, syncCompareCheckboxes, renderCompareTray, closeCompareOverlay, openInfoOverlay, closeInfoOverlay, openCompareOverlay
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   16. COMPARE FEATURE
   ============================================================ */
var COMPARE_IDS = [];
var MAX_COMPARE = 4;

function addToCompare(id){
  if(COMPARE_IDS.indexOf(id)!==-1) return;
  if(COMPARE_IDS.length>=MAX_COMPARE){ toast('You can compare up to '+MAX_COMPARE+' at a time'); return; }
  COMPARE_IDS.push(id);
  renderCompareTray();
  syncCompareCheckboxes();
}
function removeFromCompare(id){
  var i = COMPARE_IDS.indexOf(id);
  if(i!==-1) COMPARE_IDS.splice(i,1);
  renderCompareTray();
  syncCompareCheckboxes();
}
function syncCompareCheckboxes(){
  document.querySelectorAll('.entry-row').forEach(function(el){
    var id = el.getAttribute('data-id');
    var on = COMPARE_IDS.indexOf(id)!==-1;
    el.classList.toggle('in-compare', on);
    var chk = el.querySelector('.cmpchk');
    if(chk) chk.checked = on;
  });
  var detailPanel = document.getElementById('detailPanel');
  var cmpBtn = document.getElementById('detailCmpBtn');
  if(cmpBtn && detailPanel.classList.contains('open')){
    var openId = detailPanel.querySelector('[data-detail-id]');
    var id = openId ? openId.getAttribute('data-detail-id') : null;
    var on = id && COMPARE_IDS.indexOf(id)!==-1;
    cmpBtn.classList.toggle('added', on);
    cmpBtn.textContent = on ? '✓ Added to compare' : '+ Add to compare';
  }
}
function renderCompareTray(){
  var tray = document.getElementById('compareTray');
  if(!COMPARE_IDS.length){ tray.classList.remove('show'); return; }
  tray.classList.add('show');
  document.getElementById('compareChips').innerHTML = COMPARE_IDS.map(function(id){
    var e = findEntry(id);
    var name = e ? (e.pn||e.en).split(' (')[0] : id;
    return '<span class="ctchip">'+esc(name)+'<button data-rm="'+esc(id)+'">✕</button></span>';
  }).join('');
  document.querySelectorAll('#compareChips [data-rm]').forEach(function(btn){
    btn.addEventListener('click', function(ev){ ev.stopPropagation(); removeFromCompare(btn.getAttribute('data-rm')); });
  });
  document.getElementById('compareGoBtn').disabled = COMPARE_IDS.length<2;
}

function closeCompareOverlay(){
  document.getElementById('compareBackdrop').classList.remove('open');
  document.getElementById('compareOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

var infoCloseCallback = null;
function openInfoOverlay(titleHtml, bodyHtml, onClose){
  infoCloseCallback = onClose || null;
  document.getElementById('infoOverlay').innerHTML =
    '<div class="compare-head"><h2>'+titleHtml+'</h2><button class="detail-close" id="infoCloseBtn">✕</button></div>'+
    '<div class="compare-body">'+bodyHtml+'</div>';
  document.getElementById('infoCloseBtn').addEventListener('click', closeInfoOverlay);
  document.getElementById('infoBackdrop').classList.add('open');
  document.getElementById('infoOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeInfoOverlay(){
  document.getElementById('infoBackdrop').classList.remove('open');
  document.getElementById('infoOverlay').classList.remove('open');
  document.body.style.overflow = '';
  var cb = infoCloseCallback; infoCloseCallback = null;
  if(cb) cb();
}

function openCompareOverlay(){
  if(COMPARE_IDS.length<2) return;
  var entries = COMPARE_IDS.map(findEntry).filter(Boolean);
  var n = entries.length;

  // shared vs unique keywords
  var kwSets = entries.map(function(e){ return new Set(e.kw); });
  var shared = new Set(Array.from(kwSets[0]).filter(function(k){
    return kwSets.every(function(s){ return s.has(k); });
  }));

  var cards = entries.map(function(e){
    var props = computeProteinProps(e.seq, e.ss);
    var kwHtml = e.kw.map(function(k){
      var cls = shared.has(k) ? 'shared' : 'unique';
      return '<span class="cmp-tag '+cls+'">'+esc(DATA.kwList[k])+'</span>';
    }).join('');
    return '<div class="cmp-card">'+
      '<div class="dcat" style="--dot:'+catColorVar(e.cat)+';margin-bottom:6px;"><span class="dot"></span>'+esc(e.cat)+'</div>'+
      '<h4>'+esc((e.pn||e.en).split(' (')[0])+'</h4>'+
      '<div class="cmporg">'+esc(e.org.split(' (')[0])+' · '+esc(e.id)+'</div>'+
      '<div class="cmp-summary">'+(e.len||'—')+' aa · '+esc(e._fam_name||'unclassified family')+
        (e._cls_name && e._cls_name!==e._fam_name ? ' · <span style="color:var(--amber)">'+esc(e._cls_name)+'</span>' : '')+'</div>'+
      '<div class="cmp-section"><h5>Properties</h5>'+renderPropsTable(props, e.ss)+'</div>'+
      (e.kw.length ? '<div class="cmp-section"><h5>Keywords</h5><div class="cmp-kwrow">'+kwHtml+'</div></div>' : '')+
    '</div>';
  }).join('');

  var alignHtml = '';
  if(n===2 && entries[0].seq && entries[1].seq){
    var res = swAlign(entries[0].seq, entries[1].seq);
    var lines=[], W=60;
    for(var p=0;p<res.qAln.length;p+=W){
      lines.push('A  '+res.qAln.slice(p,p+W));
      lines.push('   '+res.midAln.slice(p,p+W));
      lines.push('B  '+res.sAln.slice(p,p+W));
      lines.push('');
    }
    alignHtml = '<div class="cmp-section" style="margin-top:20px;"><h5>Pairwise alignment — score '+res.score.toFixed(0)+
      ', '+(res.identity*100).toFixed(0)+'% identity over '+res.alnLen+' aa</h5>'+
      '<div class="cmp-align-block">'+esc(lines.join('\n').trim())+'</div></div>';
  } else if(n>2){
    alignHtml = '<div class="cmp-section" style="margin-top:20px;"><h5>Sequences</h5>'+
      '<div class="props-note">Pairwise alignment is shown only when comparing exactly two toxins. With '+n+' selected, sequences are listed individually below.</div>'+
      entries.map(function(e){
        return e.seq ? '<div style="margin-top:10px;"><div style="font-family:var(--font-mono);font-size:10.5px;color:var(--muted);margin-bottom:4px;">'+esc(e.id)+' ('+e.seq.length+' aa)</div>'+
          '<div class="cmp-align-block" style="margin-top:0;">'+esc(wrapSeqRaw(e.seq,60))+'</div></div>' : '';
      }).join('')+
    '</div>';
  }

  var alignText = (n===2 && entries[0].seq && entries[1].seq)
    ? 'Pairwise alignment \u2014 '+entries[0].id+' vs '+entries[1].id+'\nScore '+res.score.toFixed(0)+', '+(res.identity*100).toFixed(0)+'% identity over '+res.alnLen+' aa\n\n'+lines.join('\n')
    : null;

  document.getElementById('compareOverlay').innerHTML =
    '<div class="compare-head"><h2>Comparing '+n+' toxins</h2>'+
      '<span style="display:flex; gap:8px; align-items:center;">'+
        '<button class="toolbtn" id="cmpExportFasta">⇩ FASTA</button>'+
        (alignText ? '<button class="toolbtn" id="cmpExportAlign">⇩ Alignment</button>' : '')+
        '<button class="detail-close" id="compareCloseBtn">✕</button>'+
      '</span>'+
    '</div>'+
    '<div class="compare-body"><div class="cmp-cols" style="grid-template-columns:repeat('+n+',1fr);">'+cards+'</div>'+alignHtml+'</div>';

  document.getElementById('compareCloseBtn').addEventListener('click', closeCompareOverlay);
  document.getElementById('cmpExportFasta').addEventListener('click', function(){
    exportFasta(entries, 'comparison-'+entries.map(function(e){return e.id;}).join('-')+'.fasta');
  });
  var alignBtn = document.getElementById('cmpExportAlign');
  if(alignBtn) alignBtn.addEventListener('click', function(){
    triggerDownload('alignment-'+entries[0].id+'-vs-'+entries[1].id+'.txt', alignText);
  });
  document.getElementById('compareBackdrop').classList.add('open');
  document.getElementById('compareOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
