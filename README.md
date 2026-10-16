# Animal Toxin Atlas

An interactive browser for **8,274 reviewed UniProtKB/Swiss-Prot animal venom protein records** (Tox-Prot). It is a
single HTML file that runs entirely in your browser: no server, no install, no account.

**[Open the Atlas](https://srikanth-lingappa.github.io/animal-toxin-atlas/)**

**Or:** download `index.html` and open it.

## What you can do with it

| Tab | What it gives you |
|---|---|
| **Browse** | Search and filter all records by animal group, toxin class, family, InterPro entry, mechanism, length, structure and more; inspect any record (sequence map with signal peptide, propeptide, chain, disulfides, modifications and AlphaFold confidence); compare records side by side; export the current selection as CSV or FASTA. |
| **Organism** | Every source species and the toxin classes it contributes. |
| **Taxonomy** | The organisms arranged on the NCBI lineage tree. |
| **Disulfides** | Which disulfide connectivity patterns occur, and how many bonds toxins typically have. |
| **Clinical Importance** | WHO-listed medically important snakes, by subregion, and which of them have characterised toxin entries. |
| **Toxin Relationships** | ProtT5 and ProstT5 embedding maps (UMAP), nearest neighbours, agreement between the two models, and a keyword-based shared-target view. |
| **Similarity Search** | A local Smith-Waterman alignment (BLOSUM62, affine gaps) of your sequence against every record. |
| **Insights** | *Structural gaps*: families with no solved structure and how confidently AlphaFold models them. *Potency & lethality*: reported LD50, PD50, IC50, EC50, Kd and Ki values. |
| **Statistics** | Group, class, family and organism overviews; amino acid composition, cysteine content, pI and AlphaFold confidence. |

## Quick start

```bash
git clone https://github.com/srikanth-lingappa/animal-toxin-atlas.git
cd animal-toxin-atlas
open index.html          # or double-click it; any modern browser works
```

Needs a browser with `DecompressionStream` (Chrome/Edge 80+, Firefox 113+, Safari 16.4+).
Searches and pasted sequences never leave your browser.

## Data

| Layer | Source | Where it lives |
|---|---|---|
| Record annotation | UniProtKB/Swiss-Prot export, 26 Sep 2026 (Metazoa, taxonomy ID 33208) | `data/animal-toxin-atlas-data.json` |
| AlphaFold confidence (pLDDT) | AlphaFold DB, model version 6, retrieved 12 Oct 2026 | `data/afdb_plddt.csv`, `data/afdb_partial_models.csv` |
| Embedding maps | ProtT5 and ProstT5 embeddings, UMAP to 2D | `data/umap_prott5.csv`, `data/umap_prostt5.csv` |
| Medically important snakes | WHO snake antivenom guidelines, Annex 5 (TRS No. 1004), Tables A5.3–A5.6 | `src/js/03b-who-snakes-data.js` |
| Family → toxin class | defined for this atlas | `data/family_to_class.tsv` |

Of the 8,274 records, 86% carry UniProt's "Toxin" keyword; the rest are mostly proteins expressed in the venom gland
(hyaluronidases, phospholipases and similar). Field definitions: [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md).
How every derived value is computed: [`docs/METHODS.md`](docs/METHODS.md).

**Values worked out for this atlas are not UniProt fields:** the animal group, the toxin class, disulfide connectivity
patterns, potency and lethality values (parsed from UniProt free text), computed sequence properties, the AlphaFold
summaries, and the embedding neighbours and agreement scores. Check them before relying on them.

## Repository layout

```
index.html                  the tool (built file, served by GitHub Pages)
src/                        the page source, split by area: css/, html/, js/, assets/ (see docs/ARCHITECTURE.md)
data/                       the dataset and every data layer, with provenance
scripts/                    build, data-layer and verification scripts
tests/smoke.js              browser test
docs/                       architecture, methods, data dictionary, verification record, release guide
```

## Rebuilding and verifying

```bash
# edit the small files in src/ (docs/ARCHITECTURE.md says where things are), then:
python scripts/build_html.py                  # src/ + data/animal-toxin-atlas-data.json -> index.html
python scripts/apply_layers.py --check        # the AlphaFold and embedding layers match their source files
python scripts/verify_against_uniprot.py uniprotkb_export.tsv   # every record against the original UniProt export
npm install && npm test                       # browser smoke test + headline numbers vs an independent recompute
```

`scripts/apply_layers.py` needs [Biopython](https://biopython.org) (`pip install biopython`). To regenerate the data
layers from scratch, see [`scripts/README.md`](scripts/README.md). The verification record, with what was checked and
what it found, is in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Limitations

- The toxin class and animal group are convenience groupings; they are not UniProt annotations.
- Potency values are parsed from free text. Bounds (`>`, `<`) are skipped, and molar doses are converted to mg/kg using the mature chain's mass, and not for multi-chain complexes.
- AlphaFold per-residue confidence is stored as whole numbers, so about 0.35% of residues can sit one band away from AlphaFold DB's own colouring. The mean pLDDT and the disordered percentage are exact.
- Sequence properties (pI, charge, instability, GRAVY) use the stored sequence and do not account for cleavage or modifications.
- Embedding layouts (UMAP) are not quantitative; neighbours and model agreement are measured on the 2D coordinates and are approximate.
- UniProt features with an unknown end position (for example `<1..?`) are not drawn, and 163 mass-spectrometry entries tied to one named chain of a multi-chain toxin are not shown.

## Citing

Please cite UniProt and the Tox-Prot programme first, then this atlas. See [`CITATION.cff`](CITATION.cff) (GitHub shows a
"Cite this repository" button) and the references in the tool's About tab.

## Use of AI

The design of Animal Toxin Atlas (what to build, the data choices and how each feature should work) is the author's. All code
in this repository, including the scripts, the page source and the tests, was written by Claude (Anthropic) under the
author's direction, and the documentation was drafted the same way. The author reviewed and directed the work and
checked the dataset against the original UniProt export (`docs/VERIFICATION.md`). Errors can still remain, so please
report them through the issue templates.

## Contributing

Bug reports and data corrections are welcome: see [`CONTRIBUTING.md`](CONTRIBUTING.md). Data errors have their own
issue template.

## Licence

Code is released under the [MIT licence](LICENSE). The dataset, documentation, world map and the built `index.html`
(which embeds both) are under [CC BY-SA 4.0](LICENSE-DATA.txt). [`LICENSING.md`](LICENSING.md) explains which part falls
under which. Third-party data and components, with their licences, are listed in [`THIRD_PARTY.md`](THIRD_PARTY.md). Not affiliated with UniProt, the Tox-Prot team, InterPro, EMBL-EBI or WHO.
