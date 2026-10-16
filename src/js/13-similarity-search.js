/* js/13-similarity-search.js
   Similarity Search: Smith-Waterman local alignment (BLOSUM62, affine gaps) against every record.
   Defines: aaScore, swScoreOnly, swAlign, cleanSequence, runSimilaritySearch, step, finishSearch, tryExampleSequence, clearSimilaritySearch
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   13. SIMILARITY SEARCH — Smith-Waterman local alignment
   ============================================================ */
var AA_ALPHA = "ARNDCQEGHILKMFPSTWYVBZX*";
var AA_IDX = new Int8Array(128);
(function(){
  var xi = AA_ALPHA.indexOf('X');
  for(var c=0;c<128;c++) AA_IDX[c] = xi;
  for(var k=0;k<AA_ALPHA.length;k++) AA_IDX[AA_ALPHA.charCodeAt(k)] = k;
})();
var BLOSUM62 = [
[ 4,-1,-2,-2, 0,-1,-1, 0,-2,-1,-1,-1,-1,-2,-1, 1, 0,-3,-2, 0,-2,-1, 0,-4],
[-1, 5, 0,-2,-3, 1, 0,-2, 0,-3,-2, 2,-1,-3,-2,-1,-1,-3,-2,-3,-1, 0,-1,-4],
[-2, 0, 6, 1,-3, 0, 0, 0, 1,-3,-3, 0,-2,-3,-2, 1, 0,-4,-2,-3, 3, 0,-1,-4],
[-2,-2, 1, 6,-3, 0, 2,-1,-1,-3,-4,-1,-3,-3,-1, 0,-1,-4,-3,-3, 4, 1,-1,-4],
[ 0,-3,-3,-3, 9,-3,-4,-3,-3,-1,-1,-3,-1,-2,-3,-1,-1,-2,-2,-1,-3,-3,-2,-4],
[-1, 1, 0, 0,-3, 5, 2,-2, 0,-3,-2, 1, 0,-3,-1, 0,-1,-2,-1,-2, 0, 3,-1,-4],
[-1, 0, 0, 2,-4, 2, 5,-2, 0,-3,-3, 1,-2,-3,-1, 0,-1,-3,-2,-2, 1, 4,-1,-4],
[ 0,-2, 0,-1,-3,-2,-2, 6,-2,-4,-4,-2,-3,-3,-2, 0,-2,-2,-3,-3,-1,-2,-1,-4],
[-2, 0, 1,-1,-3, 0, 0,-2, 8,-3,-3,-1,-2,-1,-2,-1,-2,-2, 2,-3, 0, 0,-1,-4],
[-1,-3,-3,-3,-1,-3,-3,-4,-3, 4, 2,-3, 1, 0,-3,-2,-1,-3,-1, 3,-3,-3,-1,-4],
[-1,-2,-3,-4,-1,-2,-3,-4,-3, 2, 4,-2, 2, 0,-3,-2,-1,-2,-1, 1,-4,-3,-1,-4],
[-1, 2, 0,-1,-3, 1, 1,-2,-1,-3,-2, 5,-1,-3,-1, 0,-1,-3,-2,-2, 0, 1,-1,-4],
[-1,-1,-2,-3,-1, 0,-2,-3,-2, 1, 2,-1, 5, 0,-2,-1,-1,-1,-1, 1,-3,-1,-1,-4],
[-2,-3,-3,-3,-2,-3,-3,-3,-1, 0, 0,-3, 0, 6,-4,-2,-2, 1, 3,-1,-3,-3,-1,-4],
[-1,-2,-2,-1,-3,-1,-1,-2,-2,-3,-3,-1,-2,-4, 7,-1,-1,-4,-3,-2,-2,-1,-2,-4],
[ 1,-1, 1, 0,-1, 0, 0, 0,-1,-2,-2, 0,-1,-2,-1, 4, 1,-3,-2,-2, 0, 0, 0,-4],
[ 0,-1, 0,-1,-1,-1,-1,-2,-2,-1,-1,-1,-1,-2,-1, 1, 5,-2,-2, 0,-1,-1, 0,-4],
[-3,-3,-4,-4,-2,-2,-3,-2,-2,-3,-2,-3,-1, 1,-4,-3,-2,11, 2,-3,-4,-3,-2,-4],
[-2,-2,-2,-3,-2,-1,-2,-3, 2,-1,-1,-2,-1, 3,-3,-2,-2, 2, 7,-1,-3,-2,-1,-4],
[ 0,-3,-3,-3,-1,-2,-2,-3,-3, 3, 1,-2, 1,-1,-2,-2, 0,-3,-1, 4,-3,-2,-1,-4],
[-2,-1, 3, 4,-3, 0, 1,-1, 0,-3,-4, 0,-3,-3,-2, 0,-1,-4,-3,-3, 4, 1,-1,-4],
[-1, 0, 0, 1,-3, 3, 4,-2, 0,-3,-3, 1,-1,-3,-1, 0,-1,-3,-2,-2, 1, 4,-1,-4],
[ 0,-1,-1,-1,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-2, 0, 0,-2,-1,-1,-1,-1,-1,-4],
[-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4, 1]
];
function aaScore(ci,cj){ return BLOSUM62[AA_IDX[ci]][AA_IDX[cj]]; }
var GAP_OPEN = 11, GAP_EXT = 1, NEG_INF = -1e9;

// Score-only Gotoh Smith-Waterman, O(subjectLen) memory. Returns max local-alignment score.
function swScoreOnly(qcodes, subjCodes){
  var n = qcodes.length, m = subjCodes.length;
  var Hprev = new Float64Array(m+1);
  var Fprev = new Float64Array(m+1); Fprev.fill(NEG_INF);
  var Hcur = new Float64Array(m+1);
  var Fcur = new Float64Array(m+1);
  var maxScore = 0;
  for(var i=0;i<n;i++){
    var qc = qcodes[i];
    Hcur[0]=0;
    var Eleft = NEG_INF;
    for(var j=1;j<=m;j++){
      var diag = Hprev[j-1] + BLOSUM62[qc][subjCodes[j-1]];
      var fval = Hprev[j]-GAP_OPEN; var f2 = Fprev[j]-GAP_EXT; if(f2>fval) fval=f2;
      var eval_ = Hcur[j-1]-GAP_OPEN; var e2 = Eleft-GAP_EXT; if(e2>eval_) eval_=e2;
      var h=0;
      if(diag>h) h=diag;
      if(fval>h) h=fval;
      if(eval_>h) h=eval_;
      Hcur[j]=h; Fcur[j]=fval; Eleft=eval_;
      if(h>maxScore) maxScore=h;
    }
    var t=Hprev; Hprev=Hcur; Hcur=t;
    t=Fprev; Fprev=Fcur; Fcur=t;
  }
  return maxScore;
}

// Full traceback version for rendering an alignment (only run on the handful of top hits).
function swAlign(query, subj){
  var n = query.length, m = subj.length, W = m+1;
  var qcodes = new Uint8Array(n); for(var i=0;i<n;i++) qcodes[i]=AA_IDX[query.charCodeAt(i)];
  var scodes = new Uint8Array(m); for(var j=0;j<m;j++) scodes[j]=AA_IDX[subj.charCodeAt(j)];
  var H = new Float64Array((n+1)*W);
  var F = new Float64Array((n+1)*W); F.fill(NEG_INF);
  var E = new Float64Array((n+1)*W); E.fill(NEG_INF);
  var PTR = new Uint8Array((n+1)*W);
  var maxScore=0, maxI=0, maxJ=0;
  for(var i=1;i<=n;i++){
    var qc = qcodes[i-1], rowOff=i*W, prevOff=(i-1)*W;
    for(var j=1;j<=m;j++){
      var diag = H[prevOff+j-1] + BLOSUM62[qc][scodes[j-1]];
      var fval = H[prevOff+j]-GAP_OPEN; var f2=F[prevOff+j]-GAP_EXT; if(f2>fval) fval=f2;
      var eval_ = H[rowOff+j-1]-GAP_OPEN; var e2=E[rowOff+j-1]-GAP_EXT; if(e2>eval_) eval_=e2;
      F[rowOff+j]=fval; E[rowOff+j]=eval_;
      var h=0, ptr=0;
      if(diag>h){ h=diag; ptr=1; }
      if(fval>h){ h=fval; ptr=2; }
      if(eval_>h){ h=eval_; ptr=3; }
      H[rowOff+j]=h; PTR[rowOff+j]=ptr;
      if(h>maxScore){ maxScore=h; maxI=i; maxJ=j; }
    }
  }
  var qa=[], sa=[], mid=[];
  var i=maxI, j=maxJ;
  while(i>0 && j>0 && H[i*W+j]>0){
    var p = PTR[i*W+j];
    if(p===1){
      var qch=query[i-1], sch=subj[j-1];
      qa.push(qch); sa.push(sch);
      mid.push(qch===sch ? '|' : (BLOSUM62[qcodes[i-1]][scodes[j-1]]>0 ? ':' : '.'));
      i--; j--;
    } else if(p===2){ qa.push(query[i-1]); sa.push('-'); mid.push(' '); i--; }
    else if(p===3){ qa.push('-'); sa.push(subj[j-1]); mid.push(' '); j--; }
    else break;
  }
  qa.reverse(); sa.reverse(); mid.reverse();
  var identical = 0; for(var k2=0;k2<mid.length;k2++){ if(mid[k2]==='|') identical++; }
  return {
    score: maxScore, identity: mid.length ? identical/mid.length : 0, alnLen: mid.length,
    qStart: i+1, qEnd: maxI, sStart: j+1, sEnd: maxJ,
    qAln: qa.join(''), sAln: sa.join(''), midAln: mid.join('')
  };
}

var VALID_AA = /^[ARNDCQEGHILKMFPSTWYVBZXU*]+$/i;
var searchRunning = false;

function cleanSequence(raw){
  var lines = raw.split(/\r?\n/).filter(function(l){ return l.trim() && l[0]!=='>'; });
  var seq = lines.join('').replace(/[^A-Za-z]/g,'').toUpperCase();
  return seq;
}

function runSimilaritySearch(){
  if(searchRunning) return;
  var raw = document.getElementById('seqInput').value;
  var seq = cleanSequence(raw);
  var errEl = document.getElementById('seqError');
  errEl.textContent = '';
  if(seq.length < 4){ errEl.textContent = 'Enter a sequence of at least 4 residues.'; return; }
  if(seq.length > 2000){ errEl.textContent = 'That is a long sequence — please keep it under 2,000 residues.'; return; }
  if(!VALID_AA.test(seq)){ errEl.textContent = 'Sequence contains characters outside the standard amino-acid alphabet.'; return; }

  searchRunning = true;
  document.getElementById('runSearchBtn').disabled = true;
  document.getElementById('seqResultsWrap').innerHTML = '';
  var progWrap = document.getElementById('seqProgress');
  progWrap.classList.add('show');
  var fill = document.getElementById('seqProgressFill');
  var text = document.getElementById('seqProgressText');

  var qcodes = new Uint8Array(seq.length);
  for(var i=0;i<seq.length;i++) qcodes[i] = AA_IDX[seq.charCodeAt(i)];

  var pool = ENTRIES.filter(function(e){ return e.seq && e.seq.length; });
  var scores = new Array(pool.length);
  var CHUNK = 400;
  var idx = 0;
  var t0 = performance.now();

  function step(){
    var end = Math.min(idx+CHUNK, pool.length);
    for(; idx<end; idx++){
      var subj = pool[idx].seq;
      var scodes = new Uint8Array(subj.length);
      for(var j=0;j<subj.length;j++) scodes[j] = AA_IDX[subj.charCodeAt(j)];
      scores[idx] = swScoreOnly(qcodes, scodes);
    }
    var pct = Math.round(idx/pool.length*100);
    fill.style.width = pct+'%';
    text.textContent = 'Aligning against '+fmtN(pool.length)+' toxins… '+pct+'%';
    if(idx < pool.length){
      setTimeout(step, 0);
    } else {
      finishSearch(seq, pool, scores, performance.now()-t0);
    }
  }
  setTimeout(step, 0);
}

function finishSearch(seq, pool, scores, elapsedMs){
  searchRunning = false;
  document.getElementById('runSearchBtn').disabled = false;
  document.getElementById('seqProgress').classList.remove('show');

  var order = pool.map(function(_,i){ return i; }).sort(function(a,b){ return scores[b]-scores[a]; });
  var top = order.slice(0, 30);

  var html = '<div style="font-family:var(--font-ui);font-size:11.5px;color:var(--muted);margin-bottom:12px;">'+
    'query length '+seq.length+' aa · compared against '+fmtN(pool.length)+' sequences in '+(elapsedMs/1000).toFixed(1)+'s · showing top '+top.length+' hits'+
    '</div>';
  html += '<div id="hitList"></div>';
  document.getElementById('seqResultsWrap').innerHTML = html;

  var hitList = document.getElementById('hitList');
  top.forEach(function(poolIdx, rank){
    var e = pool[poolIdx];
    var score = scores[poolIdx];
    var row = document.createElement('div');
    row.className = 'hit-row';
    var pname = (e.pn||e.en).split(' (')[0];
    row.innerHTML =
      '<div class="hit-head" data-idx="'+poolIdx+'">'+
        '<div class="hit-rank">#'+(rank+1)+'</div>'+
        '<div><div class="hit-name">'+esc(pname)+'</div><div class="hit-org">'+esc(e.org.split(' (')[0])+' · '+esc(e.id)+'</div></div>'+
        '<div class="hit-score">score <b>'+score.toFixed(0)+'</b></div>'+
        '<div class="hit-ident" id="ident-'+poolIdx+'">…</div>'+
        '<div class="hit-cat" style="color:'+catColorVar(e.cat)+'">'+esc(e.cat.split(' (')[0])+'</div>'+
      '</div>'+
      '<div class="hit-align" id="aln-'+poolIdx+'"></div>';
    hitList.appendChild(row);

    row.querySelector('.hit-head').addEventListener('click', function(){
      var alnEl = document.getElementById('aln-'+poolIdx);
      var isOpen = alnEl.classList.contains('open');
      if(isOpen){ alnEl.classList.remove('open'); return; }
      if(!alnEl.dataset.built){
        var res = swAlign(seq, e.seq);
        document.getElementById('ident-'+poolIdx).innerHTML = '<b>'+(res.identity*100).toFixed(0)+'%</b> id.';
        var lines = [];
        var W=60;
        for(var p=0;p<res.qAln.length;p+=W){
          lines.push('Q  '+res.qAln.slice(p,p+W));
          lines.push('   '+res.midAln.slice(p,p+W));
          lines.push('S  '+res.sAln.slice(p,p+W));
          lines.push('');
        }
        alnEl.innerHTML = '<div class="aln-block">'+esc(lines.join('\n').trim())+'</div>'+
          '<div class="aln-actions">alignment '+res.alnLen+' aa · query '+res.qStart+'–'+res.qEnd+' · subject '+res.sStart+'–'+res.sEnd+
          ' &nbsp;·&nbsp; <a data-open="'+esc(e.id)+'">view full record ↗</a></div>';
        alnEl.querySelector('[data-open]').addEventListener('click', function(ev){
          ev.preventDefault(); openDetail(e.id);
        });
        alnEl.dataset.built = '1';
      }
      alnEl.classList.add('open');
    });

    // fill in identity quickly using a light estimate first (exact one computed lazily on expand)
  });

  // compute identities for display without requiring expand (cheap enough for 30 hits)
  top.forEach(function(poolIdx){
    var e = pool[poolIdx];
    var res = swAlign(seq, e.seq);
    var el = document.getElementById('ident-'+poolIdx);
    if(el) el.innerHTML = '<b>'+(res.identity*100).toFixed(0)+'%</b> id.';
  });
}

function tryExampleSequence(){
  var pick = null;
  for(var i=0;i<ENTRIES.length;i++){ if(ENTRIES[i].id==='Q90495'){ pick = ENTRIES[i]; break; } }
  if(!pick) return;
  document.getElementById('seqInput').value = pick.seq;
  document.getElementById('seqMeta').textContent = '';
}

function clearSimilaritySearch(){
  searchRunning = false;
  document.getElementById('seqInput').value = '';
  document.getElementById('seqMeta').textContent = '';
  document.getElementById('seqError').textContent = '';
  document.getElementById('seqResultsWrap').innerHTML = '';
  document.getElementById('seqProgress').classList.remove('show');
  document.getElementById('seqProgressFill').style.width = '0%';
  document.getElementById('runSearchBtn').disabled = false;
  document.getElementById('seqInput').focus();
}
