#!/usr/bin/env python3
"""Compare every record in the dataset with the original UniProt TSV export, field by field.

    python scripts/verify_against_uniprot.py path/to/uniprotkb_export.tsv [--data data/animal-toxin-atlas-data.json]

Exit status is 0 when everything matches, 1 otherwise. Fields checked: accession set, sequence, length, entry
name, protein names, gene names, organism, EC number, protein existence, fragment flag, PDB IDs, PubMed IDs,
AlphaFold flag, InterPro entries, keywords, protein family, signal peptide, propeptides, mature chains/peptides,
disulfide bonds, glycosylation, modified residues, observed mass, and the text fields (function, tissue
specificity, subcellular location, toxic dose, PTM, GO molecular function).

The derived animal group is also recomputed from the export's NCBI lineage.

Documented differences that are NOT counted as errors (see docs/METHODS.md):
  * features with an unknown end position ('?', for example SIGNAL <1..?) are not stored;
  * interchain disulfide bonds that name a single cysteine are not stored as bonds;
  * evidence tags ({ECO:...}) are removed from the text fields (compared with them removed);
  * the observed mass is stored only for records whose mass-spectrometry entry is not tied to one named chain.
"""
import argparse, collections, csv, json, pathlib, re, sys

csv.field_size_limit(10**9)
ROOT = pathlib.Path(__file__).resolve().parent.parent

# Animal group: the first rule whose taxon appears in the record's NCBI lineage wins (order matters:
# Serpentes before Squamata, Conidae before Gastropoda). Anything else is "Other/Unclassified".
GROUP_RULES = [
    ("Serpentes", "Snake"), ("Araneae", "Spider"), ("Scorpiones", "Scorpion"), ("Conidae", "Cone snail"),
    ("Gastropoda", "Snail (other)"), ("Hymenoptera", "Hymenoptera (bee/wasp/ant)"),
    ("Cnidaria", "Cnidarian (jellyfish/anemone/hydra/coral)"), ("Chilopoda", "Centipede"),
    ("Amphibia", "Frog/Toad (amphibian)"), ("Hemiptera", "Assassin bug/True bug"), ("Lepidoptera", "Caterpillar/Moth"),
    ("Ixodida", "Tick/Mite"), ("Acari", "Tick/Mite"), ("Squamata", "Lizard"), ("Actinopterygii", "Fish (venomous)"),
    ("Chondrichthyes", "Fish (venomous)"), ("Mammalia", "Mammal (venomous)"),
]


def animal_group(lineage):
    taxa = {x.split(" (")[0].strip() for x in lineage.split(",")}
    for taxon, group in GROUP_RULES:
        if taxon in taxa:
            return group
    return "Other/Unclassified"


PE = {"Evidence at protein level": 1, "Evidence at transcript level": 2, "Inferred from homology": 3,
      "Predicted": 4, "Uncertain": 5}


def bound(x):
    return int(re.sub(r"[<>?]", "", x))


def features(txt, typ):
    """[(start, end, note, known)] for each feature of one type in a UniProt feature column."""
    out = []
    for part in re.split(r"(?:^|; )" + typ + " ", txt or ""):
        m = re.match(r"([<>?]?\d+|\?)(?:\.\.([<>?]?\d+|\?))?", part)
        if not m:
            continue
        a, b = m.group(1), m.group(2) or m.group(1)
        note = re.search(r'/note="([^"]*)"', part)
        known = "?" not in (a, b)
        out.append((bound(a) if known else None, bound(b) if known else None, note.group(1) if note else "", known))
    return out


def text_key(t):
    """Text with evidence tags, section prefixes and punctuation/spacing removed, for comparison."""
    t = re.sub(r"\{[^}]*\}", "", t or "")
    t = re.sub(r"(FUNCTION|TISSUE SPECIFICITY|SUBCELLULAR LOCATION|TOXIC DOSE|PTM):", "", t)
    return re.sub(r"[^A-Za-z0-9]", "", t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tsv")
    ap.add_argument("--data", default=ROOT / "data" / "animal-toxin-atlas-data.json")
    a = ap.parse_args()

    with open(a.tsv, encoding="utf-8", newline="") as fh:
        raw = {r["Entry"]: r for r in csv.DictReader(fh, delimiter="\t")}
    d = json.load(open(a.data, encoding="utf-8"))
    E, kw, fam, ipr = d["entries"], d["kwList"], d["famList"], d["iprList"]

    bad, examples = collections.Counter(), collections.defaultdict(list)

    def check(field, e, ok, info=""):
        if not ok:
            bad[field] += 1
            if len(examples[field]) < 3:
                examples[field].append((e["id"], str(info)[:120]))

    ids = [e["id"] for e in E]
    if set(ids) != set(raw) or len(ids) != len(set(ids)):
        bad["accession set"] += 1

    for e in E:
        r = raw.get(e["id"])
        if r is None:
            continue
        check("sequence", e, e["seq"] == r["Sequence"])
        check("length", e, e["len"] == int(r["Length"]) == len(e["seq"]))
        check("entry name", e, e["en"] == r["Entry Name"])
        check("protein names", e, e["pn"] == r["Protein names"])
        check("gene names", e, (e["gn"] or "") == (r["Gene Names"] or ""))
        check("organism", e, e["org"] == r["Organism"])
        check("EC number", e, (e["ec"] or "") == (r["EC number"] or ""))
        check("protein existence", e, e["pe"] == PE.get(r["Protein existence"]))
        check("fragment", e, bool(e["frag"]) == bool(r["Fragment"].strip()))
        check("PDB", e, sorted(e["pdb"] or []) == sorted(x for x in r["PDB"].split(";") if x))
        pm = []
        for x in r["PubMed ID"].split("; "):
            if x and x not in pm:
                pm.append(x)
        check("animal group (derived)", e, e["cat"] == animal_group(r["Taxonomic lineage"]))
        check("PubMed", e, (e["pm"] or []) == pm)
        check("AlphaFold flag", e, bool(e["af"]) == bool(r["AlphaFoldDB"].strip()))
        check("InterPro", e, sorted(ipr[i] for i in e["ipr"]) == sorted(x for x in r["InterPro"].split(";") if x))
        check("keywords", e, sorted(kw[i] for i in e["kw"]) == sorted(x for x in r["Keywords"].split(";") if x))
        check("protein family", e, (fam[e["fam"]] if e["fam"] is not None else "") == (r["Protein families"] or ""))

        sp = [f for f in features(r["Signal peptide"], "SIGNAL") if f[3]][:1]
        check("signal peptide", e, (e["sp"] or []) == ([sp[0][0], sp[0][1]] if sp else []))
        pro = [[f[0], f[1]] for f in features(r["Propeptide"], "PROPEP") if f[3]]
        check("propeptide", e, [list(x) for x in (e["pro"] or [])] == pro)
        ch = sorted([f[0], f[1], f[2]] for f in features(r["Chain"], "CHAIN") + features(r["Peptide"], "PEPTIDE") if f[3])
        check("mature chain", e, sorted(list(c) for c in (e["ch"] or [])) == ch)
        ds = sorted([f[0], f[1]] for f in features(r["Disulfide bond"], "DISULFID") if f[3] and f[0] != f[1])
        check("disulfide bonds", e, sorted(list(x) for x in (e["ds"] or [])) == ds)
        gly = sorted([f[0], f[2]] for f in features(r["Glycosylation"], "CARBOHYD") if f[3])
        mod = sorted([f[0], f[2]] for f in features(r["Modified residue"], "MOD_RES") if f[3])
        check("modified residues", e, sorted(list(x) for x in (e["mod"] or [])) == mod)
        check("glycosylation", e, sorted(list(x) for x in (e["gly"] or [])) == gly)

        for field, col in (("function", "Function [CC]"), ("tissue specificity", "Tissue specificity"),
                           ("subcellular location", "Subcellular location [CC]"), ("toxic dose", "Toxic dose"),
                           ("PTM", "Post-translational modification")):
            key = {"function": "fn", "tissue specificity": "ts", "subcellular location": "sc",
                   "toxic dose": "td", "PTM": "ptm"}[field]
            check(field, e, text_key(r[col]) == text_key(e[key] or ""))
        check("GO molecular function", e, (e["mf"] or "") == (r["Gene Ontology (molecular function)"] or ""))

        masses = [float(x) for x in re.findall(r"Mass=([\d.]+)", r["Mass spectrometry"] or "")]
        tied = "MASS SPECTROMETRY: [" in (r["Mass spectrometry"] or "")
        check("observed mass", e, (e["ms"] is None and (not masses or tied)) or
              (e["ms"] is not None and any(abs(e["ms"]["mass"] - m) < 1e-6 for m in masses)))

    print(f"{len(E)} records compared with {a.tsv}")
    for f in sorted(bad):
        print(f"MISMATCH {f}: {bad[f]}  e.g. {examples[f]}")
    print("OK: every checked field matches the UniProt export" if not bad else "FAILED")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
