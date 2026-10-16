# Third-party data and components

Animal Toxin Atlas code is MIT; the data, map and built page are CC BY-SA 4.0 (see `LICENSING.md`). It contains or uses the following third-party material.

| Material | Used for | Licence / terms |
|---|---|---|
| **UniProtKB/Swiss-Prot** (UniProt Consortium) | all record annotation and sequences | CC BY 4.0. <https://www.uniprot.org/help/license> |
| **AlphaFold Protein Structure Database** (DeepMind, EMBL-EBI) | per-residue confidence (pLDDT), model sequences for 14 records | CC BY 4.0. <https://alphafold.ebi.ac.uk/> |
| **InterPro**, **Gene Ontology**, **NCBI Taxonomy**, **PDB** | cross-references and lineages exported with the UniProt records | see each resource's terms |
| **WHO snake antivenom guidelines**, Annex 5 (TRS No. 1004), Tables A5.3–A5.6 | the list of medically important snake species (names only) | Only species names and regions were transcribed by hand from the published tables; no other WHO text is reproduced. |
| **simple-world-map** (Al MacDonald, Fritz Lekschas), <https://github.com/flekschas/simple-world-map> | base map of the Clinical Importance tab (country borders removed) | CC BY-SA 3.0. The modified map is shared here under CC BY-SA 4.0, which CC BY-SA 3.0 permits as a compatible licence. |
| **ProtT5-XL-UniRef50** and **ProstT5** (Rostlab) | protein language model embeddings (computed outside this repository) | see the model cards at <https://huggingface.co/Rostlab> |
| **UMAP** (McInnes et al.) | 2D projection of the embeddings (computed outside this repository) | BSD-3-Clause |
| **Swiss-Prot amino acid composition**, release 2026_03 | reference ticks in the amino acid chart | from the UniProt release statistics (CC BY 4.0) |
| **Inter** and **IBM Plex Mono** | typefaces, loaded from Google Fonts at run time | SIL Open Font Licence 1.1 |
| **Biopython** | used by `scripts/apply_layers.py` only | Biopython License (BSD-style) |
| **Puppeteer** | used by `tests/smoke.js` only | Apache-2.0 |

The tool is not affiliated with, or endorsed by, UniProt, the Tox-Prot team, InterPro, EMBL-EBI or WHO.
