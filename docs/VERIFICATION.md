# Verification record

What was checked on the data snapshot in this repository, and how to repeat it. The scripts are in `scripts/` and
`tests/`.

## Records against UniProt

`python scripts/verify_against_uniprot.py <export.tsv>` compares all 8,274 records with the original UniProt export,
field by field (accession set, sequence, length, names, organism, EC number, protein existence, fragment flag, PDB, PubMed,
AlphaFold flag, InterPro, keywords, family, signal peptide, propeptides, chains and peptides, disulfides, glycosylation,
modified residues, text fields, GO molecular function, observed mass) and recomputes the animal group from the export's
lineage. **Result: every checked field matches.** The documented exclusions are listed in the script and in
`docs/METHODS.md` section 1.

## Data layers

`python scripts/apply_layers.py --check --uniprot <export.tsv>` rebuilds the AlphaFold, partial-model, embedding and 3D
method fields from their source files and compares them with the dataset. **Result: identical.** 7,491 records have
pLDDT; 14 of them are partial models placed by alignment. 8,274 records have embedding coordinates; 718 have a 3D method.

## Statistics

`python scripts/recompute_stats.py` recomputes the disulfide patterns, amino acid composition, cysteine content,
pLDDT statistics, region confidence and structural-gap counts straight from the dataset. They were compared with the
values the page displays: they agree (122 disulfide patterns over 4,938 fully paired toxins; 7,491 pLDDT models, 80% with
mean ≥ 70; 129 families, 45 with no solved structure, 34 of those confidently modelled). Isoelectric points agree with
Biopython's `ProteinAnalysis` (median absolute difference 0.0).

## Potency parsing

The in vivo potency parser was run over every record's toxic dose text before and after the evidence-tag clean-up: the
numerical results (value, route, species, endpoint, conversion) are identical for all 697 records that have a value.

## Browser

`npm test` loads the page, opens every tab at desktop and phone width, and checks for page errors, `NaN`/`undefined` text,
horizontal overflow, and that the disulfide, pLDDT and structural-gap headline numbers equal the recomputation above.

## Not covered

Derived groupings (animal group, toxin class, disulfide patterns, potency parsing, WHO name matching, embedding
neighbours) are deterministic and documented, but they are interpretations rather than UniProt annotation. The potency
parser was spot-checked on a sample of records but not validated record by record; the quoted clause is shown next to each value so it can be checked.
