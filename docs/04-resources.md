# Hackathon Resources: Partners, MCPs, Credits, and Where Each Fits in 3PT

*Source of record. Compiled 2026-09-26 from the official resource guide
(Google Doc `13c8je_4unbaLLMGYhCO58zMKx4eZZ_GcuYhrUSONld8`). No coupon codes appear in the
doc; every code arrives by email or the Discord bot from 10:30 AM Saturday, and only for
participants registered on Cerebral Valley and checked in on site.*

## Credit ledger

| Partner | Free allotment | How to redeem | Deadline |
|---|---|---|---|
| **MongoDB Atlas** | Hackathon Sandbox cluster (**required**) | Email link → create project + cluster inside the sandbox | Before building |
| **Voyage AI** (MongoDB) | 200M embedding/reranking tokens per participant; top-ups on request from Voyage staff on site | dashboard.voyageai.com → API key → add payment method to unlock Tier 1 rate limits (not charged within allowance) | — |
| **OpenRouter** | Free credits (amount unstated), one key → 500+ models | Code by email | — |
| **OpenAI** | 1,250 Codex credits | Code by email | — |
| **AWS Kiro** | 50 credits/mo free tier + 500-credit new-user bonus; no card, no AWS account | Self-serve, sign in with GitHub/Google | Bonus valid 30 days |
| **Vercel** | $30 v0 credits per attendee | v0.app → profile → Credits → Redeem Code (emailed) | — |
| **LangChain / LangSmith** | $50 LangSmith credits + Deployments access | Airtable form (link in guide), enter hackathon as event, add card to LangSmith to display credits | Within 10 days |
| **ElevenLabs** | 1 month Creator plan | Coupon via Discord bot, matched to check-in email | — |

Not provided by any partner: **Anthropic/Claude credits**, AWS Strands/Bedrock, blob/object
storage, CI/CD, observability beyond LangSmith, anything Swift/iOS/macOS-specific.

## MongoDB tooling (the core)

Recommended sequence from the guide: install Agent Skills → connect MCP Server → keep the
natural-language prompting guide at hand.

| Tool | What it does | Link |
|---|---|---|
| **MongoDB Agent Skills** | Installable skills for Claude Code / Cursor / Copilot: connection, data modeling, queries, search best practices | https://www.mongodb.com/docs/agent-skills/ |
| **MongoDB MCP Server** (local) | Live inspect / query / counts / Atlas resource management from any agent | https://www.mongodb.com/docs/mcp-server/get-started/ |
| **Atlas Managed MCP Server** (hosted) | Same, via Atlas service accounts, "connect from any harness" | Described in guide, no link |
| Frontier Marketplace Connectors | Native Atlas access inside Claude, Codex, Cursor, Devin, Gemini | Described in guide, no link |
| NL → MongoDB queries guide | Prompting guidance | https://www.mongodb.com/docs/manual/natural-language-to-mongodb/ |
| **Atlas Vector Search** | Vector index over documents | https://www.mongodb.com/products/platform/atlas-vector-search |
| **Automated Embeddings** | In-database embedding generation and maintenance, no separate pipeline | https://www.mongodb.com/company/blog/product-release-announcements/unlocking-ai-search-introducing-automated-embedding-in-mongodb-vector-search |
| **Embedding & Reranking API** | Single HTTP endpoint, any stack (this is the Swift path) | https://www.mongodb.com/docs/api/doc/atlas-embedding-and-reranking-api/ |
| Atlas Search | Full-text | https://www.mongodb.com/docs/atlas/atlas-search/ |
| Data modeling | | https://www.mongodb.com/docs/manual/data-modeling/ |
| LangGraph + Atlas checkpoints | Graph state persisted in Atlas | https://www.mongodb.com/docs/atlas/ai-integrations/langgraph/build-agents/ |
| State & Persistence post | Checkpoints, suspend/resume, crash recovery, state vs memory | https://www.mongodb.com/company/blog/technical/state-persistence-the-problem-of-agent-reliability |
| Agent memory (Python / JS) | Chat memory patterns | https://www.mongodb.com/developer/products/atlas/advanced-rag-langchain-mongodb/ · https://www.mongodb.com/developer/products/atlas/add-memory-to-javascript-rag-application-mongodb-langchain/ |
| Agents with memory + function calling | | https://www.mongodb.com/developer/products/atlas/interactive-rag-mongodb-atlas-function-calling-api/ |
| Build AI Agents with MongoDB | | https://www.mongodb.com/docs/atlas/ai-agents/ |
| GraphRAG with LangChain | | https://www.mongodb.com/docs/atlas/ai-integrations/langchain/graph-rag/ |
| Starter code | GenAI Showcase, Python quickstart, MERN starter | https://github.com/mongodb-developer/GenAI-Showcase · https://github.com/mongodb-developer/mongodb-atlas-python-quickstart · https://github.com/mongodb-developer/mern-stack-example |
| After the hackathon | MongoDB for Startups: Atlas credits + Voyage tokens | https://www.mongodb.com/startups |

## Other partner tooling

| Partner | Tooling | Links |
|---|---|---|
| Voyage AI | Python client `pip install voyageai`; REST API; embeddings + reranking. Multimodal/image embedding models **not mentioned** in the guide — verify at docs.voyageai.com before relying on them. | https://docs.voyageai.com/docs/quickstart-tutorial · https://docs.voyageai.com/docs/rate-limits |
| LangChain | LangGraph (state/checkpoints), Deep Agents, LangSmith tracing | https://docs.langchain.com/oss/python/langgraph/overview · https://docs.langchain.com/oss/python/deepagents/quickstart · Notion hacker resources (link in guide) |
| AWS Kiro | Spec-driven coding agent: IDE, CLI, Crew | https://kiro.dev/ · https://kiro.dev/cli/ · https://kiro.dev/crew/ |
| Vercel | AI SDK (agent loops, tool calling, streaming), AI Gateway, v0 scaffolder, one-click deploy | https://ai-sdk.dev · https://vercel.com/docs/ai-gateway · https://v0.app/docs |
| ElevenLabs | Speech, agents, dubbing, SFX | Hacker Guide (Google Doc, link in resource guide) |

## Mapping partners onto 3PT

| Partner | 3PT slot | Why |
|---|---|---|
| **Atlas** (documents, Vector Search, Automated Embeddings, checkpoints) | **Media/Context store + harness memory** | Required. Holds media indexes and transcripts, hot/cold tier metadata, harness policies, checkpoints, retrospectives, measurements. |
| **MongoDB MCP Server + Agent Skills** | **Build** and **Instrument** | Gives the builder and instrumenter agents live DB access and MongoDB best practices; the instrumenter can check schema/index health directly. |
| **Voyage AI / Embedding & Reranking API** | **Media/Context store** | Embeds read-once transcripts and policy text; reranking for the Plan gateway's context selection. Plain HTTP works from Swift. |
| **LangGraph + Atlas checkpointer** | **Plan** | Off-the-shelf checkpointed state machine for the Plan → Build → Instrument loop, persisted in Atlas. |
| **LangSmith** | **Instrument / Measurement** | Tracing for every harness iteration; hard metric signals for the retrospective. |
| **OpenRouter** | **Plan / Build** | One key to route planner vs. builder vs. instrumenter across models; cheap fallbacks. |
| **OpenAI Codex** | **Build** | Extra coding-agent budget for the frontier builder. |
| **AWS Kiro** | **Build (alternate harness) / DevX** | A second harness for Build to wrap, which demonstrates the "meta-harness for any agent" claim. Spec-driven workflow fits Plan output. |
| **Vercel v0 / AI SDK** | **App/UI companion** | Fast public web inspector for judges if the Swift app is not ready; keep it secondary (dashboard cannot be the main feature). |
| **ElevenLabs** | **Demo** | Narration for the 1-minute video. Marginal for the core. |

## Gaps we must cover ourselves

- **Image bytes** need a store. Options: Atlas GridFS (in-sandbox, simplest for eligibility), or local filesystem with Atlas holding only indexes and transcripts. Nothing in the guide provides object storage.
- **CI/CD and the install loop** are entirely ours. See `docs/03-workflow.md`.
- **Swift** has no partner support. Talk to Atlas via the Data API / HTTP and to Voyage via REST.
