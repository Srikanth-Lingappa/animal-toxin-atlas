#!/usr/bin/env python3
"""Independent recomputation of the headline statistics shown in the tool, straight from the dataset.

    python scripts/recompute_stats.py [--data data/animal-toxin-atlas-data.json] [--out stats.json]

Written separately from the page's JavaScript so the two can be compared (tests/smoke.js compares a few of them).
Definitions are in docs/METHODS.md.
"""
import argparse, json, collections, pathlib
_ap = argparse.ArgumentParser()
_ap.add_argument("--data", default=str(pathlib.Path(__file__).resolve().parent.parent / "data" / "animal-toxin-atlas-data.json"))
_ap.add_argument("--out", default="stats.json")
_a = _ap.parse_args()
d=json.load(open(_a.data,encoding="utf-8"));E=d['entries']
def mr(e):
    L=len(e['seq'])
    if not e['ch']:
        cut=sorted([list(x) for x in (e['pro'] or [])]+([list(e['sp'])] if e['sp'] else []))
        res=[];pos=1
        for a,b in cut:
            if a>pos: res.append([pos,a-1])
            if b+1>pos: pos=b+1
        if pos<=L: res.append([pos,L])
        return res or [[1,L]]
    r=sorted([[c[0],c[1]] for c in e['ch']]);out=[r[0][:]]
    for x in r[1:]:
        if x[0]<=out[-1][1]+1: out[-1][1]=max(out[-1][1],x[1])
        else: out.append(x[:])
    return out
mat=lambda e:''.join(e['seq'][a-1:b] for a,b in mr(e))
R={}
# --- disulfides
hist=collections.Counter();pat=collections.defaultdict(int);free=0;tb=0;wd=0
for e in E:
    if not e['ds']: continue
    wd+=1;tb+=len(e['ds']);hist[len(e['ds'])]+=1
    cys=[i+1 for a,b in mr(e) for i in range(a-1,b) if e['seq'][i]=='C']
    if not cys: continue
    rk={p:i+1 for i,p in enumerate(cys)}
    pairs=[]
    for b in e['ds']:
        r1,r2=rk.get(b[0]),rk.get(b[1])
        if not r1 or not r2: continue
        pairs.append((min(r1,r2),max(r1,r2)))
    if not pairs: continue
    pairs.sort();pr=set(x for p in pairs for x in p)
    if len(cys)-len(pr)>0: free+=1
    else: pat[', '.join(f'{a}-{b}' for a,b in pairs)]+=1
R['ds']={'withData':wd,'bonds':tb,'patterns':len(pat),'fullyPairedEntries':sum(pat.values()),'unpaired':free,'top5':sorted(pat.items(),key=lambda kv:-kv[1])[:5],'singletons':sum(1 for v in pat.values() if v==1),'hist':dict(sorted(hist.items()))}
# --- AA comp
AA='ACDEFGHIKLMNPQRSTVWY'
def comp(seqs):
    c=collections.Counter()
    for s in seqs:c.update(s)
    t=sum(c[a] for a in AA);return {a:round(c[a]/t*100,3) for a in AA},t
R['aa_mature'],R['aa_mature_n']=comp(mat(e) for e in E)
R['aa_full'],R['aa_full_n']=comp(e['seq'] for e in E)
R['aa_snake'],_=comp(mat(e) for e in E if e['cat']=='Snake')
# --- cys by group
g=collections.defaultdict(list)
for e in E:
    m=mat(e);g[e['cat']].append(m.count('C')/len(m)*100)
R['cys']={k:round(sum(v)/len(v),3) for k,v in g.items()}
# --- plddt per group (mean of plm), hist, regions
pg=collections.defaultdict(list)
for e in E:
    if 'plm' in e: pg[e['cat']].append(e['plm'])
R['plgroup']={k:round(sum(v)/len(v),3) for k,v in pg.items() if len(v)>=10}
R['plmodels']=sum(1 for e in E if 'plm' in e);R['pl_ge70']=sum(1 for e in E if 'plm' in e and e['plm']>=70)
reg={k:[0,0,0,0] for k in ('sp','pro','mat')}
for e in E:
    if 'pl' not in e: continue
    L=len(e['pl'])
    def add(k,a,b):
        off=e.get('plo',0)
        for i in range(max(a-1,off),min(b,off+L)):
            dg=int(e['pl'][i-off]);reg[k][0 if dg>=9 else 1 if dg>=7 else 2 if dg>=5 else 3]+=1
    if e['sp']: add('sp',*e['sp'])
    for r in (e['pro'] or []): add('pro',*r)
    for r in mr(e): add('mat',*r)
R['regions']=reg
# --- gaps
fam=collections.defaultdict(list)
for e in E:
    if e['fam'] is not None: fam[e['fam']].append(e)
G=[]
for f,l in fam.items():
    if len(l)<12: continue
    solved=sum(1 for e in l if e['pdb']);mod=[e['plm'] for e in l if 'plm' in e and not e['pdb']]
    G.append((d['famList'][f],len(l),solved,len(mod),round(sum(mod)/len(mod),3) if mod else None))
R['gaps_n']=len(G);zero=[x for x in G if x[2]==0];R['gaps_zero']=len(zero)
cand=[x for x in zero if x[3]>=5 and x[4]>=70];R['gaps_cand']=len(cand);R['gaps_cand_records']=sum(x[1] for x in cand)
R['gaps_pdb_share']=round(sum(x[2] for x in G)/sum(x[1] for x in G)*100,2)
R['gaps_first']=sorted(G,key=lambda x:(x[2]/x[1],-x[1]))[:3]
json.dump(R,open(_a.out,'w'),indent=1,default=list)
print(json.dumps({k:R[k] for k in ['ds','gaps_n','gaps_zero','gaps_cand','gaps_cand_records','gaps_pdb_share','plmodels','pl_ge70','regions']},default=list)[:1500])
