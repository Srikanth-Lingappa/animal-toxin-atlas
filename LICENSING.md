# Licensing

Two licences apply, because the tool combines original code with data and a map that carry their own terms.

| Part | Licence | Why |
|---|---|---|
| Code: `scripts/`, `tests/`, `src/css/`, `src/html/`, `src/js/`, `.github/`, `package.json` | **MIT** (`LICENSE`) | written for this project |
| Dataset: `data/` | **CC BY-SA 4.0** (`LICENSE-DATA.txt`) | derived from UniProt and AlphaFold DB (both CC BY 4.0), plus this project's own layers |
| Documentation: `README.md`, `docs/` | **CC BY-SA 4.0** | |
| World map: `src/assets/world-map.svg` | **CC BY-SA 4.0** (adapted from a CC BY-SA 3.0 map) | share-alike, see `THIRD_PARTY.md` |
| Built page: `index.html` | **CC BY-SA 4.0** | it embeds the dataset and the map, so the combined file follows the share-alike terms |

In practice:

- You may reuse the **code** under MIT, including in closed projects, as long as you keep the copyright notice.
- If you redistribute `index.html`, the dataset or the map (or a modified version), keep it under CC BY-SA 4.0 and
  credit UniProt, AlphaFold DB and the map's authors (listed in `THIRD_PARTY.md` and in the page's About tab).
- If you take only the code from `src/js`, `src/css`, `src/html` and `scripts/` and not the data or the map, MIT is
  all that applies.

This is a plain-language summary, not legal advice. The licence texts are the binding documents.
