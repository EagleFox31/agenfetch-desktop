# Engineering Lessons Learned

This file is the AgenFetch RAIDER failure memory.

Record incidents and near misses that expose a meaningful engineering blind spot, create non-trivial rework/risk, are likely to recur, or can improve another AgenStudio/AppFactory project.

Before release, packaging, updater, persistence or migration work, search this file first.

## LESSON-2026-001 — Published release assets must be immutable

- **Date:** 2026-09-22
- **Category:** release-deployment
- **Status:** prevention-added
- **Related:** #34

**Context**

The Windows release workflow was extended so `main` pushes could publish the version declared in `package.json`.

**Failure / near miss**

When a GitHub Release already existed, the workflow used `gh release upload --clobber`. A later build with the same product version could therefore replace public binaries under an existing release/tag.

**Root cause**

Release publication treated a version as a mutable deployment slot instead of an immutable product identity. Build and publish responsibilities were also coupled to ordinary `main` pushes.

**Resolution**

Normal `main` pushes may build and validate artifacts but no longer publish releases. Publication now requires an explicit tag or manual release action, validates tag/version identity, refuses an existing release, removes the clobber path and records the source commit with the release bundle.

**Prevention**

The workflow fails closed when the requested release already exists or when the tag does not match the package version. Historical assets are never intentionally overwritten.

**Generalized lesson**

A released version is an immutable supply-chain record. Fixes require a new version, never mutation of already-published artifacts.

**Derived principle / standard change**

Release automation should model `build -> verify -> publish-once`, with publication separated from ordinary branch integration.

## LESSON-2026-002 — Product version metadata can drift across surfaces

- **Date:** 2026-09-22
- **Category:** release-deployment
- **Status:** captured
- **Related:** #28, #32

**Context**

AgenFetch ships a desktop app, browser extension, website, release artifacts and updater metadata from the same repository.

**Failure / near miss**

The desktop package reports 0.3.1 while the extension and website manifests still report 0.3.0, and release/documentation state does not consistently describe what is already on `main`.

**Root cause**

Multiple files independently own version/URL metadata with no canonical source or release-time consistency check.

**Resolution**

Tracked in #28 and #32.

**Prevention**

Introduce one authoritative product version/canonical URL source and make release CI reject drift.

**Generalized lesson**

Shared product identity must be generated or validated centrally; duplicating release metadata without reconciliation creates silent configuration drift.

## LESSON-2026-003 — Long-lived feature PRs become unsafe integration branches

- **Date:** 2026-09-22
- **Category:** process
- **Status:** captured
- **Related:** PR #14

**Context**

A download-view refactor remained open while substantial 0.3.x, website, governance and release work continued on `main`.

**Failure / near miss**

PR #14 grew to 35 commits and 57 changed files and became 39 commits behind `main`. Its diff now mixes useful UX work with code that already landed or changed elsewhere.

**Root cause**

The branch accumulated cross-cutting changes instead of staying focused and being rebased/merged while its assumptions were current.

**Resolution**

Do not merge the branch wholesale. Recover only still-useful deltas into small branches created from current `main`.

**Prevention**

Keep product PRs focused, rebase/reconcile long-running work early, and split cross-cutting release/site/core changes into independently reviewable units.

**Generalized lesson**

A passing CI run on an old integration branch does not prove safe mergeability after the base has materially evolved.
