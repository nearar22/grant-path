# GrantPath

Most grant applications fail long before evaluation: a requirement was missed, a deadline was unclear, or a claim had no proof. GrantPath turns the official call and the applicant's own facts into a source-bound readiness map before that time is spent.

## The application path

1. The applicant opens a case with one to three official HTTPS sources, a funding goal, and a factual project profile.
2. GenLayer validators fetch every source and examine the complete pages.
3. Consensus records the deadline as `OPEN`, `CLOSED`, or `UNKNOWN`, and maps every material gate to `PASS`, `FAIL`, or `MISSING`.
4. Every requirement stores an exact source quote. Every `PASS` also stores an exact applicant-profile quote.
5. The applicant may revise the profile twice and rerun the assessment before sealing a final advisory map.

The overall state is derived deterministically. A closed deadline or any failed mandatory gate produces `NOT_ELIGIBLE`. Missing evidence or an unknown deadline produces `NEEDS_WORK`. Only a fully open, fully supported map becomes `READY`.

## Why consensus matters

Eligibility language is semantic, spread across prose, and easy for a single model to overstate. The producer cannot store an unchecked score or explanation. Validators must independently refetch the official pages and verify the exact deadline, complete criterion set, states, source indexes, quotes, hosts, and content digests. A matching overall label is insufficient if any underlying finding differs.

## Safety boundary

GrantPath is advisory. It does not represent a grantmaker, submit an application, guarantee eligibility, or prove that a caller-controlled URL is authoritative. The included `docs/demo-grant.txt` is explicitly an operator-created fixture, not an independent funding source.

## Run locally

```bash
python -m pytest tests -q
genvm-lint lint contracts/grant_path.py --json
cd frontend
npm ci
npm test
npm run build
```

The app uses GenLayer Studio Next, chain `61997`, and waits for successful `FINALIZED` status before treating a write as complete.

## Repository map

- `contracts/grant_path.py`: Intelligent Contract and consensus boundary
- `tests/`: direct lifecycle and adversarial tests
- `frontend/`: wallet-connected application-path interface
- `scripts/`: deployment, source-match verification, and live lifecycle smoke test
- `docs/identity-matrix.md`: mechanism and interface originality record

## Live deployment

- Network: GenLayer Studio Next, chain `61997`
- Contract: [`0x75077385a76E680573c148F6DA0F614D301c2c59`](https://explorer-studio-dev.genlayer.com/address/0x75077385a76E680573c148F6DA0F614D301c2c59)
- Deployment transaction: [`0xb62a1dc0...9aad1f9`](https://explorer-studio-dev.genlayer.com/tx/0xb62a1dc03160e8bc04d74853deb5d89816b39dcb01c2896b5d4e162459aad1f9)
- Public demo case: `grant-demo-musiojw3`
- Exact source match: verified by SHA-256 in [`deployment.json`](deployment.json)

The public demo records a complete lifecycle. Its first assessment is `NOT_ELIGIBLE` because a mandatory public demonstration is absent. After an owner-authorized profile revision, validators reassess the same frozen source, all criteria pass, and the case is sealed as `FINAL` with overall state `READY`.
