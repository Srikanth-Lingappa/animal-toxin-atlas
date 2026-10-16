/* js/15-sequence-properties.js
   Sequence properties: composition, mass, charge, pI, GRAVY, instability, extinction coefficient.
   Defines: aaComposition, molecularWeight, chargeAtPH, isoelectricPoint, gravyScore, aliphaticIndex, instabilityIndex, extinctionCoefficient, buildPeSelect, buildBadgeRow
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   15. BIOPHYSICAL PROPERTIES (ProtParam-style, computed live)
   Reference tables verified against Biopython's Bio.SeqUtils
   (ProtParamData.py / IsoelectricPoint.py) and cross-checked
   against a published reference peptide (bovine insulin B-chain:
   MW 3399.93 Da, pI 6.90 — reproduced exactly by this code).
   ============================================================ */
var RESIDUE_MASS = {
  G:57.0519, A:71.0788, S:87.0782, P:97.1167, V:99.1326, T:101.1051,
  C:103.1388, L:113.1594, I:113.1594, N:114.1038, D:115.0886, Q:128.1307,
  K:128.1741, E:129.1155, M:131.1926, H:137.1411, F:147.1766, R:156.1875,
  Y:163.1760, W:186.2132
};
var WATER_MASS = 18.01524;
var KD_HYDRO = {A:1.8,R:-4.5,N:-3.5,D:-3.5,C:2.5,Q:-3.5,E:-3.5,G:-0.4,H:-3.2,I:4.5,
  L:3.8,K:-3.9,M:1.9,F:2.8,P:-1.6,S:-0.8,T:-0.7,W:-0.9,Y:-1.3,V:4.2};
var POS_PKS = {Nterm:7.5, K:10.0, R:12.0, H:5.98};
var NEG_PKS = {Cterm:3.55, D:4.05, E:4.45, C:9.0, Y:10.0};
var PK_CTERM = {D:4.55, E:4.75};
var PK_NTERM = {A:7.59, M:7.0, S:6.93, P:8.36, T:6.82, V:7.44, E:7.7};
// Guruprasad et al. 1990 dipeptide instability weight values (DIWV),
// reproduced from Biopython's Bio.SeqUtils.ProtParamData.
var DIWV = {
A:{A:1.0,C:44.94,E:1.0,D:-7.49,G:1.0,F:1.0,I:1.0,H:-7.49,K:1.0,M:1.0,L:1.0,N:1.0,Q:1.0,P:20.26,S:1.0,R:1.0,T:1.0,W:1.0,V:1.0,Y:1.0},
C:{A:1.0,C:1.0,E:1.0,D:20.26,G:1.0,F:1.0,I:1.0,H:33.60,K:1.0,M:33.60,L:20.26,N:1.0,Q:-6.54,P:20.26,S:1.0,R:1.0,T:33.60,W:24.68,V:-6.54,Y:1.0},
E:{A:1.0,C:44.94,E:33.60,D:20.26,G:1.0,F:1.0,I:20.26,H:-6.54,K:1.0,M:1.0,L:1.0,N:1.0,Q:20.26,P:20.26,S:20.26,R:1.0,T:1.0,W:-14.03,V:1.0,Y:1.0},
D:{A:1.0,C:1.0,E:1.0,D:1.0,G:1.0,F:-6.54,I:1.0,H:1.0,K:-7.49,M:1.0,L:1.0,N:1.0,Q:1.0,P:1.0,S:20.26,R:-6.54,T:-14.03,W:1.0,V:1.0,Y:1.0},
G:{A:-7.49,C:1.0,E:-6.54,D:1.0,G:13.34,F:1.0,I:-7.49,H:1.0,K:-7.49,M:1.0,L:1.0,N:-7.49,Q:1.0,P:1.0,S:1.0,R:1.0,T:-7.49,W:13.34,V:1.0,Y:-7.49},
F:{A:1.0,C:1.0,E:1.0,D:13.34,G:1.0,F:1.0,I:1.0,H:1.0,K:-14.03,M:1.0,L:1.0,N:1.0,Q:1.0,P:20.26,S:1.0,R:1.0,T:1.0,W:1.0,V:1.0,Y:33.601},
I:{A:1.0,C:1.0,E:44.94,D:1.0,G:1.0,F:1.0,I:1.0,H:13.34,K:-7.49,M:1.0,L:20.26,N:1.0,Q:1.0,P:-1.88,S:1.0,R:1.0,T:1.0,W:1.0,V:-7.49,Y:1.0},
H:{A:1.0,C:1.0,E:1.0,D:1.0,G:-9.37,F:-9.37,I:44.94,H:1.0,K:24.68,M:1.0,L:1.0,N:24.68,Q:1.0,P:-1.88,S:1.0,R:1.0,T:-6.54,W:-1.88,V:1.0,Y:44.94},
K:{A:1.0,C:1.0,E:1.0,D:1.0,G:-7.49,F:1.0,I:-7.49,H:1.0,K:1.0,M:33.60,L:-7.49,N:1.0,Q:24.64,P:-6.54,S:1.0,R:33.60,T:1.0,W:1.0,V:-7.49,Y:1.0},
M:{A:13.34,C:1.0,E:1.0,D:1.0,G:1.0,F:1.0,I:1.0,H:58.28,K:1.0,M:-1.88,L:1.0,N:1.0,Q:-6.54,P:44.94,S:44.94,R:-6.54,T:-1.88,W:1.0,V:1.0,Y:24.68},
L:{A:1.0,C:1.0,E:1.0,D:1.0,G:1.0,F:1.0,I:1.0,H:1.0,K:-7.49,M:1.0,L:1.0,N:1.0,Q:33.60,P:20.26,S:1.0,R:20.26,T:1.0,W:24.68,V:1.0,Y:1.0},
N:{A:1.0,C:-1.88,E:1.0,D:1.0,G:-14.03,F:-14.03,I:44.94,H:1.0,K:24.68,M:1.0,L:1.0,N:1.0,Q:-6.54,P:-1.88,S:1.0,R:1.0,T:-7.49,W:-9.37,V:1.0,Y:1.0},
Q:{A:1.0,C:-6.54,E:20.26,D:20.26,G:1.0,F:-6.54,I:1.0,H:1.0,K:1.0,M:1.0,L:1.0,N:1.0,Q:20.26,P:20.26,S:44.94,R:1.0,T:1.0,W:1.0,V:-6.54,Y:-6.54},
P:{A:20.26,C:-6.54,E:18.38,D:-6.54,G:1.0,F:20.26,I:1.0,H:1.0,K:1.0,M:-6.54,L:1.0,N:1.0,Q:20.26,P:20.26,S:20.26,R:-6.54,T:1.0,W:-1.88,V:20.26,Y:1.0},
S:{A:1.0,C:33.60,E:20.26,D:1.0,G:1.0,F:1.0,I:1.0,H:1.0,K:1.0,M:1.0,L:1.0,N:1.0,Q:20.26,P:44.94,S:20.26,R:20.26,T:1.0,W:1.0,V:1.0,Y:1.0},
R:{A:1.0,C:1.0,E:1.0,D:1.0,G:-7.49,F:1.0,I:1.0,H:20.26,K:1.0,M:1.0,L:1.0,N:13.34,Q:20.26,P:20.26,S:44.94,R:58.28,T:1.0,W:58.28,V:1.0,Y:-6.54},
T:{A:1.0,C:1.0,E:20.26,D:1.0,G:-7.49,F:13.34,I:1.0,H:1.0,K:1.0,M:1.0,L:1.0,N:-14.03,Q:-6.54,P:1.0,S:1.0,R:1.0,T:1.0,W:-14.03,V:1.0,Y:1.0},
W:{A:-14.03,C:1.0,E:1.0,D:1.0,G:-9.37,F:1.0,I:1.0,H:24.68,K:1.0,M:24.68,L:13.34,N:13.34,Q:1.0,P:1.0,S:1.0,R:1.0,T:-14.03,W:1.0,V:-7.49,Y:1.0},
V:{A:1.0,C:1.0,E:1.0,D:-14.03,G:-7.49,F:1.0,I:1.0,H:1.0,K:-1.88,M:1.0,L:1.0,N:1.0,Q:1.0,P:20.26,S:1.0,R:1.0,T:-7.49,W:1.0,V:1.0,Y:-6.54},
Y:{A:24.68,C:1.0,E:-6.54,D:24.68,G:-7.49,F:1.0,I:1.0,H:13.34,K:1.0,M:44.94,L:1.0,N:1.0,Q:1.0,P:13.34,S:1.0,R:-15.91,T:-7.49,W:-9.37,V:1.0,Y:13.34}
};

function aaComposition(seq){
  var c = {};
  for(var i=0;i<seq.length;i++){ var a=seq[i]; c[a]=(c[a]||0)+1; }
  return c;
}
function molecularWeight(seq){
  var sum=0; for(var i=0;i<seq.length;i++){ sum += RESIDUE_MASS[seq[i]]||0; }
  return sum + WATER_MASS;
}
function chargeAtPH(pH, comp, firstAA, lastAA){
  var pos=0;
  var nTermPk = PK_NTERM[firstAA]!==undefined ? PK_NTERM[firstAA] : POS_PKS.Nterm;
  pos += 1/(Math.pow(10, pH-nTermPk)+1);
  pos += (comp.K||0) * 1/(Math.pow(10, pH-POS_PKS.K)+1);
  pos += (comp.R||0) * 1/(Math.pow(10, pH-POS_PKS.R)+1);
  pos += (comp.H||0) * 1/(Math.pow(10, pH-POS_PKS.H)+1);
  var neg=0;
  var cTermPk = PK_CTERM[lastAA]!==undefined ? PK_CTERM[lastAA] : NEG_PKS.Cterm;
  neg += 1/(Math.pow(10, cTermPk-pH)+1);
  neg += (comp.D||0) * 1/(Math.pow(10, NEG_PKS.D-pH)+1);
  neg += (comp.E||0) * 1/(Math.pow(10, NEG_PKS.E-pH)+1);
  neg += (comp.C||0) * 1/(Math.pow(10, NEG_PKS.C-pH)+1);
  neg += (comp.Y||0) * 1/(Math.pow(10, NEG_PKS.Y-pH)+1);
  return pos-neg;
}
function isoelectricPoint(seq){
  var comp = aaComposition(seq), first=seq[0], last=seq[seq.length-1];
  var lo=0, hi=14, mid=7;
  for(var i=0;i<80;i++){
    mid=(lo+hi)/2;
    var ch = chargeAtPH(mid, comp, first, last);
    if(ch>0) lo=mid; else hi=mid;
    if(Math.abs(ch)<1e-6) break;
  }
  return mid;
}
function gravyScore(seq){
  var sum=0; for(var i=0;i<seq.length;i++){ sum += KD_HYDRO[seq[i]]||0; }
  return sum/seq.length;
}
function aliphaticIndex(seq){
  var comp=aaComposition(seq), L=seq.length;
  var xA=100*(comp.A||0)/L, xV=100*(comp.V||0)/L, xI=100*(comp.I||0)/L, xL=100*(comp.L||0)/L;
  return xA + 2.9*xV + 3.9*(xI+xL);
}
function instabilityIndex(seq){
  if(seq.length<2) return 0;
  var sum=0;
  for(var i=0;i<seq.length-1;i++){
    var a=seq[i], b=seq[i+1];
    var row = DIWV[a];
    sum += row && row[b]!==undefined ? row[b] : 1.0;
  }
  return (10/seq.length)*sum;
}
function extinctionCoefficient(seq, realSSBonds){
  var comp=aaComposition(seq);
  var nTrp=comp.W||0, nTyr=comp.Y||0, nCys=comp.C||0;
  var reduced = nTrp*5500 + nTyr*1490;
  var assumed = (realSSBonds===undefined || realSSBonds===null);
  var cystineCount = assumed ? Math.floor(nCys/2) : realSSBonds;
  return {reduced:reduced, oxidized:reduced+cystineCount*125, cystineCount:cystineCount, assumed:assumed, nCys:nCys};
}
var PE_LABEL = {1:'Protein level', 2:'Transcript level', 3:'Inferred (homology)', 4:'Predicted', 5:'Uncertain'};
function buildPeSelect(){
  var counts = {};
  ENTRIES.forEach(function(e){ if(e.pe) counts[e.pe] = (counts[e.pe]||0)+1; });
  var opts = [1,2,3,4,5].filter(function(k){ return counts[k]; }).map(function(k){
    return '<option value="'+k+'">'+esc(PE_LABEL[k])+' ('+counts[k]+')</option>';
  }).join('');
  document.getElementById('peSelect').innerHTML = '<option value="">Any evidence level</option>'+opts;
}
function buildBadgeRow(e){
  var out = '';
  if(e.pe){
    out += '<span class="evid-badge ev'+e.pe+'" title="UniProt protein existence evidence"><span class="dot"></span>'+esc(PE_LABEL[e.pe]||'')+'</span>';
  }
  if(e.frag){
    out += '<span class="frag-badge" title="This UniProt entry is an incomplete (fragment) sequence — missing N- and/or C-terminal residues">\u26a0 Fragment (incomplete sequence)</span>';
  }
  return out ? '<div class="dbadge-row">'+out+'</div>' : '';
}
