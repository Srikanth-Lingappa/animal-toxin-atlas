/* js/07-filter-sort-paginate.js
   Applies the filters, sort order and paging to the record list (computeFiltered).
   Defines: computeFiltered
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   7. FILTER + SORT + PAGINATE
   ============================================================ */
function computeFiltered(){
  var q = state.q.trim().toLowerCase();
  var terms = q ? q.split(/\s+/).filter(Boolean) : [];
  var out = ENTRIES.filter(function(e){
    if(state.cats.size && !state.cats.has(e.cat)) return false;
    if(state.fam !== '' && String(e.fam) !== state.fam) return false;
    if(state.cls !== '' && String(e.cls) !== state.cls) return false;
    if(state.ipr !== '' && (!e.ipr || e.ipr.indexOf(parseInt(state.ipr,10)) === -1)) return false;
    if(state.mf !== '' && (!e.mfi || e.mfi.indexOf(parseInt(state.mf,10)) === -1)) return false;
    if(state.has3d && !(e.pdb && e.pdb.length)) return false;
    if(state.hasEc && !(e.ec && e.ec.length)) return false;
    if(state.hasWho && !e.who) return false;
    if(state.excludeFrag && e.frag) return false;
    if(state.pe !== '' && String(e.pe) !== state.pe) return false;
    if(state.lenMin !== null && (e.len === null || e.len < state.lenMin)) return false;
    if(state.lenMax !== null && (e.len === null || e.len > state.lenMax)) return false;
    if(state.kws.size){
      for(var kwi of state.kws){ if(e.kw.indexOf(kwi) === -1) return false; }
    }
    if(terms.length){
      for(var t of terms){ if(e._s.indexOf(t) === -1) return false; }
    }
    return true;
  });

  switch(state.sort){
    case 'name':
      out.sort(function(a,b){ return (a.pn||'').localeCompare(b.pn||''); });
      break;
    case 'len_desc':
      out.sort(function(a,b){ return (b.len||0)-(a.len||0); });
      break;
    case 'len_asc':
      out.sort(function(a,b){ return (a.len||0)-(b.len||0); });
      break;
    case 'cat':
      out.sort(function(a,b){
        var ai = CAT_ORDER.indexOf(a.cat), bi = CAT_ORDER.indexOf(b.cat);
        if(ai !== bi) return ai-bi;
        return (a.org||'').localeCompare(b.org||'');
      });
      break;
    default: // org
      out.sort(function(a,b){ return (a.org||'').localeCompare(b.org||''); });
  }
  return out;
}
