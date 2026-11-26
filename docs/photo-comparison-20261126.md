# Photo comparison release — 2026-11-26

The archive screen and optional user-photo/camera screen reuse `PhotoComparison.vue`. The station pair is a draggable comparison, not a geometric registration or live view. A native range input provides keyboard and touch controls. Existing camera lifecycle and alignment controls remain separate.

## Redistributed station photos

Original bytes, with attribution and license links displayed below the comparison:

- 2007-04-29: Yoo Chung, https://commons.wikimedia.org/wiki/File:Daejeon_train_station.jpg — CC BY-SA 2.5, https://creativecommons.org/licenses/by-sa/2.5/ . SHA-256 `246c58622fe4ffdbd9d4726fe4892b67aea3887827cbbd97538b549f8d9e1c23`.
- 2019-06-08: *Youngjin, https://commons.wikimedia.org/wiki/File:Q20919_Daejeon_Station_A01.jpg — CC BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/ . SHA-256 `79c0ae9407fbc1c80b5a02c00650f7ff13aa9301ba64a39d3ae2968fc6c89a22`.

The files are unmodified. The UI reveals portions interactively and warns that camera framing differs. The 2019 photo is a historical record, not the current real-time scene.

## Deliberate AWS/Git distinction

The noncommercial AWS demo also contains one separately authorized CC BY-NC-ND photo of Soje house 16. That file and its photo metadata are NOT distributed in this Git branch. It is explicitly ignored; the Git/Pages screen instead shows the official records and optional camera entry. Do not copy the AWS distribution into this repository wholesale. The archive source https://djiha.dcaf.or.kr/archive/materials/publicationsV.do?ichDataUid=13962778896619451840&page=1 is a link only.

The previously documented external AWS mural preview fallback remains unchanged on Pages. Master/Pages deployment is not part of this feature-branch push.

## Verification

AWS candidate: 27 Node tests and Vite build; Chrome 375x667 touch drag, desktop range keyboard operation, both station image decodes, and the optional two-user-photo comparison path. No camera or precise position capture was performed. The AWS-only photo was byte-compared to its authorized original and displayed whole using `object-fit: contain`, without overlays or filters.

Public AWS: nine files returned HTTP 200 and matching SHA-256 through independent Windows HTTPS and nginx loopback; public map -> station comparison and Soje single record were observed. Active release `photo-slider-9cf454f7-20261126`; rollback `station-photos-30e39667-20261126` retained. Initial cached older screen updated after a normal cache-bypassing reload. No backend/security/DNS change.

Git candidate is separately tested and built with `BASE_PATH=/donggu-time-quest/` because it preserves newer upstream screens and excludes the AWS-only asset.

Git candidate validation: 25 tests passed, 0 failed/skipped; Pages Vite build exited 0. Actual Chrome loaded both station images beneath /donggu-time-quest/ and showed Soje official-record fallback without the excluded image. Existing Vite test HMR port warnings and >500 kB chunk warning did not fail the checks.
