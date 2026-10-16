/* js/10-downloads.js
   CSV and FASTA exports and the file-download helpers.
   Defines: mimeFor, fallbackDownload, csvEscape, exportCsv, exportFasta
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   10. DOWNLOADS (CSV / FASTA export)
   ============================================================ */
async function getDownloadsCap(){
  try{
    if(!window.claude || typeof window.claude.use !== 'function') return null;
    return await window.claude.use('downloads');
  }catch(e){ return null; }
}

function mimeFor(filename){
  var x = (filename.match(/\.([^.]+)$/)||[])[1];
  return {csv:'text/csv', fasta:'text/x-fasta', bib:'application/x-bibtex', svg:'image/svg+xml', png:'image/png'}[x] || 'text/plain';
}

function fallbackDownload(filename, content){
  try{
    var blob = (content instanceof Blob) ? content : new Blob([content], {type:mimeFor(filename)+';charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
    toast('Downloading '+filename+'…');
  }catch(e){
    toast('Download unavailable in this view');
  }
}

async function triggerDownload(filename, content){
  var downloads = await getDownloadsCap();
  if(!downloads){ fallbackDownload(filename, content); return; }
  try{
    var blob = (content instanceof Blob) ? content : new Blob([content], {type:mimeFor(filename)+';charset=utf-8'});
    await downloads.save({filename: filename, data: blob});
    toast('Saved '+filename);
  }catch(err){
    var code = err && err.code;
    if(code === 'declined'){ /* user said no, do nothing */ }
    else if(code === 'rejected_extension' || code === 'extension_not_enabled'){
      fallbackDownload(filename, content);
    } else {
      fallbackDownload(filename, content);
    }
  }
}

function csvEscape(v){
  v = (v===undefined||v===null) ? '' : String(v);
  if(/[",\n]/.test(v)) return '"'+v.replace(/"/g,'""')+'"';
  return v;
}

function exportCsv(list, filename){
  list = list || filteredCache || ENTRIES;
  filename = filename || 'animal-toxin-atlas-export.csv';
  if(!list.length){ toast('Nothing to export'); return; }
  var header = ['Accession','Entry Name','Protein Names','Gene Names','Organism','Category',
    'Toxin Class','Length','Protein Family','Keywords','EC Number','PDB IDs','PubMed IDs'];
  var lines = [header.join(',')];
  list.forEach(function(e){
    var row = [
      e.id, e.en, e.pn, e.gn, e.org, e.cat, e._cls_name||'', e.len||'', e._fam_name||'',
      e.kw.map(function(i){return DATA.kwList[i];}).join('; '),
      e.ec||'', (e.pdb||[]).join('; '), (e.pm||[]).join('; ')
    ].map(csvEscape);
    lines.push(row.join(','));
  });
  triggerDownload(filename, lines.join('\n'));
}

function exportFasta(list, filename){
  list = (list || filteredCache || ENTRIES).filter(function(e){ return e.seq; });
  filename = filename || 'animal-toxin-atlas-sequences.fasta';
  if(!list.length){ toast('No sequences to export'); return; }
  var parts = list.map(function(e){
    return '>sp|'+e.id+'|'+e.en+' '+(e.pn||'').split(' (')[0]+' OS='+e.sci+'\n'+wrapSeqRaw(e.seq,60);
  });
  triggerDownload(filename, parts.join('\n')+'\n');
}
