# Steward remediation: assessed-case revision path

| Steward concern | Implementation path | Repository proof | Deployment proof | Browser proof | Status |
| --- | --- | --- | --- | --- | --- |
| The assessed-case view has no editable profile populated from the loaded record. | `frontend/src/main.jsx` hydrates the profile draft from `get_case` and renders an assessed-case editor. | PASS: frontend workflow test loads an assessed record and asserts that its stored profile becomes the draft. | Publish the rebuilt frontend from the reviewed commit. | Load a live assessed case by ID and confirm that the editor contains its stored profile. | PARTIAL |
| Revision must not submit unchanged or unrelated local state. | `frontend/src/workflow.js` builds `revise_profile` only from the loaded case ID and an edited profile, and rejects unchanged drafts. | PASS: tests check exact revision arguments and reject unchanged or cross-case local state. Contract suite also passes 8/8. | Existing contract already rejects unchanged profile hashes. | Edit the loaded profile and start the revision from the assessed-case view. | PARTIAL |
| Reassessment must be reachable after revision finalizes. | A finalized revision reloads the on-chain case; a `READY` record exposes `assess`. | PASS: the workflow test applies the revised `READY` record and checks the following `assess` transaction. | Live contract keeps `revise_profile -> READY -> assess -> ASSESSED`. | Complete revision and reassessment with the same case ID. | PARTIAL |

This matrix is updated only after each proof is rerun against the reviewed repository state.
