#!/usr/bin/env python3
"""Add the external data layers to the dataset, or check that the dataset already contains them.

Layers (all keyed by UniProt accession):
  AlphaFold DB pLDDT   data/afdb_plddt.csv            -> pl, plm, pld
  Partial AF models    data/afdb_partial_models.csv   -> pl, plo, plm, pld  (model covers part of the UniProt sequence)
  ProtT5 / ProstT5     data/umap_prott5.csv, data/umap_prostt5.csv  -> t5, prost
  3D method summary    UniProt export, column "3D"    -> m3  (only with --uniprot)

Field definitions
  pl   one digit per modelled residue: min(9, floor(pLDDT / 10))       (so 9 means pLDDT >= 90)
  plm  mean pLDDT over the modelled residues, 1 decimal place (AlphaFold DB's own mean_plddt)
  pld  % of modelled residues with pLDDT < 50, rounded to an integer
  plo  0-based offset of the model on the UniProt sequence; present only on partial models
  t5, prost   [x, y] UMAP coordinates, 3 decimals

A record gets pl/plm/pld only when the AlphaFold model has the same length as the UniProt sequence, or when
the model sequence aligns to it without gaps (partial models, see docs/METHODS.md).

Usage
  python scripts/apply_layers.py --check [--uniprot export.tsv]     # verify, exit 1 on any difference
  python scripts/apply_layers.py --write [--uniprot export.tsv]     # rewrite data/animal-toxin-atlas-data.json
"""
import argparse, csv, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
csv.field_size_limit(10**9)


def read_csv(path, delimiter=","):
    with open(path, encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh, delimiter=delimiter))


def afdb_layer(records):
    out = {}
    for r in records:
        if r["status"] != "ok":
            continue
        pl = [int(x) for x in r["plddt_per_residue"].split(",")]
        out[r["accession"]] = {
            "pl": "".join(str(min(9, v // 10)) for v in pl),
            "plm": round(float(r["mean_plddt"]), 1),
            "pld": round(float(r["frac_disordered_lt50"]) * 100),
        }
    return out


def partial_layer(records, seqs):
    """Place the pLDDT of a partial model on the UniProt sequence by ungapped local alignment."""
    from Bio import Align
    from Bio.Align import substitution_matrices
    al = Align.PairwiseAligner()
    al.mode = "local"
    al.substitution_matrix = substitution_matrices.load("BLOSUM62")
    al.open_gap_score, al.extend_gap_score = -11, -1
    out = {}
    for r in records:
        if r["status"] != "ok":
            continue
        acc, uni, af = r["accession"], seqs[r["accession"]], r["af_sequence"]
        pl = [int(x) for x in r["plddt_per_residue"].split(",")]
        assert len(pl) == len(af), acc
        aln = al.align(uni, af)[0]
        if len(aln.aligned[0]) != 1 or aln.aligned[1][0][0] != 0:
            raise SystemExit(f"{acc}: model does not align as one ungapped block starting at its first residue")
        (us, ue), (as_, ae) = aln.aligned[0][0], aln.aligned[1][0]
        pv = pl[as_:ae]
        d = {"pl": "".join(str(min(9, v // 10)) for v in pv),
             "plm": round(sum(pv) / len(pv), 1),
             "pld": round(100 * sum(1 for v in pv if v < 50) / len(pv))}
        d["plo"] = int(us)          # present on every partial model, even when it starts at residue 1
        out[acc] = d
    return out


def umap_layer(path):
    return {r["accession"]: [round(float(r["x"]), 3), round(float(r["y"]), 3)] for r in read_csv(path)}


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--check", action="store_true")
    g.add_argument("--write", action="store_true")
    ap.add_argument("--uniprot", help="UniProt TSV export (adds/checks the 3D method summary)")
    a = ap.parse_args()

    path = DATA / "animal-toxin-atlas-data.json"
    d = json.loads(path.read_text(encoding="utf-8"))
    E = {e["id"]: e for e in d["entries"]}
    seqs = {i: e["seq"] for i, e in E.items()}

    main_layer = afdb_layer(read_csv(DATA / "afdb_plddt.csv"))
    # a model that is not the same length as the UniProt sequence is handled by the partial-model layer
    main_layer = {k: v for k, v in main_layer.items() if len(v["pl"]) == len(seqs[k])}
    part_layer = partial_layer(read_csv(DATA / "afdb_partial_models.csv"), seqs)
    t5, prost = umap_layer(DATA / "umap_prott5.csv"), umap_layer(DATA / "umap_prostt5.csv")
    m3 = {}
    if a.uniprot:
        m3 = {r["Entry"]: r["3D"].strip() for r in read_csv(a.uniprot, "\t") if r["3D"].strip()}

    expected = {}
    for acc, e in E.items():
        x = {}
        x.update(main_layer.get(acc, {}))
        x.update(part_layer.get(acc, {}))
        if acc in t5:
            x["t5"], x["prost"] = t5[acc], prost[acc]
        if m3.get(acc):
            x["m3"] = m3[acc]
        expected[acc] = x

    keys = ["pl", "plo", "plm", "pld", "t5", "prost"] + (["m3"] if a.uniprot else [])
    diffs = 0
    for acc, e in E.items():
        for k in keys:
            if e.get(k) != expected[acc].get(k):
                diffs += 1
                if a.check and diffs <= 10:
                    print(f"DIFF {acc} {k}: dataset={str(e.get(k))[:40]} rebuilt={str(expected[acc].get(k))[:40]}")
                if a.write:
                    if k in expected[acc]:
                        e[k] = expected[acc][k]
                    else:
                        e.pop(k, None)
    n_pl = sum(1 for e in E.values() if e.get("pl"))
    print(f"{len(E)} records, {n_pl} with pLDDT, {sum(1 for e in E.values() if 'plo' in e)} partial models, "
          f"{len(t5)} embedded, {len(m3)} with 3D method")
    if a.write:
        path.write_text(json.dumps(d, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
        print(f"updated {path} ({diffs} field changes)")
    else:
        print("OK: dataset matches the layer files" if not diffs else f"{diffs} differences")
        sys.exit(1 if diffs else 0)


if __name__ == "__main__":
    main()
