# Setup cascade: batteries included, for a non-technical operator

*Source of record for the setup model rendered by the hub leaf `setup.html` (`hub/site/setup-data.js`).
Written 2026-09-26. The claim it serves: a self-improving harness is only a product if a
non-technical person can stand up its providers in one sitting. The cascade is that sitting.*

## The idea

`infra/` is batteries included (`docs/10-architecture.md` §1): each battery stands up one thing the
pipeline runs on and hands the stages a Store or a tool grant at the edge. The cascade is the
**operator's view of the same batteries**: eight slots in the order a fresh install fills them, each
with the provider options, the signup page, the key page, the env keys the choice writes, the
scripted step that stands it up, and the tool grants it satisfies. Choosing is the whole job; the
scripts do the rest. The tetrahedron on the leaf is the three points with the batteries core at the
centre; the cascade instantiates that core.

## The slots and their options

| # | Slot | Battery | Options (default first) | Credit in this hackathon |
|---|---|---|---|---|
| 1 | Memory and state | atlas | **MongoDB Atlas Sandbox** | required; MongoDB for Startups after |
| 2 | Embeddings | atlas | **Atlas Automated Embeddings** · Voyage AI direct | Voyage 200M tokens |
| 3 | Image bytes | blob | **GridFS in the Sandbox** · Cloudflare R2 · AWS S3 · local fs | R2 free tier; S3 unfunded |
| 4 | Model gateway | gateway (proposed) | **OpenRouter** · Vercel AI Gateway · AWS Bedrock · Anthropic direct | OpenRouter credits by email; Vercel's $30 is v0 credit |
| 5 | Build harness | — | **Claude Code** · AWS Kiro · OpenAI Codex | Kiro 500 bonus; Codex 1,250 credits |
| 6 | Repository | repo | **GitHub** | public repo, free minutes |
| 7 | Tracing | tracing | **LangSmith** · none | $50 via the form |
| 8 | Where it runs | — (targets.json) | **this machine** · Cloudflare · Vercel · AWS Lambda | Cloudflare and Vercel free tiers; Lambda unfunded |

The four systems named as exemplars sit in three slots: **MongoDB** owns 1 and 2 and the default
of 3; **OpenRouter** and **Vercel AI Gateway** are the two routes in 4; **AWS** appears as S3,
Bedrock, Lambda and Kiro, of which only Kiro carries a credit today (`docs/04-resources.md`).

## The proposed gateway battery

`infra/batteries/gateway` is the one battery the tree lacks: a descriptor with grants
`model.plan`, `model.build`, `model.instrument`, an env of one key, and a provision step that
verifies the key and writes the route table (`{stage → model}`) into the policy document, so
Instrument can move a stage to a cheaper model by rewriting data. OpenRouter and Vercel AI Gateway
are the same shape (one base URL, one key, OpenAI-compatible); Bedrock and a direct key are adapters.

## Onboarding workflow, the scripted half

1. Open the leaf, walk the eight slots, pick a provider each. Every pick shows **Get account** and
   **Get key** links: first-class signup, no docs to read.
2. Copy the generated `.env` block (names only) and paste keys into it.
3. `make install`, then `make provision`: every battery stands itself up idempotently and prints
   what it still lacks instead of failing.
4. `make plan` · `make build` · `make instrument`: the first iteration; `cp/1` is tagged.

Next: the leaf calls the provision step itself through the API once the Worker is deployed, so
step 3 becomes a button; the choices are stored as a `setup` document in Atlas beside the policy, so
a second machine inherits them through the install loop instead of the browser's local storage.
