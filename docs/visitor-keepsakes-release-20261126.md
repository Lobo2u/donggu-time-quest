# Visitor frontend integration — 2026-11-26

This branch integrates the reviewed AWS static visitor release into current master d2ee389c8e3d5243f6ef58dc9bd121aa8896f6db. It does not replace newer upstream wind quest/AR changes. The deleted free-exploration pilot remains deleted.

Included: explicit GPS/demo separation, nine-place map, local photograph comparison shell, four visitor sequence games, five keepsake definitions and browser-local collection. No visit verification, GPS reward, coupon or backend deployment is implied. Missing congestion data remains unavailable; no provider, credentials or backend code is added.

AWS reference: keepsakes-56ec4d25-20261126 (archive SHA-256 56ec4d25f7be425f2f9f525f3c880343d7ba7826c01a559782354d8b350072db). This integration build is not byte-identical to AWS because newer upstream code is preserved.

## Mural and image rights
No standalone mural HTML, embedded photographs, test photos or image derivatives are copied into this commit. Public visibility alone does not prove redistribution permission. Their source/license is not established for GitHub replication.

AWS root builds retain the existing /daedong-wing-alley-preview.html link. GitHub Pages subpath builds link to https://ar.lobodoc.com/daedong-wing-alley-preview.html instead. The UI explicitly says that keepsakes remain separate by origin: a mural reward earned on AWS does not unlock the Pages windmill. No cross-origin reward import is introduced. See frontend/HISTORY-COMPARE.md for the photo comparison shell's asset admission rules.

## Reproduce and release boundary
Use the existing frontend lockfile and supported Node version. From frontend: npm run check; BASE_PATH=/donggu-time-quest/ npm run build (set the environment variable using your shell).
The existing .github/workflows/deploy.yml runs on master pushes or explicit dispatch and deploys frontend/dist to https://lobo2u.github.io/donggu-time-quest/. A feature-branch push/PR alone does not deploy Pages. No workflow, Pages settings or AWS service is changed by this PR.

## Verification for this integration
- Node v24.14.1, existing local dependency cache; no dependency installation.
- npm run check: 22 passed, 0 failed, exit 0. Includes current upstream wind quest/AR tests, visitor/keepsake tests, GPS late-fix/denial isolation and Pages/AWS mural routing.
- BASE_PATH=/donggu-time-quest/ npm run build: exit 0; PWA generated, 80 precache entries. Existing >500 kB bundle warning remains.
- Actual Chrome against the local production preview: nine places, preserved upstream wind banner, collection navigation, public AWS mural link and separate-origin collection warning visible. No location permission granted, no images imported.
- Initial check started before the cache copy completed and failed on missing Vue/Three; the completed-cache run above passed. Initial sandbox preview was inaccessible from Chrome; host loopback preview succeeded without changing security settings.
- No new AWS deployment, Pages dispatch or merge performed. The existing production keepsakes release is unchanged.
