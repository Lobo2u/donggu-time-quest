# DongguON Soje history comparison

Visitor entry: Map > menu > Soje past/present, or on the Soje map location card. Hash URL: /#/history/sojedom.

No archive or reconstruction asset ships by default. Visitors can compare their own photographs, including a live current camera view. Compare photos from the same viewpoint. Manual alignment is not image recognition, automatic relocalization, GPS verification, or a reward claim.

Once a specific site's field location, sign and angles are checked, register reviewed assets in frontend/src/data/historySpots.js. Place an approved minimal image in frontend/public/history/. Every asset needs reviewed: true, a relative src, credit, sourceUrl, rightsUrl, capturedAt (or creation date for a drawing), and viewpoint. Confirm that use, modification/overlay and distribution are all authorized before packaging. Label illustrative reconstruction as such, not an archival photo. Do not use a modern photo to imply historical date. Use a perspective matching the intended visitor position. No external images are loaded by the feature.

Camera access is initiated by the visitor. Camera and imported photos stay in page memory and are released on reset or when exiting; this feature does not upload, persist, or export them.
