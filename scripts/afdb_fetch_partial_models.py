# Colab: fetch the AlphaFold sequence + per-residue pLDDT for the records whose model
# differs from the current UniProt sequence. Takes under a minute. Output: afdb_partial_models.csv
import requests, time, csv, json
ACC = ["P85420","P85841","P86392","P86687","A0A0X8XYX3","J9XYC6","P0C5F2",
       "A0A131ZZL5","P0C5F3","P35760","P35784","P35785","P35786","Q3ZU95"]
rows = []
for a in ACC:
    out = {"accession": a, "status": "error"}
    for attempt in range(5):
        try:
            r = requests.get(f"https://alphafold.ebi.ac.uk/api/prediction/{a}", timeout=30)
            if r.status_code == 429: time.sleep(5*(attempt+1)); continue
            r.raise_for_status()
            j = r.json()[0]
            seq = j.get("uniprotSequence") or j.get("sequence") or ""
            conf = None
            for k in ("plddtDocUrl", "confidenceUrl"):
                if j.get(k):
                    c = requests.get(j[k], timeout=30).json()
                    conf = c.get("confidenceScore") or c.get("confidence_score"); break
            out = {"accession": a, "status": "ok", "afdb_entry": j.get("entryId"),
                   "uniprot_start": j.get("uniprotStart"), "uniprot_end": j.get("uniprotEnd"),
                   "model_version": j.get("latestVersion"),
                   "af_sequence": seq,
                   "plddt_per_residue": ",".join(str(round(x)) for x in conf) if conf else ""}
            break
        except Exception as ex:
            out["status"] = "error: " + str(ex)[:80]; time.sleep(2)
    rows.append(out); print(a, out["status"], len(out.get("af_sequence","")))
keys = ["accession","status","afdb_entry","uniprot_start","uniprot_end","model_version","af_sequence","plddt_per_residue"]
with open("afdb_partial_models.csv","w",newline="") as f:
    w = csv.DictWriter(f, fieldnames=keys, extrasaction="ignore"); w.writeheader(); w.writerows(rows)
try:
    from google.colab import files; files.download("afdb_partial_models.csv")
except Exception: pass
