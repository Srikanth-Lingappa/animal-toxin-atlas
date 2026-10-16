# Architecture

Animal Toxin Atlas ships as **one self-contained file**, `index.html`. That file is **generated**: it is built from the small files
in `src/` plus the dataset in `data/animal-toxin-atlas-data.json`. Edit the small files, then rebuild:

```bash
python scripts/build_html.py      # writes index.html
```

Open `index.html` in a browser to try the change. Do not edit `index.html` by hand; the next build overwrites it.

## How the build works

`src/index.html` is the skeleton of the page. Lines of the form `{{include css/00-tokens.css}}` are replaced by the contents of
that file (relative to `src/`), in the order they are listed. Three kinds of files are included:

| Folder | What | How it is combined |
|---|---|---|
| `src/css/` | the styles, one file per area | joined in order inside one `<style>`; **later rules override earlier ones** |
| `src/html/` | the markup: header, one file per tab, panels and footer | placed in the page body in the order listed |
| `src/js/` | the behaviour, one file per section | joined in order inside **one function**, so all files share variables and functions; there are no imports |
| `src/assets/` | `world-map.svg`, the base map of the Clinical Importance tab | included into `src/html/tab-clinical-who.html` |

The dataset is compressed (gzip, base64) and inserted into `<script id="app-data">`; `js/02-load-data.js` decompresses it in the
browser. The page is plain JavaScript (ES5 style, `var` and `function`), with no framework and no build tool beyond Python.

Because the JavaScript files share one scope, a function defined in one file can be called from any other. The numbers in the
file names give the order they are joined in; the `b`, `c`... files continue a section.

## Where do I change...?

| I want to change | Edit |
|---|---|
| colours, fonts, dark mode | `css/00-tokens.css` |
| the top bar or tabs | `html/header.html`, `css/01-layout-and-tabs.css` |
| what the About tab says | `html/tab-about.html` |
| the references / BibTeX | `js/24-references.js` |
| a Browse filter | markup in `html/tab-browse.html`; logic in `js/06-...`, `js/07-filter-sort-paginate.js`, `js/07b-filter-bar-chips.js` |
| what the record detail panel shows | `js/09-detail-panel.js`, `js/15c-cleavage-note-sequence-map.js` |
| the sequence map or pLDDT strip | `js/15c-cleavage-note-sequence-map.js`, `css/05-sequence-map.css` |
| CSV / FASTA export | `js/10-downloads.js` |
| a Statistics chart | `js/11-statistics-charts.js` (Overview), `js/11b-sequence-and-alphafold-stats.js` (Sequence & AlphaFold) |
| sequence properties (pI, charge...) | `js/15-sequence-properties.js` |
| the similarity search | `js/13-similarity-search.js` |
| potency and lethality parsing | `js/17-potency-and-lethality.js` |
| the structural-gaps view | `js/18-structural-gaps.js` |
| the WHO snake list or map | `js/03b-who-snakes-data.js`, `js/19-clinical-importance.js`, `assets/world-map.svg` |
| the disulfide patterns | `js/21-disulfides-tab.js` |
| the embedding map | `js/23-...` to `js/23h-...` |
| the dataset itself | `data/animal-toxin-atlas-data.json` (see `docs/DATA_DICTIONARY.md`), then rebuild |

## Files

### `src/js/` (joined in this order)

| File | Purpose |
|---|---|
| [`00-theme.js`](../src/js/00-theme.js) | Light/dark theme and the colour-blind-safe palette switch: reads the saved choice and applies it. |
| [`01-toast.js`](../src/js/01-toast.js) | Small pop-up messages ("Copied", "Downloaded"). |
| [`02-load-data.js`](../src/js/02-load-data.js) | Decompresses the embedded dataset (gzip + base64 in `<script id="app-data">`) in the browser. |
| [`03-state.js`](../src/js/03-state.js) | Shared state used everywhere: the record list, current filters and sort, selections, and tab switching. |
| [`03a-helpers.js`](../src/js/03a-helpers.js) | Small shared helpers: colour variable per animal group, HTML escaping, number formatting. |
| [`03b-who-snakes-data.js`](../src/js/03b-who-snakes-data.js) | The WHO list of medically important venomous snakes (region, subregion, species) and the matching of records to it. |
| [`04-init.js`](../src/js/04-init.js) | init(): builds the lookup tables, derives per-record values and starts every tab. |
| [`05-category-strip.js`](../src/js/05-category-strip.js) | The animal-group strip and the record count line at the top of Browse. |
| [`06-family-and-keyword-select.js`](../src/js/06-family-and-keyword-select.js) | Browse filter controls: toxin class, protein family, InterPro, mechanism and keyword lists. |
| [`07-filter-sort-paginate.js`](../src/js/07-filter-sort-paginate.js) | Applies the filters, sort order and paging to the record list (computeFiltered). |
| [`07b-filter-bar-chips.js`](../src/js/07b-filter-bar-chips.js) | Filter bar: reset, active-filter chips and the "More filters" toggle. |
| [`08-results-list.js`](../src/js/08-results-list.js) | Renders the results list and its pagination. |
| [`09-detail-panel.js`](../src/js/09-detail-panel.js) | The record detail panel: header, text cards, sequence and cross-references. |
| [`10-downloads.js`](../src/js/10-downloads.js) | CSV and FASTA exports and the file-download helpers. |
| [`11-statistics-charts.js`](../src/js/11-statistics-charts.js) | Statistics > Overview: group, class, family, organism, InterPro and mechanism charts, and the selected-group highlight. |
| [`11b-sequence-and-alphafold-stats.js`](../src/js/11b-sequence-and-alphafold-stats.js) | Statistics > Sequence & AlphaFold: amino acid composition, cysteine content, pI and pLDDT charts. |
| [`12-events-and-tabs.js`](../src/js/12-events-and-tabs.js) | Event handlers for the whole page: tab switching, filter inputs, statistics sub-tabs and keyboard handling. |
| [`13-similarity-search.js`](../src/js/13-similarity-search.js) | Similarity Search: Smith-Waterman local alignment (BLOSUM62, affine gaps) against every record. |
| [`14-shared-targets.js`](../src/js/14-shared-targets.js) | Toxin Relationships > shared targets: the keyword-based view (named "convergence" in the code). |
| [`15-sequence-properties.js`](../src/js/15-sequence-properties.js) | Sequence properties: composition, mass, charge, pI, GRAVY, instability, extinction coefficient. |
| [`15b-entry-panel-neighbours.js`](../src/js/15b-entry-panel-neighbours.js) | The detail panel's nearest-neighbour mini maps from the embeddings. |
| [`15c-cleavage-note-sequence-map.js`](../src/js/15c-cleavage-note-sequence-map.js) | The cleavage note, the sequence map (signal peptide, propeptide, chain, disulfides, pLDDT strip) and the properties table. |
| [`16-compare.js`](../src/js/16-compare.js) | Compare tray and the side-by-side comparison overlay. |
| [`17-potency-and-lethality.js`](../src/js/17-potency-and-lethality.js) | Insights > Potency & lethality: parses LD50/PD50/IC50/EC50/Kd/Ki from UniProt text; also the mature-region helpers. |
| [`18-structural-gaps.js`](../src/js/18-structural-gaps.js) | Insights > Structural gaps: families with no solved structure and their AlphaFold confidence. |
| [`19-clinical-importance.js`](../src/js/19-clinical-importance.js) | Clinical Importance tab: WHO coverage by subregion and the map. |
| [`20-organism-tab.js`](../src/js/20-organism-tab.js) | Organism tab: directory of source species and per-organism composition. |
| [`21-disulfides-tab.js`](../src/js/21-disulfides-tab.js) | Disulfides tab: connectivity patterns and bond counts. |
| [`22-taxonomy-tab.js`](../src/js/22-taxonomy-tab.js) | Taxonomy tab: the tree of source organisms and its colouring. |
| [`23-embedding-map-core.js`](../src/js/23-embedding-map-core.js) | Embedding map: view, scales, zoom and nearest-point lookup. |
| [`23b-embedding-agreement.js`](../src/js/23b-embedding-agreement.js) | Embedding map: ProtT5 vs ProstT5 neighbourhood agreement (k nearest neighbours, Jaccard overlap). |
| [`23c-embedding-colouring.js`](../src/js/23c-embedding-colouring.js) | Embedding map: colouring, grouping and legend. |
| [`23d-embedding-drawing.js`](../src/js/23d-embedding-drawing.js) | Embedding map: drawing the points and the highlight states. |
| [`23e-embedding-selection-and-search.js`](../src/js/23e-embedding-selection-and-search.js) | Embedding map: box selection and the search box. |
| [`23f-embedding-side-panel.js`](../src/js/23f-embedding-side-panel.js) | Embedding map: the side panel next to the map. |
| [`23g-embedding-exports.js`](../src/js/23g-embedding-exports.js) | Embedding map: CSV, FASTA, SVG and PNG exports. |
| [`23h-embedding-wiring.js`](../src/js/23h-embedding-wiring.js) | Embedding map: builds the tab and wires its events. |
| [`24-references.js`](../src/js/24-references.js) | References list, "Copy all" and BibTeX download (the About tab's reference data lives here). |

### `src/css/` (joined in this order)

| File | Purpose |
|---|---|
| [`00-tokens.css`](../src/css/00-tokens.css) | Design tokens: colours, fonts, spacing, the light/dark themes and the animal-group palette. |
| [`01-layout-and-tabs.css`](../src/css/01-layout-and-tabs.css) | Page shell, header and the view tabs. |
| [`02-hero-and-category-strip.css`](../src/css/02-hero-and-category-strip.css) | Hero text and the animal-group strip. |
| [`03-browse-filter-bar.css`](../src/css/03-browse-filter-bar.css) | The horizontal filter bar on Browse. |
| [`04-results-list.css`](../src/css/04-results-list.css) | Results list, rows and badges. |
| [`05-sequence-map.css`](../src/css/05-sequence-map.css) | Sequence map, modified residues and mass-spectrometry blocks in the detail panel. |
| [`06-embedding-map-and-citations.css`](../src/css/06-embedding-map-and-citations.css) | Embedding map, nearest-neighbour panels, citations and references. |
| [`07-taxonomy-tree.css`](../src/css/07-taxonomy-tree.css) | Taxonomy tab. |
| [`08-who-clinical.css`](../src/css/08-who-clinical.css) | WHO badges and the Clinical Importance tab. |
| [`09-interpro-organism-pagination.css`](../src/css/09-interpro-organism-pagination.css) | InterPro chips, the Organism tab and pagination. |
| [`10-detail-panel.css`](../src/css/10-detail-panel.css) | The record detail panel. |
| [`11-statistics.css`](../src/css/11-statistics.css) | Statistics tab. |
| [`12-similarity-search.css`](../src/css/12-similarity-search.css) | Similarity Search tab. |
| [`13-toxin-relationships.css`](../src/css/13-toxin-relationships.css) | Toxin Relationships tab (shared targets). |
| [`14-sequence-properties.css`](../src/css/14-sequence-properties.css) | Sequence properties table. |
| [`15-compare.css`](../src/css/15-compare.css) | Compare tray and overlay. |
| [`16-insights.css`](../src/css/16-insights.css) | Insights tab: potency and the gap finder. |
| [`17-insights-redesign.css`](../src/css/17-insights-redesign.css) | Insights tab: KPI cards, structural-gap cards and later additions (loaded last so they win). |

### `src/html/`

| File | Purpose |
|---|---|
| [`header.html`](../src/html/header.html) | Top bar: wordmark, tabs, theme and palette toggles. |
| [`tab-browse.html`](../src/html/tab-browse.html) | Browse tab: hero, filter bar and results list. |
| [`tab-organism.html`](../src/html/tab-organism.html) | Organism tab. |
| [`tab-taxonomy.html`](../src/html/tab-taxonomy.html) | Taxonomy tab. |
| [`tab-disulfides.html`](../src/html/tab-disulfides.html) | Disulfides tab. |
| [`tab-clinical-who.html`](../src/html/tab-clinical-who.html) | Clinical Importance tab (the map is assets/world-map.svg). |
| [`tab-toxin-relationships.html`](../src/html/tab-toxin-relationships.html) | Toxin Relationships tab: embedding map and shared targets. |
| [`tab-search.html`](../src/html/tab-search.html) | Similarity Search tab. |
| [`tab-insights.html`](../src/html/tab-insights.html) | Insights tab: structural gaps and potency & lethality. |
| [`tab-statistics.html`](../src/html/tab-statistics.html) | Statistics tab: Overview and Sequence & AlphaFold pages. |
| [`tab-about.html`](../src/html/tab-about.html) | About tab: data, methods summary, how to cite, references. |
| [`panels-overlays-footer.html`](../src/html/panels-overlays-footer.html) | Detail panel, compare tray and overlays, footer. |

## Conventions

- Plain ES5 JavaScript inside one `"use strict"` function; no modules, no frameworks.
- Each `js/` file starts with a comment saying what it does and which functions it defines.
- Elements are found by `id` or `data-` attributes, set in the `html/` files. Tabs are `<section id="tab-...">`; the header
  buttons use `data-tab="organism | taxon | disulfides | who | convergence | search | insights | stats | about"`.
- Dataset fields are short names (`fn`, `ts`, `pl`...); see `docs/DATA_DICTIONARY.md`.
- Run `npm test` after a change: it opens every tab at desktop and phone width.
