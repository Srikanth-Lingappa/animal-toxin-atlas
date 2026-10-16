# Releasing

## One-time setup

1. Create the repository on GitHub (suggested name: `animal-toxin-atlas`) and push this folder.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.** The `pages.yml` workflow publishes
   `index.html` on every push to `main`; the live address is `https://<user>.github.io/animal-toxin-atlas/`.
3. Replace the placeholders: `<your-github-user>` in `README.md` and `CITATION.cff`, the author block in `CITATION.cff`,
   and the UniProt search in `docs/METHODS.md`.
4. Add the repository description and topics (`venom`, `toxins`, `uniprot`, `alphafold`, `bioinformatics`).

## Each release

1. Update `CHANGELOG.md` and `version` / `date-released` in `CITATION.cff` and `package.json`.
2. `python scripts/build_html.py`, then `python scripts/apply_layers.py --check` and `npm test`.
3. Commit, tag (`git tag v1.0.0 && git push --tags`) and create a GitHub release from the tag. Attach `index.html` to the
   release so people can download the single file.

## Archiving with a DOI (Zenodo)

1. Sign in to <https://zenodo.org> with GitHub and switch the repository on under *GitHub* settings.
2. Create the GitHub release. Zenodo archives it, reads `CITATION.cff` for the metadata, and issues a DOI.
3. Add the DOI badge to `README.md` and the DOI to `CITATION.cff` (`doi:`) and to the About tab's citation text.

## When UniProt or AlphaFold DB are updated

Re-export the UniProt records, regenerate the data layers (`scripts/README.md`), run
`scripts/verify_against_uniprot.py`, update the dates in the About tab, and release a new version.
