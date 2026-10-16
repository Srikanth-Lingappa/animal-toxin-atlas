/* js/23b-embedding-agreement.js
   Embedding map: ProtT5 vs ProstT5 neighbourhood agreement (k nearest neighbours, Jaccard overlap).
   Defines: embKnn, embEnsureAgreement, meanDist, embAgreeBucket
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ---------- ProtT5 vs ProstT5 neighbourhood agreement ----------
   For every record: its k nearest neighbours in each 2D map; overlap = Jaccard of the two sets.
   Low overlap = the models disagree about what this toxin resembles (sequence vs fold).        */
var EMB_K = 15;
var EMB_AGREE_READY = false;
var EMB_AGREE_RANK = [];           // entries, most divergent first

function embKnn(xs, ys, k){
  var n = xs.length, out = new Uint16Array(n*k), dd = new Float32Array(k), ii = new Int32Array(k);
  for(var a=0;a<n;a++){
    var cnt = 0, ax = xs[a], ay = ys[a];
    for(var b=0;b<n;b++){
      if(b===a) continue;
      var dx = xs[b]-ax, dy = ys[b]-ay, d = dx*dx+dy*dy;
      if(cnt===k && d>=dd[k-1]) continue;
      var j = cnt<k ? cnt++ : k-1;
      while(j>0 && dd[j-1]>d){ dd[j]=dd[j-1]; ii[j]=ii[j-1]; j--; }
      dd[j]=d; ii[j]=b;
    }
    for(var q=0;q<k;q++) out[a*k+q] = ii[q];
  }
  return out;
}

function embEnsureAgreement(){
  if(EMB_AGREE_READY) return;
  var both = ENTRIES.filter(function(e){ return e.t5 && e.prost; }), n = both.length, k = EMB_K;
  var x1 = new Float32Array(n), y1 = new Float32Array(n), x2 = new Float32Array(n), y2 = new Float32Array(n);
  both.forEach(function(e,i){ x1[i]=e.t5[0]; y1[i]=e.t5[1]; x2[i]=e.prost[0]; y2[i]=e.prost[1]; });
  var A = embKnn(x1,y1,k), B = embKnn(x2,y2,k);
  function meanDist(i, nb, off, xs, ys){
    var t = 0; for(var q=0;q<k;q++){ var m = nb[off+q]; t += Math.hypot(xs[m]-xs[i], ys[m]-ys[i]); } return t/k;
  }
  for(var i=0;i<n;i++){
    var off = i*k, inter = 0;
    for(var p=0;p<k;p++){ var v = A[off+p]; for(var q=0;q<k;q++){ if(B[off+q]===v){ inter++; break; } } }
    var e = both[i];
    // tie-break among zero-overlap records: how far apart the "other" model's neighbours really are, relative to local density
    var r1 = meanDist(i,A,off,x2,y2)/(meanDist(i,B,off,x2,y2)+0.05);
    var r2 = meanDist(i,B,off,x1,y1)/(meanDist(i,A,off,x1,y1)+0.05);
    e._ag = {j: inter/(2*k-inter), r: (r1+r2)/2};
  }
  EMB_AGREE_RANK = both.slice().sort(function(a,b){ return (a._ag.j-b._ag.j) || (b._ag.r-a._ag.r); });
  EMB_AGREE_READY = true;
}

var EMB_AGREE_BUCKETS = [
  {min:0.5,  label:'Models agree (≥50% of neighbours shared)', color:'var(--teal)'},
  {min:0.25, label:'Partly (25–50% shared)', color:'var(--amber)'},
  {min:0.1,  label:'Diverge (10–25% shared)', color:'#d1ab6d'},
  {min:-1,   label:'Strongly diverge (<10% shared)', color:'var(--coral)'}
];
function embAgreeBucket(e){
  if(!e._ag) return EMB_AGREE_BUCKETS[3];
  for(var i=0;i<EMB_AGREE_BUCKETS.length;i++) if(e._ag.j >= EMB_AGREE_BUCKETS[i].min) return EMB_AGREE_BUCKETS[i];
  return EMB_AGREE_BUCKETS[3];
}
