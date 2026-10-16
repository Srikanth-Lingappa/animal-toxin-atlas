# Contributing

Thank you for helping improve Animal Toxin Atlas.

## Reporting a data problem

Use the **Data error** issue template. Give the UniProt accession, what the atlas shows, and what you expected.
Please say whether the field comes from UniProt or is derived (animal group, toxin class, disulfide pattern, potency
value, AlphaFold summary, neighbours): UniProt content is corrected in UniProt, derived values are fixed here.

## Reporting a bug or suggesting a feature

Use the **Bug report** or open an issue. A screenshot, your browser and its version help.

## Making a change

1. Fork the repository and create a branch.
2. Edit the files in `src/` (the page; see `docs/ARCHITECTURE.md` for where things are), `data/` or `scripts/`. Do not edit `index.html` by hand: it is generated.
3. Rebuild and test:
   ```bash
   python scripts/build_html.py
   python scripts/apply_layers.py --check
   npm install && npm test
   ```
4. If you changed data, also run `scripts/verify_against_uniprot.py` against a UniProt export.
5. Update `CHANGELOG.md` and open a pull request describing what changed and why.

Keep the page a single self-contained file and keep it simple: a change that shows the same information that is already
there in another form is unlikely to be accepted.

## Conduct

Be courteous and assume good faith. Harassment or personal attacks are not accepted; maintainers may remove comments and
block accounts that engage in them.
