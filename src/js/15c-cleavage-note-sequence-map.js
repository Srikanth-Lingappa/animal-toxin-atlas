/* js/15c-cleavage-note-sequence-map.js
   The cleavage note, the sequence map (signal peptide, propeptide, chain, disulfides, pLDDT strip) and the properties table.
   Defines: buildCleavageNote, embeddingNote, buildSeqMap, computeProteinProps, fmtProp, renderPropsTable
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
function buildCleavageNote(e){
  if(!e.sp && !e.pro) return '';
  var parts = [];
  if(e.sp) parts.push('<div class="mod-row"><span class="pos">'+e.sp[0]+'\u2013'+e.sp[1]+'</span>Signal peptide (cleaved off before secretion)</div>');
  if(e.pro) e.pro.forEach(function(p){
    parts.push('<div class="mod-row"><span class="pos">'+p[0]+'\u2013'+p[1]+'</span>Propeptide (cleaved off, not part of the mature toxin)</div>');
  });
  if(e.ch) e.ch.forEach(function(c){
    parts.push('<div class="mod-row"><span class="pos">'+c[0]+'\u2013'+c[1]+'</span>Mature chain'+(c[2]?': '+esc(c[2]):'')+'</div>');
  });
  return icard('This sequence is processed before secretion', 'signal peptide / propeptide cleavage',
    '<div class="mod-list">'+parts.join('')+'</div>'+
    '<div class="props-note">The stored sequence above is the full translated precursor (useful for cloning/construct design). Only the mature chain region(s) shown here correspond to the toxin actually secreted in venom.</div>'+
    embeddingNote(e));
}

function embeddingNote(e){
  if(!(e.t5 || e.prost) || !e.seq) return '';
  var rg = matureRanges(e), L = e.seq.length;
  var open = '<div class="props-note" style="margin:8px 0 14px;"><b>Embedding map:</b> ';
  if(rg.length===1 && rg[0][0]===1 && rg[0][1]>=L) return open+'computed on the full sequence (UniProt marks no separate mature chain or peptide for this record).</div>';
  return open+'computed on the mature region'+(rg.length>1?'s':'')+' (residues '+rg.map(function(c){ return c[0]+'\u2013'+c[1]; }).join(', ')+'), with signal peptide and propeptide removed, not on the full precursor.</div>';
}

function buildSeqMap(e){
  var L = e.seq ? e.seq.length : e.len;
  if(!L) return '';
  var hasAny = e.pl || e.sp || e.pro || e.ch || (e.ds&&e.ds.length) || (e.mod&&e.mod.length) || (e.gly&&e.gly.length);
  if(!hasAny) return '';
  var X0 = 14, X1 = 686;
  function X(p){ return X0 + (p-1)/(Math.max(L-1,1)) * (X1-X0); }
  var trackY = 54, trackH = 13;
  var svg = '<svg class="seqmap" viewBox="0 0 700 '+(e.pl?136:128)+'" role="img">';
  // base bar
  svg += '<rect x="'+X0+'" y="'+trackY+'" width="'+(X1-X0)+'" height="'+trackH+'" rx="2" fill="var(--bg-elev-2)"/>';
  if(e.sp) svg += '<rect class="sm-sp" x="'+X(e.sp[0]).toFixed(1)+'" y="'+trackY+'" width="'+Math.max(1,X(e.sp[1])-X(e.sp[0])).toFixed(1)+'" height="'+trackH+'"><title>Signal peptide '+e.sp[0]+'-'+e.sp[1]+'</title></rect>';
  if(e.pro) e.pro.forEach(function(p){
    svg += '<rect class="sm-pro" x="'+X(p[0]).toFixed(1)+'" y="'+trackY+'" width="'+Math.max(1,X(p[1])-X(p[0])).toFixed(1)+'" height="'+trackH+'"><title>Propeptide '+p[0]+'-'+p[1]+'</title></rect>';
  });
  if(e.ch) e.ch.forEach(function(c){
    svg += '<rect class="sm-chain" x="'+X(c[0]).toFixed(1)+'" y="'+trackY+'" width="'+Math.max(1,X(c[1])-X(c[0])).toFixed(1)+'" height="'+trackH+'"><title>'+esc(c[2]||'Chain')+' '+c[0]+'-'+c[1]+'</title></rect>';
  });
  // disulfide arcs above the track
  if(e.ds && e.ds.length){
    var maxSpan = Math.max.apply(null, e.ds.map(function(b){ return Math.abs(b[1]-b[0]); }));
    e.ds.slice(0,60).forEach(function(b){
      var x1 = X(b[0]), x2 = X(b[1]);
      var span = Math.abs(b[1]-b[0]);
      var peak = trackY - 4 - (maxSpan ? span/maxSpan : 0) * 36;
      var mid = (x1+x2)/2;
      svg += '<path class="sm-ds" d="M'+x1.toFixed(1)+' '+trackY+' Q '+mid.toFixed(1)+' '+peak.toFixed(1)+' '+x2.toFixed(1)+' '+trackY+'"><title>Disulfide '+b[0]+'\u2013'+b[1]+'</title></path>';
    });
  }
  // mod / glyco ticks below the track
  var tickY = trackY + trackH + 10;
  if(e.mod) e.mod.forEach(function(m){
    svg += '<circle class="sm-mod" cx="'+X(m[0]).toFixed(1)+'" cy="'+tickY+'" r="3"><title>Pos '+m[0]+': '+esc(m[1]||'modified residue')+'</title></circle>';
  });
  if(e.gly) e.gly.forEach(function(g){
    svg += '<circle class="sm-gly" cx="'+X(g[0]).toFixed(1)+'" cy="'+(tickY+9)+'" r="3"><title>Pos '+g[0]+': '+esc(g[1]||'glycosylation')+'</title></circle>';
  });
  // AlphaFold confidence strip (pLDDT bands, merged into runs)
  if(e.pl){
    var plY = trackY+trackH+46, plH = 9, runStart = 0, plOff = e.plo||0;
    var band = function(ch){ var d = +ch; return d>=9 ? 0 : d>=7 ? 1 : d>=5 ? 2 : 3; };
    var PL_NAME = ['very high (>90)','confident (70\u201390)','low (50\u201370)','very low (<50)'];
    for(var q=1;q<=e.pl.length;q++){
      if(q===e.pl.length || band(e.pl[q])!==band(e.pl[runStart])){
        var b = band(e.pl[runStart]);
        var rw = (X1-X0)/L, x0r = X0 + (plOff+runStart)*rw, x1r = X0 + (plOff+q)*rw;
        svg += '<rect class="sm-pl'+b+'" x="'+x0r.toFixed(2)+'" y="'+plY+'" width="'+(x1r-x0r+0.3).toFixed(2)+'" height="'+plH+'"><title>pLDDT '+PL_NAME[b]+', residues '+(plOff+runStart+1)+'\u2013'+(plOff+q)+'</title></rect>';
        runStart = q;
      }
    }
    svg += '<text class="sm-axis" x="'+X0+'" y="'+(plY-3)+'">AlphaFold confidence (pLDDT)</text>';
  }
  svg += '<text class="sm-axis" x="'+X0+'" y="'+(trackY+trackH+28)+'">1</text>';
  svg += '<text class="sm-axis" x="'+X1+'" y="'+(trackY+trackH+28)+'" text-anchor="end">'+L+'</text>';
  svg += '</svg>';

  var legend = '<div class="seqmap-legend">';
  if(e.sp) legend += '<span><i style="background:var(--faint)"></i>signal peptide</span>';
  if(e.pro) legend += '<span><i style="background:color-mix(in srgb, var(--amber) 55%, var(--bg-elev))"></i>propeptide</span>';
  if(e.ch) legend += '<span><i style="background:var(--teal)"></i>mature chain</span>';
  if(e.ds && e.ds.length) legend += '<span><i style="border:1px solid var(--coral); background:none; border-radius:50%;"></i>disulfide bond ('+e.ds.length+')</span>';
  if(e.mod && e.mod.length) legend += '<span><i style="background:var(--amber); border-radius:50%;"></i>modified residue</span>';
  if(e.gly && e.gly.length) legend += '<span><i style="background:var(--teal); border-radius:50%;"></i>glycosylation</span>';
  legend += '</div>';
  if(e.pl){
    legend += '<div class="seqmap-legend" style="margin-top:6px;"><span><i style="background:#0053d6"></i>pLDDT &gt; 90</span><span><i style="background:#65cbf3"></i>70\u201390</span><span><i style="background:#ffdb13"></i>50\u201370</span><span><i style="background:#ff7d45"></i>&lt; 50</span>'+
      '<span style="margin-left:auto;">AlphaFold model \u00b7 mean pLDDT <b>'+e.plm.toFixed(1)+'</b> \u00b7 '+e.pld+'% of residues below 50'+(e.plo!==undefined ? ' \u00b7 model covers residues '+(e.plo+1)+'\u2013'+(e.plo+e.pl.length) : '')+'</span></div>';
  }

  if(e.pdb && e.pdb.length && e.m3){
    legend += '<div class="seqmap-legend" style="margin-top:6px;"><span>Experimentally solved structure available \u00b7 '+esc(e.m3)+' \u00b7 '+e.pdb.map(function(p){ var pid=p.split(';')[0].trim(); return '<a href="https://www.rcsb.org/structure/'+encodeURIComponent(pid)+'" target="_blank" rel="noopener">'+esc(pid)+'</a>'; }).join(', ')+'</span></div>';
  }

  return icard('Sequence map', 'positions along the full translated precursor', svg+legend);
}


function computeProteinProps(seq, realSSBonds){
  seq = (seq||'').toUpperCase().replace(/[^A-Z]/g,'');
  if(!seq.length) return null;
  var comp = aaComposition(seq);
  return {
    length: seq.length,
    mw: molecularWeight(seq),
    pI: isoelectricPoint(seq),
    chargeAt7: chargeAtPH(7.0, comp, seq[0], seq[seq.length-1]),
    gravy: gravyScore(seq),
    aliphatic: aliphaticIndex(seq),
    instability: instabilityIndex(seq),
    ext: extinctionCoefficient(seq, realSSBonds),
    comp: comp
  };
}
function fmtProp(n, d){ return (n===null||n===undefined||isNaN(n)) ? '—' : n.toFixed(d===undefined?1:d); }

function renderPropsTable(props, ssBonds){
  if(!props) return '';
  var stableLbl = props.instability<40 ? 'stable' : 'unstable';
  var stableColor = props.instability<40 ? 'var(--teal)' : 'var(--coral)';
  var extNote = props.ext.assumed ? ' (assumes '+props.ext.cystineCount+' cystine, half of '+props.ext.nCys+' Cys)' : ' ('+props.ext.cystineCount+' disulfide bonds, from UniProt annotation)';
  var rows = [
    ['Molecular weight', fmtProp(props.mw,1)+' Da'],
    ['Length', props.length+' aa'],
    ['Theoretical pI', fmtProp(props.pI,2)],
    ['Net charge (pH 7)', (props.chargeAt7>=0?'+':'')+fmtProp(props.chargeAt7,2)],
    ['GRAVY (hydropathy)', fmtProp(props.gravy,3)+(props.gravy<0?' (hydrophilic)':' (hydrophobic)')],
    ['Aliphatic index', fmtProp(props.aliphatic,1)],
    ['Instability index', fmtProp(props.instability,1)+' — <span style="color:'+stableColor+'">'+stableLbl+'</span>'],
    ['Ext. coefficient (280nm)', fmtProp(props.ext.reduced,0)+' / '+fmtProp(props.ext.oxidized,0)+' M⁻¹cm⁻¹'+
      '<div style="font-size:10px;color:var(--faint);margin-top:1px;">reduced / oxidized'+extNote+'</div>'],
  ];
  if(ssBonds!==null && ssBonds!==undefined){
    rows.splice(2,0,['Disulfide bonds', ssBonds+' (annotated)']);
  }
  return '<div class="props-grid">'+rows.map(function(r){
    return '<div class="prow"><span class="pk">'+r[0]+'</span><span class="pv">'+r[1]+'</span></div>';
  }).join('')+'</div>';
}
