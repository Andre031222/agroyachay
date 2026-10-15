# Releases, history and published references

This document sets the rules for versions, tags and repository history. Their
purpose is to keep every reference printed in the SoftwareX article valid while
AgroYachay 3.0 is developed in the same public repository.

## 1. What the article cites

The article *AgroYachay: An open-source IoT and large-language-model platform
supporting agronomic and economic decision-making for Andean smallholders*,
SoftwareX 36 (2026) 103037, doi:10.1016/j.softx.2026.103037, refers to three
identifiers:

| Reference | Value | Can it change? |
|---|---|---|
| Code repository | <https://github.com/Andre031222/agroyachay> | Only if the repository is renamed, deleted or its history rewritten |
| Code version | tag and GitHub release `v1.0.1` | Only if the tag is moved or deleted |
| Software archive | Zenodo, doi:10.5281/zenodo.20829992 | No |

The Zenodo record is an immutable snapshot of v1.0.1. Nothing done in the
repository afterwards (new commits, new releases, a rename) alters its files or
its DOI. The other two references depend on how the repository is handled and
are protected by the rules below.

## 2. Rules for the public repository

1. **Never rewrite published history.** No `git push --force`, no rebase or
   amend of commits that are already on `main`, no history-filtering tools. A
   rewritten history leaves the `v1.0.1` tag pointing at commits that no longer
   belong to `main` and breaks links to individual commits.
2. **Never delete or move the tags `v1.0.0` and `v1.0.1`**, and never delete or
   edit the assets of the `v1.0.1` GitHub release. Corrections to v1 are
   released as a new tag (for example `v1.0.2`), not by moving an old one.
3. **Never delete the repository and recreate it under the same name.** GitHub
   redirects a renamed repository, but a deleted repository loses its stars,
   releases, issues and redirects, and the new one starts with no tags.
4. **Protect `main` and the tags on GitHub**: Settings → Rules → add a branch
   ruleset for `main` that blocks force pushes and deletion, and a tag ruleset
   for `v*` that blocks updates and deletion.

## 3. Version numbers and how version 3 is published

| Version | Implementation | Status |
|---|---|---|
| 1.x | Flask API, React web | Public; tags `v1.0.0`, `v1.0.1`; v1.0.1 is described in the article |
| 2.x | Rust and Next.js prototype | Internal only, never tagged or released |
| 3.x | Rust (Axum) API, Next.js web, PostgreSQL, models through an OpenAI-compatible server | Public from `v3.0.0` |

Version 2 was an internal prototype and was never published, so the public
sequence goes from `v1.0.1` to `v3.0.0`. The jump is intentional and must not
be "corrected" by creating a `v2.x` tag afterwards.

- Version 3 is developed in the private repository (§5). It reaches the public
  repository as **one clean commit on top of the public `main`**, containing
  the complete v3 tree, pushed without `--force`. The v1 code disappears from
  the working tree of `main`, but remains in the history and at tags `v1.0.0`
  and `v1.0.1`, which are not touched.
- That commit is tagged `v3.0.0` (annotated tag) and a GitHub release is
  created from the tag.

  One way to build that commit from the private repository, with the public
  repository configured as the remote `public` and v3 on the branch `v3`:

  ```bash
  git fetch public
  git switch --create release/v3.0.0 public/main
  git rm -r -q .
  git checkout v3 -- .
  git commit -m "AgroYachay 3.0.0"
  git push public release/v3.0.0:main          # fast-forward, no --force
  git tag -a v3.0.0 -m "AgroYachay 3.0.0"
  git push public v3.0.0
  ```
- If the Zenodo–GitHub integration is enabled for the repository, publishing
  the `v3.0.0` release creates a **new version** of the existing Zenodo record.
  It receives its own version DOI and is grouped under the same concept DOI as
  v1.0.1. The v1.0.1 DOI (10.5281/zenodo.20829992) keeps resolving to the
  v1.0.1 files. Check the new
  record's metadata (title, authors, licence) after it is created; Zenodo reads it from `CITATION.cff` or `.zenodo.json`.
- `CITATION.cff` describes version 3 and points to the article as
  `preferred-citation`, so the article continues to receive the citations.

## 4. Repository name

The repository keeps the name `agroyachay`, which is the name printed in the
article, so its URL stays literally correct. Version 3 keeps the product name
AgroYachay and the production domain `agroyachay.ginit.dev`.

## 5. The private development repository

The private development repository (`18.Soft_TerraSense`) has a history that is
independent of the public repository and is not cited anywhere. It may be
reorganised, squashed or rewritten freely. Code moves from it to the public
repository only as ordinary new commits on top of the public history, never by
force-pushing the private history to the public remote.

## 6. Authorship and maintenance

The SoftwareX article and AgroYachay v1 are the work of the five authors of
the article (Torres-Cruz, Vilca-Solorzano, Yana-Yucra, Ibañez-Quispe,
Fuentes-Navarro). They remain listed as authors in the README and in
`CITATION.cff`, which points to the article as `preferred-citation`.

AgroYachay 3 was written by Richar Andre Vilca-Solorzano (GitHub
`Andre031222`), who is the sole maintainer of the repository and the person
who publishes releases.

## 7. Relationship stated in the README

The README states, near the top, that AgroYachay 3.0 is the new version of the
platform described in the SoftwareX article, that the version described there
is v1.0.1, and that version 2 was an internal prototype that was never
released. It links to the article, the `v1.0.1` release and the Zenodo DOI. Keep this statement in every
future rewrite of the README.

## 8. Checklist for a release

- [ ] `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` and
      `cargo test` (with PostgreSQL) pass in `api/`
- [ ] `pnpm lint`, `pnpm i18n:check` and `pnpm build` pass in `web/`
- [ ] `version` and `date-released` updated in `CITATION.cff`; validated with
      `cffconvert --validate`
- [ ] version updated in `api/Cargo.toml` and `web/package.json`
- [ ] the release commit sits on top of the public `main` (fast-forward), and
      an annotated tag is created on it (`git tag -a v3.0.0 -m "AgroYachay 3.0.0"`)
      and pushed without `--force`
- [ ] GitHub release published from the tag
- [ ] new Zenodo version checked, and its DOI added to the README if it should
      be cited
- [ ] tags `v1.0.0` and `v1.0.1` and the `v1.0.1` release still present
