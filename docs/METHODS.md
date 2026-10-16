# Methods

How the dataset was assembled and how every derived value is computed. Numbers are for the data snapshot in this
repository (UniProt export of 26 Sep 2026).

## 1. Source records

The records are **8,274 reviewed UniProtKB/Swiss-Prot entries for Metazoa (taxonomy ID 33208)**, downloaded manually from the
UniProt website on 26 September 2026 as a tab-separated file with all columns (the Tox-Prot venom-protein listing,
restricted to taxonomy ID 33208). The file is kept in `data/uniprot_export_2026-09-26.tsv.gz`. 7,107 (86%) carry UniProt's "Toxin" keyword; 1,167 do not,
and are mostly proteins expressed in the venom gland (hyaluronidases, phospholipases and similar). 7,920 have a
tissue-specificity annotation.

Record annotation is carried over as exported. The only text change is the removal of evidence tags (`{ECO:…}`) from
the function, tissue, location, toxic dose and PTM text, together with the stray punctuation this leaves.
`scripts/verify_against_uniprot.py` re-reads that export and compares every record, field by field.

Features with an unknown position or end (for example `SIGNAL <1..?`, `PROPEP ?..17`, `DISULFID ?`) are not stored,
because they cannot be drawn or used: 42 signal peptide, propeptide, chain and peptide features and 325 disulfide
entries in this snapshot. Interchain disulfide bonds that name a single cysteine are likewise not stored as bonds.
Mass-spectrometry entries tied to one named chain of a multi-chain toxin (163 records) are not stored, because comparing
them with the mass of the whole stored sequence would mislead.

## 2. Values worked out for this atlas

### Animal group
Each record is assigned the first matching group from its NCBI lineage (UniProt's "Taxonomic lineage" column), in this
order: Serpentes → Snake; Araneae → Spider; Scorpiones → Scorpion; Conidae → Cone snail; Gastropoda → Snail (other);
Hymenoptera; Cnidaria; Chilopoda → Centipede; Amphibia → Frog/Toad; Hemiptera → Assassin bug/True bug; Lepidoptera →
Caterpillar/Moth; Ixodida and Acari → Tick/Mite; Squamata → Lizard (after Serpentes); Actinopterygii and Chondrichthyes →
Fish (venomous); Mammalia → Mammal (venomous); anything else → Other/Unclassified. The rule is implemented in
`scripts/verify_against_uniprot.py`, which recomputes the group for all 8,274 records.

### Toxin class
A grouping of UniProt's "Protein families" annotation into 216 broader classes. It is a function of the family string
alone: `data/family_to_class.tsv` lists every family and the class it maps to. The 666 records with no family annotation
(8%) have no toxin class.

### Disulfide connectivity patterns
Cysteines of the **mature chain** are numbered 1…n from the N-terminus. Each curated intrachain bond is re-expressed as
a pair of those ranks, so the pattern does not depend on where the chain starts. A pattern (for example `1-4, 2-5, 3-6`)
is counted only when every cysteine of the mature chain is paired; records with an unpaired cysteine are counted
separately. In this snapshot 6,016 records have curated bonds, 4,938 form a fully paired pattern, and there are 122
distinct patterns, 45 of which occur once.

### Mature region
The union of the record's `CHAIN` and `PEPTIDE` ranges. When a record has neither, the sequence minus its signal peptide
and propeptides. When nothing is annotated, the full sequence.

### Sequence properties
Computed in the browser from the stored full sequence: isoelectric point and charge with the Bjellqvist pKa set,
instability index from the Guruprasad et al. dipeptide weights, GRAVY from the Kyte–Doolittle scale, molecular weight from
average residue masses. They do not account for cleavage or modifications. The pI was checked against Biopython's
`ProteinAnalysis` (median absolute difference 0.0).

### Potency and lethality
Parsed in the browser from UniProt free text.
*In vivo*: every `LD(50)` or `PD(50)` value in the "Toxic dose" text, with its route (i.v., i.p., i.c.v., s.c.) and test
species group read from the surrounding words. Bounds (`>`, `<`) are skipped. Molar doses are converted to mg/kg with the
mass of the mature chain, except for multi-chain complexes. *In vitro*: `IC50`, `EC50`, `Kd` and `Ki` mentions in the
function text, with the target class chosen by the nearest keyword. Values are shown with the clause they were read from
so they can be checked.

## 3. AlphaFold confidence

Per-residue pLDDT was taken from AlphaFold DB (model version 6, retrieved 12 Oct 2026) for the 7,492 records that have a
UniProt cross-reference to AlphaFold DB, with `scripts/afdb_extract.py`. One has no model. For 7,477 records the model
has the same length as the UniProt sequence. For **14 records** the model covers only part of the sequence (usually the
mature chain); their model sequence was fetched with `scripts/afdb_fetch_partial_models.py` and aligned to the UniProt
sequence (local alignment, BLOSUM62, one ungapped block, 96–100% identity), so the pLDDT is placed on the matching
residues and the mean and disordered share cover the modelled part only.

Stored per record: `pl` (one digit per residue, `min(9, floor(pLDDT/10))`), `plm` (mean pLDDT, one decimal), `pld`
(share of modelled residues below 50, integer percent). Bands follow AlphaFold: above 90 very high, 70–90 confident,
50–70 low, below 50 very low. Storing whole-number residues means about 0.35% of residues can fall one band away from
AlphaFold DB's own value.

For most records AlphaFold models the whole precursor, so the mean includes signal and propeptide regions. Records with
a solved structure still show the strip, because solved structures usually cover only the mature toxin.

### Structural gaps
Families with at least 12 records are listed. A record counts as *solved* when it has a PDB cross-reference. For each
family the card shows the share solved and, when at least 5 unsolved members have a model, their mean pLDDT.

## 4. Embedding maps

Input: one sequence per record, the mature region (section 2), written by `scripts/make_embedding_fasta.py` to
`data/embedding_input_mature.fasta`. Embeddings: ProtT5 (`Rostlab/prot_t5_xl_half_uniref50-enc`) and ProstT5
(`Rostlab/ProstT5_fp16`), run on exactly the sequences in `data/embedding_input_mature.fasta`, one mean-pooled vector per protein, generated with the ProtSpace embedding notebook, then reduced
to two dimensions with UMAP (n_neighbors 15, min_dist 0.1, Euclidean metric, 2 components, random_state 42), separately for
each model. The coordinates are in `data/umap_prott5.csv` and `data/umap_prostt5.csv`; the page only displays them.

*Nearest neighbours* and *model agreement* are measured on the 2D coordinates: the k = 15 nearest records of each record in
each map, and the Jaccard overlap of the two neighbour sets. They are approximate. Cluster shapes and distances in UMAP
are not quantitative.

## 5. Similarity search

Smith-Waterman local alignment in JavaScript, BLOSUM62, affine gap penalties (open 11, extend 1), run against every record's
stored sequence. Scores and identities are those of the alignment.

## 6. WHO medically important snakes

The species in Tables A5.3–A5.6 of the WHO snake antivenom guidelines (Annex 5, TRS No. 1004, 2017) are matched to
records by binomial organism name (the first two words of the organism, guarding against trinomials). Matching is by
name only. The list is WHO's, not a Tox-Prot annotation.

## 7. Statistics

- **Amino acid composition:** share of all residues in the selected group, for the mature region or the full sequence,
  against the UniProtKB/Swiss-Prot overall composition (release 2026_03).
- **Cysteine content, pI, pLDDT:** per record, then averaged or binned per group; the pLDDT group means are shown for
  groups with at least 10 models.
- **Region confidence:** residues of signal peptides, propeptides and mature chains counted into the four pLDDT bands.

## 8. Verification

See [`VERIFICATION.md`](VERIFICATION.md).
