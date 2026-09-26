/* 3PT · the setup cascade Model — AUTHORED 2026-09-26. One record per slot in the order a fresh
   install fills them; each slot lists the provider options a non-technical person can pick from,
   the signup and key pages, the env keys the choice writes, the scripted step that stands it up,
   and the tool grants it satisfies (names from infra/README.md). Never a secret value: names only.
   Rendered by setup.html; source of record for the reasoning is docs/14-setup-cascade.md.
   Node-safe: defines globalThis.SETUP and does no DOM work. */
(function(){
  var G = (typeof globalThis!=='undefined'?globalThis:window);
  if (G.SETUP) return;
  var S = {};
  S.NS = 'tpt_setup_v1';
  S.PROVIDERS = {
    atlas:      { name:'MongoDB Atlas',        kind:'state',    signup:'https://cloud.mongodb.com/', keys:'https://cloud.mongodb.com/', credit:'Hackathon Sandbox cluster (required); MongoDB for Startups after', cost:'free', note:'Create the project from the sandbox email link; a cluster made anywhere else does not count.' },
    voyage:     { name:'Voyage AI',            kind:'embeddings', signup:'https://dashboard.voyageai.com/', keys:'https://dashboard.voyageai.com/organization/api-keys', credit:'200M embedding and reranking tokens per participant', cost:'free within allowance', note:'Add a payment method to unlock Tier 1 rate limits; not charged inside the allowance.' },
    atlasauto:  { name:'Atlas Automated Embeddings', kind:'embeddings', signup:'https://cloud.mongodb.com/', keys:'', credit:'part of the Sandbox', cost:'free', note:'Embeddings maintained in-database; no separate pipeline, no extra key.' },
    gridfs:     { name:'GridFS in the Sandbox', kind:'bytes',   signup:'', keys:'', credit:'part of the Sandbox', cost:'free; counts against cluster storage', note:'Default. Keeps every byte inside the required component.' },
    r2:         { name:'Cloudflare R2',        kind:'bytes',    signup:'https://dash.cloudflare.com/sign-up', keys:'https://dash.cloudflare.com/?to=/:account/r2/api-tokens', credit:'own account, free tier 10 GB', cost:'free tier', note:'Same account as the Pages projects and the Worker.' },
    s3:         { name:'AWS S3',               kind:'bytes',    signup:'https://portal.aws.amazon.com/billing/signup', keys:'https://console.aws.amazon.com/iam/home#/security_credentials', credit:'none in this hackathon', cost:'pay as you go', note:'Available as an option; nothing in the credit ledger funds it today.' },
    fs:         { name:'Local filesystem',     kind:'bytes',    signup:'', keys:'', credit:'—', cost:'free', note:'One machine only; not eligible as the demo store.' },
    openrouter: { name:'OpenRouter',           kind:'models',   signup:'https://openrouter.ai/', keys:'https://openrouter.ai/settings/keys', credit:'free credits by email code', cost:'per token after credits', note:'One key, 500+ models: route planner, builder and instrumenter across models.' },
    vercelgw:   { name:'Vercel AI Gateway',    kind:'models',   signup:'https://vercel.com/signup', keys:'https://vercel.com/docs/ai-gateway', credit:'the $30 is v0 credit, not gateway credit', cost:'per token', note:'One endpoint, provider fallbacks, spend limits; a second route beside OpenRouter.' },
    bedrock:    { name:'AWS Bedrock',          kind:'models',   signup:'https://portal.aws.amazon.com/billing/signup', keys:'https://console.aws.amazon.com/iam/home#/security_credentials', credit:'none in this hackathon', cost:'per token', note:'Option for a customer already on AWS; no allotment here.' },
    anthropic:  { name:'Anthropic direct',     kind:'models',   signup:'https://console.anthropic.com/', keys:'https://console.anthropic.com/settings/keys', credit:'none in this hackathon', cost:'per token', note:'Direct key for the builder when a harness needs it (Claude Code reads its own).' },
    cloudflare: { name:'Cloudflare Workers + Pages', kind:'compute', signup:'https://dash.cloudflare.com/sign-up', keys:'https://dash.cloudflare.com/profile/api-tokens', credit:'own account, free tiers', cost:'free tier', note:'The hub, the web inspector and the harness Worker (docs/13).' },
    vercel:     { name:'Vercel hosting',       kind:'compute',  signup:'https://vercel.com/signup', keys:'https://vercel.com/account/tokens', credit:'hobby tier free', cost:'free tier', note:'Fallback host for the web inspector.' },
    lambda:     { name:'AWS Lambda',           kind:'compute',  signup:'https://portal.aws.amazon.com/billing/signup', keys:'https://console.aws.amazon.com/iam/home#/security_credentials', credit:'none in this hackathon', cost:'pay as you go', note:'Option; the Worker entrypoints port to a handler, not built.' },
    local:      { name:'This machine',         kind:'compute',  signup:'', keys:'', credit:'—', cost:'free', note:'The install loop; where the demo actually runs today.' },
    github:     { name:'GitHub',               kind:'repo',     signup:'https://github.com/signup', keys:'https://github.com/settings/personal-access-tokens', credit:'public repo: free Actions minutes', cost:'free', note:'Fine-grained token, repo scope; checkpoints are tags.' },
    langsmith:  { name:'LangSmith',            kind:'tracing',  signup:'https://smith.langchain.com/', keys:'https://smith.langchain.com/settings', credit:'$50 via the Airtable form within 10 days', cost:'free tier then per trace', note:'Every stage run is one trace; Instrument reads it into M-*.' },
    notrace:    { name:'No tracing',           kind:'tracing',  signup:'', keys:'', credit:'—', cost:'free', note:'Instrument scores from Atlas measurements only.' },
    claudecode: { name:'Claude Code',          kind:'harness',  signup:'https://claude.ai/', keys:'', credit:'none provided; own subscription', cost:'subscription', note:'The default build harness the Build stage wraps.' },
    kiro:       { name:'AWS Kiro',             kind:'harness',  signup:'https://kiro.dev/', keys:'', credit:'50 credits/month + 500 new-user bonus, no AWS account, no card', cost:'free tier', note:'The alternate harness; proves the meta-harness claim.' },
    codex:      { name:'OpenAI Codex',         kind:'harness',  signup:'https://chatgpt.com/codex', keys:'https://platform.openai.com/api-keys', credit:'1,250 Codex credits by email code', cost:'credits', note:'Third harness option.' }
  };
  /* The cascade. order matters: each slot assumes the ones above it. */
  S.SLOTS = [
    { id:'state',      n:1, name:'Memory and state',     battery:'atlas',     required:true,  why:'Every stateful thing goes through Atlas: policies, checkpoints, media index, transcripts, measurements.',
      options:['atlas'], def:'atlas', env:{ atlas:['ATLAS_URI','ATLAS_DB'] }, script:'pnpm turbo run provision --filter=@3pt/battery-atlas', grants:['atlas.find','atlas.latest','atlas.insert','atlas.*','policy.write'], stages:['plan','build','instrument'] },
    { id:'embeddings', n:2, name:'Embeddings',           battery:'atlas',     required:true,  why:'Read-once transcripts become vectors so Plan can select context and Instrument can find prior retrospectives.',
      options:['atlasauto','voyage'], def:'atlasauto', env:{ voyage:['VOYAGE_API_KEY'], atlasauto:[] }, script:'pnpm turbo run provision --filter=@3pt/battery-atlas', grants:['atlas.find'], stages:['plan','instrument'] },
    { id:'bytes',      n:3, name:'Image bytes',          battery:'blob',      required:true,  why:'Bytes live here; tier metadata lives in Atlas. The transcriber reads once.',
      options:['gridfs','r2','s3','fs'], def:'gridfs', env:{ gridfs:['BLOB_BACKEND=gridfs'], r2:['BLOB_BACKEND=r2','CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','R2_BUCKET'], s3:['BLOB_BACKEND=s3','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION','S3_BUCKET'], fs:['BLOB_BACKEND=fs','BLOB_FS_ROOT'] }, script:'pnpm turbo run provision --filter=@3pt/battery-blob', grants:['blob.get','blob.put'], stages:['build'] },
    { id:'models',     n:4, name:'Model gateway',        battery:'gateway',   required:true,  why:'One route for the planner, the builder and the instrumenter, so the policy can move a stage to a cheaper model.',
      options:['openrouter','vercelgw','bedrock','anthropic'], def:'openrouter', env:{ openrouter:['OPENROUTER_API_KEY'], vercelgw:['AI_GATEWAY_API_KEY'], bedrock:['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION'], anthropic:['ANTHROPIC_API_KEY'] }, script:'pnpm turbo run provision --filter=@3pt/battery-gateway   # proposed battery, docs/14', grants:['model.plan','model.build','model.instrument'], stages:['plan','build','instrument'], proposed:true },
    { id:'harness',    n:5, name:'Build harness',        battery:'—',         required:true,  why:'Which coding agent the Build stage wraps. The meta-harness claim is that this is a switch.',
      options:['claudecode','kiro','codex'], def:'claudecode', env:{ claudecode:['THREEPT_HARNESS=claude-code'], kiro:['THREEPT_HARNESS=kiro'], codex:['THREEPT_HARNESS=codex'] }, script:'make build', grants:[], stages:['build'] },
    { id:'repo',       n:6, name:'Repository',           battery:'repo',      required:true,  why:'One worktree per iteration, one tag per checkpoint, rollback by tag.',
      options:['github'], def:'github', env:{ github:['GITHUB_TOKEN'] }, script:'pnpm turbo run provision --filter=@3pt/battery-repo', grants:['repo.worktree','repo.tag','repo.rollback','repo.instantiate'], stages:['build','instrument'] },
    { id:'tracing',    n:7, name:'Tracing',              battery:'tracing',   required:false, why:'Traces become the M-* measurements the retrospective scores.',
      options:['langsmith','notrace'], def:'langsmith', env:{ langsmith:['LANGSMITH_API_KEY','LANGSMITH_PROJECT'], notrace:[] }, script:'pnpm turbo run provision --filter=@3pt/battery-tracing', grants:['tracing.read','tracing.span'], stages:['instrument'] },
    { id:'compute',    n:8, name:'Where it runs',        battery:'—',         required:false, why:'The loop runs on a machine today; the Worker and Pages projects are the deployed form (docs/13).',
      options:['local','cloudflare','vercel','lambda'], def:'local', env:{ local:[], cloudflare:['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID'], vercel:['VERCEL_TOKEN'], lambda:['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION'] }, script:'node scripts/target.mjs list', grants:[], stages:[] }
  ];
  S.SEQUENCE = ['make install', 'cp .env.example .env   # then paste the keys below', 'make provision', 'make plan', 'make build', 'make instrument'];
  S.load = function(){ try{ return JSON.parse(localStorage.getItem(S.NS)||'{}'); }catch(e){ return {}; } };
  S.save = function(v){ try{ localStorage.setItem(S.NS, JSON.stringify(v)); }catch(e){} };
  S.choice = function(state, slot){ return (state[slot.id]&&state[slot.id].provider)||slot.def; };
  S.envFor = function(state){
    var lines=['# 3PT .env — generated by the setup cascade (setup.html); values are yours to paste. Never commit .env.'];
    S.SLOTS.forEach(function(sl){ var c=S.choice(state,sl); var keys=sl.env[c]||[]; if(!keys.length) return; lines.push('', '# '+sl.n+' · '+sl.name+' · '+S.PROVIDERS[c].name); keys.forEach(function(k){ lines.push(k.indexOf('=')>-1 ? k : k+'='); }); });
    return lines.join('\n');
  };
  G.SETUP = S;
})();
