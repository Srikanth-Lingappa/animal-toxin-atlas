# Data dictionary

`data/animal-toxin-atlas-data.json` is one JSON object with these keys:

| Key | Content |
|---|---|
| `entries` | the 8,274 records (fields below) |
| `kwList` | UniProt keyword names; `kw` holds indices into this list |
| `famList` | UniProt "Protein families" strings; `fam` is an index into it |
| `classList` | broad toxin classes (216); `cls` is an index into it |
| `catList` | the 16 animal groups |
| `iprList` | InterPro accessions; `ipr` holds indices into it |
| `lineage` | scientific name → NCBI lineage, a list of `[taxon, rank]` pairs |

## Record fields

Positions are 1-based and inclusive, as in UniProt. A missing or empty value is `null`, `""` or `[]`.

| Field | Type | Meaning | Origin |
|---|---|---|---|
| `id` | string | UniProt accession | UniProt |
| `en` | string | entry name | UniProt |
| `pn` | string | protein names | UniProt |
| `gn` | string | gene names | UniProt |
| `org`, `sci`, `cn` | string | organism as exported; scientific name; common name | UniProt (`sci`, `cn` split from `org`) |
| `cat` | string | animal group (16 values) | derived from the NCBI lineage |
| `len` | int | sequence length | UniProt |
| `seq` | string | full translated precursor sequence | UniProt |
| `ec` | string | EC number | UniProt |
| `fn` | string | function text, evidence tags removed | UniProt |
| `ts` | string | tissue specificity text | UniProt |
| `ptm` | string | post-translational modification text | UniProt |
| `sc` | string | subcellular location text | UniProt |
| `td` | string | toxic dose text | UniProt |
| `mf` | string | GO molecular function terms | UniProt |
| `fam` | int | index into `famList` | UniProt |
| `cls` | int | index into `classList`; a function of `fam` | derived (`data/family_to_class.tsv`) |
| `kw` | int[] | indices into `kwList` | UniProt |
| `ipr` | int[] | indices into `iprList` | UniProt |
| `pdb` | string[] | PDB identifiers | UniProt |
| `m3` | string | 3D method summary, e.g. `NMR spectroscopy (3)`; only for records with a PDB entry | UniProt |
| `pm` | string[] | PubMed IDs, de-duplicated, in export order | UniProt |
| `af` | bool | has an AlphaFold DB cross-reference | UniProt |
| `pe` | int | protein existence level, 1 (protein level) to 5 (uncertain) | UniProt |
| `frag` | bool | fragment entry (sequence incomplete) | UniProt |
| `sp` | [int,int] | signal peptide range | UniProt |
| `pro` | [[int,int]] | propeptide ranges | UniProt |
| `ch` | [[int,int,string]] | chain and peptide ranges with their names | UniProt |
| `ds` | [[int,int]] | curated intrachain disulfide bonds | UniProt |
| `ss` | int | number of disulfide bonds in the UniProt record, including interchain ones | UniProt |
| `mod` | [[int,string]] | modified residues with their descriptions | UniProt |
| `gly` | [[int,string]] | glycosylation sites | UniProt |
| `ms` | object | observed mass `{mass, method, note}`, when the record has one not tied to a single chain | UniProt |
| `t5`, `prost` | [float,float] | ProtT5 and ProstT5 UMAP coordinates | `data/umap_*.csv` |
| `pl` | string | AlphaFold pLDDT, one digit per modelled residue: `min(9, floor(pLDDT/10))` | `data/afdb_plddt.csv` |
| `plm` | float | mean pLDDT over the modelled residues, 1 decimal | AlphaFold DB |
| `pld` | int | % of modelled residues with pLDDT < 50 | derived |
| `plo` | int | 0-based offset of the model on the sequence; present only on the 14 partial models | derived |

Records without an AlphaFold model have none of `pl`, `plm`, `pld`; `pl` has the length of the sequence unless `plo` is present.
