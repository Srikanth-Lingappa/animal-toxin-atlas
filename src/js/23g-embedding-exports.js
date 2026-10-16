/* js/23g-embedding-exports.js
   Embedding map: CSV, FASTA, SVG and PNG exports.
   Defines: embScope, embFileTag, embExportCsv, embExportFasta, embCss, embBuildSvg, mk, embExportSvg, embExportPng, embWithAgreement, embTopDisagreements
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- exports ---------- */
function embScope(){
  var sel = EMB_SEL.size > 0;
  return {sel:sel, list: sel ? EMB_PTS.filter(function(e){ return EMB_SEL.has(e.id); }) : EMB_PTS};
}
function embFileTag(sc){ return sc.sel ? 'selection-'+sc.list.length : 'all-'+sc.list.length; }

function embExportCsv(){
  var sc = embScope();
  if(!sc.list.length){ toast('Nothing to export'); return; }
  embEnsureAgreement();
  var lines = [['Accession','Entry Name','Protein','Organism','Animal Group','Toxin Class','Protein Family','Length',
    'ProtT5 UMAP x','ProtT5 UMAP y','ProstT5 UMAP x','ProstT5 UMAP y','Neighbour overlap ProtT5 vs ProstT5 (k=15, Jaccard)','Group in current colour mode ('+EMB_MODE_LABEL[EMB_COLOR_MODE]+')'].join(',')];
  sc.list.forEach(function(e){
    lines.push([e.id, e.en, e.pn, e.org, e.cat, e._cls_name||'', e._fam_name||'', e.len||'',
      e.t5[0], e.t5[1], e.prost[0], e.prost[1], e._ag ? e._ag.j.toFixed(3) : '', embGroup(e).label].map(csvEscape).join(','));
  });
  triggerDownload('animal-toxin-atlas-embedding-'+embFileTag(sc)+'.csv', lines.join('\n'));
}
function embExportFasta(){
  var sc = embScope();
  if(!sc.list.length){ toast('Nothing to export'); return; }
  exportFasta(sc.list, 'animal-toxin-atlas-embedding-'+embFileTag(sc)+'.fasta');
}

// standalone SVG/PNG can't use CSS variables, so resolve them against the live theme
function embCss(v){
  if(!v) return '#888';
  var m = String(v).match(/^var\((--[^,)]+)/);
  if(!m) return v;
  var c = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return c || '#888';
}

function embBuildSvg(){
  var rect = embSvgEl().getBoundingClientRect();
  var W = 1600, k = W/rect.width, plotH = Math.round(rect.height*k);
  var s = embScale(rect)*k;
  var ox = (W - EMB_VIEW.w*s)/2, oy = (plotH - EMB_VIEW.h*s)/2;
  var FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  var ink = embCss('var(--ink)'), muted = embCss('var(--muted)'), faint = embCss('var(--faint)');
  var pageBg = embCss('var(--bg)'), plotBg = embCss('var(--bg-elev)'), line = embCss('var(--line-strong)');
  var hasSel = EMB_SEL.size>0, hasMatch = EMB_MATCH.size>0;
  var R = EMB_PIXEL_R*k;

  // legend rows
  var items = embLegendItems(), rows = [[]], cur = 0, maxW = W-80;
  items.forEach(function(it){
    var w = 34 + it.l.length*8.2;
    if(cur + w > maxW && rows[rows.length-1].length){ rows.push([]); cur = 0; }
    rows[rows.length-1].push({it:it, x:cur}); cur += w;
  });
  var HEAD = 78, LEG = rows.length*28 + 24, FOOT = 34, H = HEAD + plotH + LEG + FOOT;

  var dim = [], norm = [], front = [];
  var shownCount = 0;
  EMB_PTS.forEach(function(e){
    var q = e[EMB_MODEL];
    var x = ox + (q[0]-EMB_VIEW.x)*s, y = oy + (q[1]-EMB_VIEW.y)*s;
    if(x < -10 || x > W+10 || y < -10 || y > plotH+10) return;
    shownCount++;
    var col = embCss(embColor(e));
    var isSel = hasSel && EMB_SEL.has(e.id), isMatch = hasMatch && EMB_MATCH.has(e.id);
    var fx = x.toFixed(1), fy = y.toFixed(1);
    var shp = EMB_SHAPES ? embShapeOf(e) : null;
    function mk(r, attrs){
      return shp ? '<path transform="translate('+fx+' '+fy+') scale('+r.toFixed(2)+')" d="'+shp+'" '+attrs+'/>'
                 : '<circle cx="'+fx+'" cy="'+fy+'" r="'+r.toFixed(2)+'" '+attrs+'/>';
    }
    if(isMatch) front.push(mk(R*1.7, 'fill="'+col+'" stroke="'+ink+'" stroke-width="'+(shp ? (1.6/(R*1.7)).toFixed(3) : '1.6')+'"'));
    else if(isSel) front.push(mk(R, 'fill="'+col+'"'));
    else if((hasSel) || (hasMatch)) dim.push(mk(R, 'fill="'+col+'" fill-opacity="0.12"'));
    else norm.push(mk(R, 'fill="'+col+'" fill-opacity="0.82"'));
  });

  var sub = 'Colored by '+EMB_MODE_LABEL[EMB_COLOR_MODE].toLowerCase()+' · '+fmtN(shownCount)+' of '+fmtN(EMB_PTS.length)+' records in view'+
    (hasSel ? ' · '+fmtN(EMB_SEL.size)+' selected' : '')+(EMB_QUERY && hasMatch ? ' · search “'+EMB_QUERY+'”: '+fmtN(EMB_MATCH.size)+' matches' : '');

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" font-family="'+esc(FONT)+'">'+
    '<rect width="'+W+'" height="'+H+'" fill="'+pageBg+'"/>'+
    '<text x="40" y="38" font-size="24" font-weight="600" fill="'+ink+'">Animal Toxin Atlas · '+embModelName()+' embedding (UMAP)</text>'+
    '<text x="40" y="62" font-size="14" fill="'+muted+'">'+esc(sub)+'</text>'+
    '<defs><clipPath id="pc"><rect x="40" y="'+HEAD+'" width="'+(W-80)+'" height="'+plotH+'"/></clipPath></defs>'+
    '<rect x="40" y="'+HEAD+'" width="'+(W-80)+'" height="'+plotH+'" fill="'+plotBg+'" stroke="'+line+'"/>'+
    '<g clip-path="url(#pc)" transform="translate(40,'+HEAD+') scale('+((W-80)/W)+')">'+dim.join('')+norm.join('')+front.join('')+'</g>'+
    rows.map(function(row, ri){
      var y = HEAD + plotH + 28 + ri*28;
      return row.map(function(r){
        return (EMB_SHAPES
          ? '<path transform="translate('+(40+r.x+6)+' '+(y-5)+') scale(6)" d="'+EMB_SHAPE_PATHS[items.indexOf(r.it) % EMB_SHAPE_PATHS.length]+'" fill="'+embCss(r.it.c)+'"/>'
          : '<circle cx="'+(40+r.x+6)+'" cy="'+(y-5)+'" r="6" fill="'+embCss(r.it.c)+'"/>')+
          '<text x="'+(40+r.x+18)+'" y="'+y+'" font-size="14" fill="'+ink+'"'+(r.it.mono?' font-family="ui-monospace,Menlo,Consolas,monospace"':'')+'>'+esc(r.it.l)+'</text>';
      }).join('');
    }).join('')+
    '<text x="40" y="'+(H-12)+'" font-size="11" fill="'+faint+'">UMAP of '+embModelName()+' embeddings of protein sequences · data: UniProtKB/Swiss-Prot Tox-Prot · axes are arbitrary</text>'+
    '</svg>';
  return {svg:svg, W:W, H:H};
}

function embExportSvg(){
  if(!EMB_VIEW){ return; }
  var b = embBuildSvg();
  triggerDownload('animal-toxin-atlas-'+embModelName().toLowerCase()+'-embedding.svg', new Blob([b.svg], {type:'image/svg+xml;charset=utf-8'}));
}
function embExportPng(){
  if(!EMB_VIEW){ return; }
  var b = embBuildSvg();
  var url = URL.createObjectURL(new Blob([b.svg], {type:'image/svg+xml;charset=utf-8'}));
  var img = new Image();
  img.onload = function(){
    var sc = 2, c = document.createElement('canvas');
    c.width = b.W*sc; c.height = b.H*sc;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob(function(blob){
      if(!blob){ toast('PNG export failed'); return; }
      triggerDownload('animal-toxin-atlas-'+embModelName().toLowerCase()+'-embedding.png', blob);
    }, 'image/png');
  };
  img.onerror = function(){ URL.revokeObjectURL(url); toast('PNG export failed'); };
  img.src = url;
}

function embWithAgreement(fn){
  if(EMB_COLOR_MODE!=='agree' && !EMB_FORCE_AGREE || EMB_AGREE_READY){ fn(); return; }
  toast('Comparing the two maps…');
  setTimeout(function(){ embEnsureAgreement(); fn(); }, 30);
}
var EMB_FORCE_AGREE = false;

function embTopDisagreements(n){
  var go = function(){
    EMB_COLOR_MODE = 'agree';
    document.querySelectorAll('#embColorMode button').forEach(function(x){ x.classList.toggle('active', x.getAttribute('data-m')==='agree'); });
    var cnt = (n==='zero') ? EMB_AGREE_RANK.filter(function(e){ return e._ag.j===0; }).length : n;
    EMB_SEL = new Set(EMB_AGREE_RANK.slice(0,cnt).map(function(e){ return e.id; }));
    EMB_TOP_DIS = true;
    renderEmbPlot();
  };
  if(EMB_AGREE_READY){ go(); return; }
  toast('Comparing the two maps…');
  setTimeout(function(){ embEnsureAgreement(); go(); }, 30);
}
var EMB_TOP_DIS = false, EMB_TOP_N = null;
