# Data

| File | Content | Source |
|---|---|---|
| `animal-toxin-atlas-data.json` | the dataset embedded in the page (field definitions in `../docs/DATA_DICTIONARY.md`) | UniProt export of 26 Sep 2026 plus the layers below |
| `family_to_class.tsv` | UniProt protein family → toxin class used by the atlas, with record counts | defined for this atlas |
| `afdb_accessions.txt` | accessions with an AlphaFold DB cross-reference (7,492) | UniProt export |
| `afdb_plddt.csv` | per-residue and summary pLDDT, 7,491 models and 1 `no_model` row | AlphaFold DB, model version 6, retrieved 12 Oct 2026 |
| `afdb_partial_models.csv` | model sequence and pLDDT for the 14 records whose model covers part of the sequence | AlphaFold DB, same version |
| `umap_prott5.csv`, `umap_prostt5.csv` | 2D UMAP coordinates | computed from ProtT5 / ProstT5 embeddings |
| `embedding_input_mature.fasta` | the sequences embedded (mature region of each record) | `scripts/make_embedding_fasta.py` |

| `uniprot_export_2026-09-26.tsv.gz` | the original UniProt export, exactly as downloaded (gzip-compressed) | manual download from uniprot.org |

To check the dataset against the export: `gunzip -k data/uniprot_export_2026-09-26.tsv.gz` then
`python scripts/verify_against_uniprot.py data/uniprot_export_2026-09-26.tsv`.

Licences: UniProt data CC BY 4.0; AlphaFold DB CC BY 4.0. See `../THIRD_PARTY.md`.
