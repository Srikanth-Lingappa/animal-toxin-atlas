# Scripts

| Script | Purpose | Needs |
|---|---|---|
| `build_html.py` | Build `index.html` from the files in `src/` and `data/animal-toxin-atlas-data.json` | Python 3 |
| `apply_layers.py` | Add or check the AlphaFold, partial-model, embedding and 3D-method layers | Python 3, Biopython |
| `verify_against_uniprot.py` | Compare every record with the original UniProt export | Python 3 |
| `recompute_stats.py` | Recompute the headline statistics independently of the page | Python 3 |
| `make_embedding_fasta.py` | Write the mature-region FASTA used as embedding input | Python 3 |
| `afdb_extract.py` | Fetch per-residue pLDDT from AlphaFold DB for `data/afdb_accessions.txt` | Python 3, `requests` (written for Google Colab) |
| `afdb_fetch_partial_models.py` | Fetch the model sequence and pLDDT for records whose model differs in length | Python 3, `requests` |

## Regenerating a layer from scratch

**AlphaFold confidence.** Upload `data/afdb_accessions.txt` to a Colab notebook and run `afdb_extract.py`. It is resumable
and rate-limit aware (4 workers; AlphaFold DB answers 429 above that). It writes `afdb_plddt.csv`; keep one row per
accession, preferring `status == ok`, and save it as `data/afdb_plddt.csv`. Records whose model length differs from the
UniProt sequence are listed by `apply_layers.py`; run `afdb_fetch_partial_models.py` for them and save the result as
`data/afdb_partial_models.csv`. Then `python scripts/apply_layers.py --write`.

**Embeddings.** `make_embedding_fasta.py` writes the input FASTA. Embed it with the ProtSpace embedding notebook (ProtT5
and ProstT5, mean-pooled), reduce each to 2D with UMAP (n_neighbors 15, min_dist 0.1, Euclidean, random_state 42), save
`accession,x,y` CSVs as `data/umap_prott5.csv` and `data/umap_prostt5.csv`, then `python scripts/apply_layers.py --write`.

**Rebuild the page.** `python scripts/build_html.py`.

## Not included

The UniProt export was downloaded by hand from the UniProt website (it is stored in `data/`). The step that first turns it into `data/animal-toxin-atlas-data.json` (selecting and reshaping the columns) is
not a script in this repository. `verify_against_uniprot.py` shows the exact correspondence between the export and
the dataset, field by field.
