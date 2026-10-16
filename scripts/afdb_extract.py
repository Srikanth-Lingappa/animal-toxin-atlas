# Extract AlphaFold DB confidence (pLDDT) for the Animal Toxin Atlas accessions.
# Colab: upload afdb-accessions.txt, then run this cell. Output: afdb_plddt.csv
# Resumable: re-running skips accessions already in the CSV.
import csv, os, re, time, requests  # no installs needed in Colab
from concurrent.futures import ThreadPoolExecutor

ACC_FILE = "afdb-accessions.txt"
OUT = "afdb_plddt.csv"
API = "https://alphafold.ebi.ac.uk/api/prediction/{}"
FIELDS = ["accession", "status", "afdb_entry", "model_version", "uniprot_start", "uniprot_end",
          "n_residues", "mean_plddt_api", "mean_plddt", "frac_very_high", "frac_confident",
          "frac_low", "frac_very_low", "frac_disordered_lt50", "plddt_per_residue"]

def parse_plddt(pdb_text):
    """pLDDT is stored in the B-factor column (cols 61-66) of each CA atom, one per residue."""
    vals = []
    for line in pdb_text.splitlines():
        if line.startswith("ATOM") and line[12:16].strip() == "CA":
            vals.append(float(line[60:66]))
    return vals

SESSION = requests.Session()

def get_scores(j):
    """Prefer the small per-residue confidence JSON (a few KB); fall back to the full PDB model."""
    for key in ("plddtDocUrl", "confidenceUrl"):
        if j.get(key):
            r = SESSION.get(j[key], timeout=30)
            if r.status_code == 429:
                raise RuntimeError("429 " + r.headers.get("Retry-After", ""))
            r.raise_for_status()
            return r.json()["confidenceScore"]
    r = SESSION.get(j["pdbUrl"], timeout=60)
    r.raise_for_status()
    return parse_plddt(r.text)

def fetch(acc, tries=6):
    err = ""
    for t in range(tries):
        try:
            r = SESSION.get(API.format(acc), timeout=30)
            if r.status_code == 404:
                return {"accession": acc, "status": "no_model"}
            r.raise_for_status()
            j = r.json()
            j = j[0] if isinstance(j, list) else j
            v = get_scores(j)
            n = len(v)
            frac = lambda lo, hi: round(sum(lo <= x < hi for x in v) / n, 4)
            return {
                "accession": acc, "status": "ok",
                "afdb_entry": j.get("entryId", ""), "model_version": j.get("latestVersion", ""),
                "uniprot_start": j.get("uniprotStart", ""), "uniprot_end": j.get("uniprotEnd", ""),
                "n_residues": n, "mean_plddt_api": j.get("globalMetricValue", ""),
                "mean_plddt": round(sum(v) / n, 2),
                "frac_very_high": frac(90, 101), "frac_confident": frac(70, 90),
                "frac_low": frac(50, 70), "frac_very_low": frac(0, 50),
                "frac_disordered_lt50": frac(0, 50),
                "plddt_per_residue": ",".join(str(round(x)) for x in v),
            }
        except Exception as e:
            err = str(e)[:80]
            # back off hard when rate-limited, gently otherwise
            time.sleep((15 if "429" in err else 2) * (t + 1))
    return {"accession": acc, "status": "error: " + err}

accs = [a.strip() for a in open(ACC_FILE) if a.strip()]
done = set()
if os.path.exists(OUT):
    done = {r["accession"] for r in csv.DictReader(open(OUT)) if not r["status"].startswith("error")}
todo = [a for a in accs if a not in done]
print(len(accs), "accessions;", len(todo), "to fetch")

new = not os.path.exists(OUT)
with open(OUT, "a", newline="") as f, ThreadPoolExecutor(max_workers=4) as ex:
    w = csv.DictWriter(f, fieldnames=FIELDS)
    if new: w.writeheader()
    for i, row in enumerate(ex.map(fetch, todo), 1):
        w.writerow({k: row.get(k, "") for k in FIELDS})
        if i % 200 == 0:
            f.flush(); print(i, "/", len(todo))
rows = list(csv.DictReader(open(OUT)))
print("ok:", sum(r["status"] == "ok" for r in rows), " no_model:", sum(r["status"] == "no_model" for r in rows),
      " error:", sum(r["status"].startswith("error") for r in rows), "(re-run the cell to retry errors)")
