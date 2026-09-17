# Repository Governance V1 validation

AgenFetch is the second live consumer for AppFactory Repository Governance V1. This validation verifies that the same generic capability used by AgenStart can protect a different product repository without an AppFactory fork or consumer-specific source logic.

## Candidate under test

- AppFactory commit: `e0417fcb65f571c1192c451ea6fbef6a37154ac7`
- policy preset: `solo`
- target: the repository's symbolic default branch
- workflow: manual `plan` / `apply`

The workflow is pinned to the exact pre-release candidate so the validation cannot change underneath a run. It must move to `EagleFox31/appfactory-project-automation@v1` only after Repository Governance V1 is released.

## Baseline before governance

Captured on 2026-09-17 before enabling the integration:

- default branch: `main`
- repository Rulesets: none
- open pull requests: #14 plus draft PRs #7 and #6
- latest published release: `v0.3.1`
- latest Project automation run: successful (`35093623891`)
- latest Windows build run: successful (`35093190560`)
- latest website deployment run: successful (`33536534825`)
- existing Project workflow uses `PROJECT_TOKEN`
- repository auto-merge: disabled
- automatic branch deletion after merge: disabled

Repository governance uses the separate `APPFACTORY_GOVERNANCE_TOKEN`; it does not reuse or replace the Project credential, release permissions or Cloudflare credentials.

## Controlled validation sequence

1. Merge this integration through the existing pull-request flow.
2. Run **Repository governance** with `governance_mode=plan` and retain the read-only output.
3. Confirm the plan proposes exactly one AppFactory-managed Ruleset and performs no mutation.
4. Run `apply` once and confirm exactly one Ruleset is created.
5. Run `apply` again and confirm an explicit no-op with no write.
6. Exercise one controlled issue and pull request through the existing Project lifecycle.
7. Confirm the Windows build, website and release behavior remain unchanged.
8. Confirm existing pull requests, repository settings and published release remain intact.
9. Run a final read-only plan and confirm convergence.

## Expected RAIDER evidence

- **Reusable:** AgenFetch consumes the same Action and policy without copied reconciliation code.
- **Agnostic:** no owner, branch, stack, workflow or AgenStart assumption is added to AppFactory.
- **Idempotent:** the second apply and final plan produce no writes.
- **Durable:** Project, Windows build, website deployment and release behavior remain operational.
- **Engineering-grade:** governance uses a dedicated least-privilege credential, immutable candidate pin and serialized execution.
- **Retroactive:** existing PRs, release history and unrelated repository state are preserved.

## Result

Pending live `plan`, `apply`, no-op and non-regression evidence after merge.
