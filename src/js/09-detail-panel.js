/* js/09-detail-panel.js
   The record detail panel: header, text cards, sequence and cross-references.
   Defines: findEntry, wrapSeq, icard, openDetail, wrapSeqRaw, closeDetail
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   9. DETAIL PANEL
   ============================================================ */
function findEntry(id){
  for(var i=0;i<ENTRIES.length;i++){ if(ENTRIES[i].id === id) return ENTRIES[i]; }
  return null;
}

function wrapSeq(seq, width){
  var lines = [];
  for(var i=0;i<seq.length;i+=width){ lines.push(seq.slice(i,i+width)); }
  return lines.join('\n');
}

function icard(title, sub, body){
  return '<div class="info-card"><div class="ic-title">'+title+'</div>'+
    (sub ? '<div class="ic-sub">'+sub+'</div>' : '')+
    '<div class="ic-body">'+body+'</div></div>';
}

function openDetail(id){
  var e = findEntry(id);
  if(!e) return;
  var dot = catColorVar(e.cat);

  var idLine = [
    '<a href="https://www.uniprot.org/uniprotkb/'+encodeURIComponent(e.id)+'/entry" target="_blank" rel="noopener">UniProt ↗</a>',
    '<a href="https://alphafold.ebi.ac.uk/entry/'+encodeURIComponent(e.id)+'" target="_blank" rel="noopener">AlphaFold ↗</a>',
    '<span><span class="k">acc</span> '+esc(e.id)+'</span>',
    '<span><span class="k">entry</span> '+esc(e.en)+'</span>'
  ];
  if(e.ec) idLine.push('<span><span class="k">EC</span> '+esc(e.ec)+'</span>');

  var cards = '';
  if(e.who){
    var whoRegionTags = e.who.map(function(w){ return '<span class="who-card-region">'+esc(w.subregion)+'</span>'; }).join('');
    cards += icard('⚠ WHO medically important species', 'WHO antivenom guidelines, Annex 5 (TRS No. 1004)',
      '<div style="margin-bottom:8px;">'+whoRegionTags+'</div>'+
      '<div class="props-note" style="margin-top:0;">Listed by WHO as a species of major medical importance (frequent, severe, or antivenom-relevant snakebite) in the area(s) shown above.</div>');
  }
  if(e.fn) cards += icard('Function', null, esc(e.fn));
  cards += buildCleavageNote(e);
  cards += buildSeqMap(e);
  if(e.ts) cards += icard('Tissue specificity', null, esc(e.ts));
  if(e.ptm || (e.mod&&e.mod.length) || (e.gly&&e.gly.length)){
    var ptmItems = '';
    if(e.mod) e.mod.forEach(function(m){ ptmItems += '<div class="mod-row"><span class="pos">'+m[0]+'</span>'+esc(m[1]||'Modified residue')+'</div>'; });
    if(e.gly) e.gly.forEach(function(g){ ptmItems += '<div class="mod-row"><span class="pos">'+g[0]+'</span>'+esc(g[1]||'Glycosylation')+'</div>'; });
    cards += icard('Post-translational modification', null,
      (e.ptm ? esc(e.ptm) : '')+
      (ptmItems ? '<div class="mod-list" style="margin-top:'+(e.ptm?'10px':'0')+'">'+ptmItems+'</div>' : ''));
  }
  if(e.sc) cards += icard('Subcellular location', null, esc(e.sc));
  if(e.td) cards += icard('Toxic dose', null, esc(e.td));
  if(e._fam_name){
    var clsLine = e._cls_name && e._cls_name !== e._fam_name ? '<span class="tag" style="margin-right:8px;border-color:var(--amber);color:var(--amber);">'+esc(e._cls_name)+'</span>' : '';
    cards += icard('Protein family', null, clsLine+esc(e._fam_name));
  }
  if(e.ipr && e.ipr.length){
    var iprChips = e.ipr.map(function(i){
      var id = DATA.iprList[i];
      return '<a class="ipr-chip" href="https://www.ebi.ac.uk/interpro/entry/InterPro/'+esc(id)+'/" target="_blank" rel="noopener">'+esc(id)+'</a>';
    }).join('');
    cards += icard('InterPro', 'domain / family signatures matched on this sequence',
      '<div class="ipr-chips">'+iprChips+'</div>');
  }
  if(e.mfi && e.mfi.length){
    var mfChips = e.mfi.map(function(i){
      var m = MF_LIST[i];
      return '<a class="ipr-chip" href="https://www.ebi.ac.uk/QuickGO/term/GO:'+m.go+'" target="_blank" rel="noopener">'+esc(m.term)+'</a>';
    }).join('');
    cards += icard('Mechanism of action', 'Gene Ontology molecular function', '<div class="ipr-chips">'+mfChips+'</div>');
  } else if(e.mf){
    cards += icard('Molecular function', 'Gene Ontology', esc(e.mf.replace(/\[GO:\d+\]/g,'').replace(/;/g,' · ')));
  }

  if(e.kw && e.kw.length){
    var tags = e.kw.map(function(i){ return '<span class="tag">'+esc(DATA.kwList[i])+'</span>'; }).join('');
    cards += icard('Keywords', null, '<div class="tagrow">'+tags+'</div>');
  }

  if(e.pdb && e.pdb.length){
    var pdbLinks = e.pdb.map(function(p){
      var pid = p.split(';')[0].trim();
      return '<a href="https://www.rcsb.org/structure/'+encodeURIComponent(pid)+'" target="_blank" rel="noopener">'+esc(pid)+'</a>';
    }).join('');
    cards += icard('3D structures', 'Protein Data Bank', '<div class="pdblist">'+pdbLinks+'</div>');
  }

  if(e.pm && e.pm.length){
    var pmLinks = e.pm.slice(0,20).map(function(pm){
      return '<a href="https://pubmed.ncbi.nlm.nih.gov/'+encodeURIComponent(pm)+'/" target="_blank" rel="noopener">PMID '+esc(pm)+'</a>';
    }).join('');
    cards += icard('Literature', pmLinks.length>1?'':null, '<div class="pmlist">'+pmLinks+'</div>');
  }

  if(e.seq){
    var props = computeProteinProps(e.seq, e.ss);
    var msRow = '';
    if(e.ms && e.ms.mass){
      var diff = props.mw ? (e.ms.mass - props.mw) : null;
      msRow = '<div class="ms-compare">'+
        '<div class="mc"><b>'+fmtProp(props.mw,1)+' Da</b><span>computed (full precursor)</span></div>'+
        '<div class="mc"><b style="color:var(--teal)">'+e.ms.mass.toFixed(1)+' Da</b><span>observed by MS'+(e.ms.method?' ('+esc(e.ms.method)+')':'')+'</span></div>'+
        (diff!==null ? '<div class="mc"><b style="color:var(--muted)">'+(diff>=0?'+':'')+diff.toFixed(1)+' Da</b><span>difference \u2014 usually the cleaved pro-region and/or PTMs</span></div>' : '')+
      '</div>'+
      (e.ms.note ? '<div class="props-note">'+esc(e.ms.note)+'</div>' : '');
    }
    cards += icard('Physicochemical properties', 'computed live from sequence',
      renderPropsTable(props, e.ss)+
      msRow+
      '<div class="props-note">ProtParam-style formulas (Bjellqvist pKa set for pI/charge; Guruprasad et al. for instability; Kyte–Doolittle for GRAVY). Computed from the full stored sequence — PTMs and signal/propeptide cleavage are not accounted for in these formulas.</div>');
    cards += icard(e.seq.length+' aa', 'sequence',
      '<div class="seqbox">'+wrapSeq(esc(e.seq),60)+'</div>'+
      '<div class="seqtools"><button data-act="copyseq">⧉ copy sequence</button>'+
      '<button data-act="dlfasta">⇩ download FASTA</button></div>');
  }

  cards += buildNeighboursCard(e);

  var inCmp = COMPARE_IDS.indexOf(e.id)!==-1;

  var html =
    '<div class="dhead" data-detail-id="'+esc(e.id)+'">'+
      '<div class="dhead-top">'+
        '<div>'+
          '<div class="dcat" style="--dot:'+dot+'"><span class="dot"></span>'+esc(e.cat)+'</div>'+
          buildBadgeRow(e)+
          '<h2 class="dname">'+esc((e.pn||e.en).split(' (')[0])+'</h2>'+
          '<div class="dorg org-link" data-sci="'+esc(e.sci)+'" title="View this organism">'+esc(e.org.split(' (')[0])+'</div>'+
          (e.cn ? '<div class="dcommon">'+esc(e.cn)+'</div>' : '')+
        '</div>'+
        '<button class="detail-close" id="detailCloseBtn">✕</button>'+
      '</div>'+
      '<div class="dactions">'+
        '<button class="cmpbtn'+(inCmp?' added':'')+'" id="detailCmpBtn">'+(inCmp?'✓ Added to compare':'+ Add to compare')+'</button>'+
      '</div>'+
      '<div class="didrow">'+idLine.join('')+'</div>'+
    '</div>'+
    '<div class="dbody">'+cards+'</div>';

  var panel = document.getElementById('detailPanel');
  panel.innerHTML = html;
  panel.scrollTop = 0;
  document.getElementById('detailBackdrop').classList.add('open');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';

  bindNeighbours(panel);
  document.getElementById('detailCloseBtn').addEventListener('click', closeDetail);
  var dorgEl = panel.querySelector('.dorg.org-link');
  if(dorgEl) dorgEl.addEventListener('click', function(){
    var sci = dorgEl.getAttribute('data-sci');
    closeDetail();
    switchToTab('organism');
    openOrganism(sci);
    window.scrollTo({top:0, behavior:'smooth'});
  });
  document.getElementById('detailCmpBtn').addEventListener('click', function(){
    var btn = document.getElementById('detailCmpBtn');
    if(COMPARE_IDS.indexOf(e.id)!==-1){
      removeFromCompare(e.id);
      btn.classList.remove('added'); btn.textContent = '+ Add to compare';
    } else {
      if(COMPARE_IDS.length>=MAX_COMPARE){ toast('You can compare up to '+MAX_COMPARE+' at a time'); return; }
      addToCompare(e.id);
      btn.classList.add('added'); btn.textContent = '✓ Added to compare';
    }
  });

  var copyBtn = panel.querySelector('[data-act="copyseq"]');
  if(copyBtn) copyBtn.addEventListener('click', function(){
    navigator.clipboard && navigator.clipboard.writeText(e.seq).then(function(){
      toast('Sequence copied');
    }).catch(function(){ toast('Could not copy'); });
  });
  var dlBtn = panel.querySelector('[data-act="dlfasta"]');
  if(dlBtn) dlBtn.addEventListener('click', function(){
    var fasta = '>sp|'+e.id+'|'+e.en+' '+(e.pn||'').split(' (')[0]+' OS='+e.sci+'\n'+wrapSeqRaw(e.seq,60)+'\n';
    triggerDownload(e.id+'.fasta', fasta);
  });
}
function wrapSeqRaw(seq,width){
  var lines=[]; for(var i=0;i<seq.length;i+=width){ lines.push(seq.slice(i,i+width)); } return lines.join('\n');
}

function closeDetail(){
  document.getElementById('detailBackdrop').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
  document.body.style.overflow = '';
}
