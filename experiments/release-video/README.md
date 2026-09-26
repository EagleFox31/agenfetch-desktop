# AgenFetch Remotion release-video POC

This experiment uses the real AgenFetch **0.3.1** release as an input for the Trigenys Release Video Engine hypothesis.

## What is being tested

- deterministic React-based video composition with Remotion;
- real product/release facts rather than synthetic demo content;
- a 24-second vertical 1080×1920 marketing asset;
- build-from-code with no manual timeline editing;
- repeatable rendering in GitHub Actions.

## Render locally

```bash
cd experiments/release-video
npm install
npm run typecheck
npm run render
```

Output:

```text
out/agenfetch-v0.3.1-vertical.mp4
```

The MP4 is intentionally not committed. CI publishes it as an artifact.
