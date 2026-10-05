# Steward remediation: assessed-case revision path

| Steward concern | Implementation path | Repository proof | Deployment proof | Browser proof | Status |
| --- | --- | --- | --- | --- | --- |
| The assessed-case view has no editable profile populated from the loaded record. | `frontend/src/main.jsx` hydrates the profile draft from `get_case` and renders an assessed-case editor. | PASS: frontend workflow test loads an assessed record and asserts that its stored profile becomes the draft. | PASS: GitHub Pages published commit `10b39e7`. | PASS: live assessed case `grant-demo-muv141ic` visibly loads its exact on-chain profile in the editor. | PASS |
| Revision must not submit unchanged or unrelated local state. | `frontend/src/workflow.js` builds `revise_profile` only from the loaded case ID and an edited profile, and rejects unchanged drafts. | PASS: tests check exact revision arguments and reject unchanged or cross-case local state. Contract suite also passes 8/8. | PASS: existing deployed contract rejects unchanged profile hashes. | PASS: public editor is bound to the loaded case and exposes the owner revision action. | PASS |
| Reassessment must be reachable after revision finalizes. | A finalized revision reloads the on-chain case; a `READY` record exposes `assess`. | PASS: the workflow test applies the revised `READY` record and checks the following `assess` transaction. | PASS: live contract keeps `revise_profile -> READY -> assess -> ASSESSED`. | PASS: public assessed-case flow exposes revision, and the repository test covers the finalized refresh into reassessment. | PASS |

This matrix is updated only after each proof is rerun against the reviewed repository state.
