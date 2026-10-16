#!/usr/bin/env python3
"""Write the FASTA that is fed to the protein language models: one sequence per record.

Rule (docs/METHODS.md): the mature region = the union of the record's CHAIN and PEPTIDE ranges; when a record has
neither, the sequence minus its signal peptide and propeptides; when nothing is annotated, the full sequence.
Records with several chains or peptides are the concatenation of those ranges.

    python scripts/make_embedding_fasta.py [--out data/embedding_input_mature.fasta]
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def mature_ranges(e):
    L = len(e["seq"])
    if not e["ch"]:
        cuts = sorted([list(x) for x in (e["pro"] or [])] + ([list(e["sp"])] if e["sp"] else []))
        res, pos = [], 1
        for a, b in cuts:
            if a > pos:
                res.append([pos, a - 1])
            if b + 1 > pos:
                pos = b + 1
        if pos <= L:
            res.append([pos, L])
        return res or [[1, L]]
    r = sorted([c[0], c[1]] for c in e["ch"])
    out = [r[0][:]]
    for x in r[1:]:
        if x[0] <= out[-1][1] + 1:
            out[-1][1] = max(out[-1][1], x[1])
        else:
            out.append(x[:])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=ROOT / "data" / "animal-toxin-atlas-data.json")
    ap.add_argument("--out", default=ROOT / "data" / "embedding_input_mature.fasta")
    a = ap.parse_args()
    d = json.loads(pathlib.Path(a.data).read_text(encoding="utf-8"))
    with open(a.out, "w", encoding="utf-8") as fh:
        for e in d["entries"]:
            seq = "".join(e["seq"][s - 1:t] for s, t in mature_ranges(e))
            fh.write(f">{e['id']}|{e['en']} OS={e['sci']}\n")
            for i in range(0, len(seq), 60):
                fh.write(seq[i:i + 60] + "\n")
    print(f"wrote {a.out}: {len(d['entries'])} sequences")


if __name__ == "__main__":
    main()
