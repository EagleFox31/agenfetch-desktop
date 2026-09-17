# Repository Governance V1 validation

AgenFetch is the second live consumer for AppFactory Repository Governance V1. This validation verifies that the same generic capability used by AgenStart can protect a different product repository without an AppFactory fork or consumer-specific source logic.

## Candidate under test

- AppFactory commit: `e0417fcb65f571c1192c451ea6fbef6a37154ac7`
- policy preset: `solo`
- target: the repository's symbolic default branch
- workflow: manual `plan` / `apply` for initial adoption and diagnostics

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

1. Merge the consumer integration through the existing pull-request flow.
2. Run **Repository governance** with `governance_mode=plan` and retain the read-only output.
3. Confirm the plan proposes exactly one AppFactory-managed Ruleset and performs no mutation.
4. Run `apply` once and confirm exactly one Ruleset is created.
5. Run `apply` again and confirm an explicit no-op with no write.
6. Introduce one controlled drift on the AppFactory-owned Ruleset and confirm `apply` repairs only that difference.
7. Confirm the existing Project lifecycle and pull-request checks remain operational.
8. Confirm Windows build, website and release behavior remain unchanged.
9. Confirm existing pull requests, repository settings and published release remain intact.
10. Run a final read-only plan and confirm convergence.

## Evidence

- Consumer integration: PR [#24](https://github.com/EagleFox31/agenfetch-desktop/pull/24), merged as `e9a8dc8a7cd75eaf906363d81ff0d60f6f4828da`.
- Initial plan: run [35196350289](https://github.com/EagleFox31/agenfetch-desktop/actions/runs/35196350289) proposed one `CREATE` and the Rulesets API remained empty.
- First apply: run [35196622986](https://github.com/EagleFox31/agenfetch-desktop/actions/runs/35196622986) created Ruleset `23584630`.
- Idempotence: run [35196667888](https://github.com/EagleFox31/agenfetch-desktop/actions/runs/35196667888) returned `NO-OP` and performed no write.
- Controlled drift: branch deletion protection was disabled on the managed Ruleset only.
- Drift repair: run [35196748282](https://github.com/EagleFox31/agenfetch-desktop/actions/runs/35196748282) detected `disabled -> enabled` and updated Ruleset `23584630` in place.
- Final convergence: run [35196842457](https://github.com/EagleFox31/agenfetch-desktop/actions/runs/35196842457) returned `NO-OP`.
- The symbolic target remained `~DEFAULT_BRANCH`; `main` was preserved.
- Unrelated Rulesets remained at zero throughout the validation.
- Project automation and all PR #24 build checks passed.
- The latest published release remained `v0.3.1`; governance triggered no release and no automatic merge.

## RAIDER result

- **Reusable:** AgenFetch consumes the same Action and policy without copied reconciliation code.
- **Agnostic:** no owner, branch, stack, workflow or AgenStart assumption was added to AppFactory.
- **Idempotent:** repeated apply and final plan produced zero writes after convergence.
- **Durable:** Project automation, Windows build, website deployment and release behavior remained operational.
- **Engineering-grade:** governance uses a dedicated least-privilege credential, immutable candidate pin and serialized execution.
- **Retroactive:** existing PRs, release history and unrelated repository state were preserved.

## Result

**PASS — 2026-09-17.** AgenFetch validates Repository Governance V1 as a second independent live consumer. No consumer-specific AppFactory workaround was required.
