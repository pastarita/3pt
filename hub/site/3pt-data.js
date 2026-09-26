/* 3PT · the Model — AUTHORED. One shared data layer every leaf reads.
   Register of documents + cluster registry + lanes + ICP directions with scored criteria + presets.
   Node-safe: defines globalThis.T and does no DOM work.
   Hot-leaf state lives in localStorage under the `tpt_` prefix (see AGENTS.md). */
(function(){
  var T = {};
  T.NS = 'tpt_';
  T.PROGRAM = { name:'3PT', long:'Three Point Harness', principals:['Patrick','Yash'],
    started:'2026-09-26', event:'MongoDB × Cerebral Valley · Harness Engineering & Model Wrangling Hackathon',
    venue:'The Malin Chelsea, NYC', repo:'https://github.com/pastarita/3pt' };

  /* Event clock — the hub's countdown band derives from these. ISO with offset; all ET. */
  T.EVENT = {
    hacking:    '2026-09-26T10:30:00-04:00',
    submission: '2026-09-26T17:00:00-04:00',
    judging:    '2026-09-26T17:15:00-04:00',
    top6:       '2026-09-26T19:00:00-04:00',
    showcase:   '2026-09-30T10:00:00-04:00'
  };

  /* Cluster registry — clusters are records and are PHASES of the operation, never file types.
     GROUPS in nav.js, hub headings, card accents and prose all key into this one object. */
  T.CLUSTERS = {
    orient: { label:'Orient', color:'var(--violet)', blurb:'What 3PT is, what the rules allow, and why the harness is the product.' },
    decide: { label:'Decide', color:'var(--cyan)',   blurb:'Who we build for today. Directions scored, not guessed.' },
    build:  { label:'Build',  color:'var(--amber)',  blurb:'Lanes, owners, the workflow, and the partner tooling we run on.' },
    record: { label:'Record', color:'var(--slate)',  blurb:'What shipped, what did not move, and the words we use.' }
  };

  /* The Register — one record per document of record. id = spoken ordinal, slug = join key
     (stable forever), doc = the markdown source read through view.html?f= */
  T.DOCS = [
    { id:'D0', slug:'vision',         name:'Vision',               verb:'Framing',   cluster:'orient', temp:'warm', doc:'docs/00-vision.md',
      epigram:'Plan, Build, Instrument. The harness is the product; images are the workload.' },
    { id:'D6', slug:'goal',           name:'Goal & use case',      verb:'Aiming',    cluster:'orient', temp:'warm', doc:'docs/06-goal-and-use-case.md',
      epigram:'More valuable the longer it runs. The interior-design firm, and the screen as onboarding.' },
    { id:'D5', slug:'rules',          name:'Rules & judging',      verb:'Complying', cluster:'orient', temp:'hot',  doc:'docs/05-rules.md',
      epigram:'Banned: image analyzers, dashboards as the feature, basic RAG. Due 5:00 PM.' },
    { id:'D8', slug:'icp-directions', name:'ICP directions',       verb:'Exploring', cluster:'decide', temp:'warm', doc:'docs/08-icp-directions.md',
      epigram:'Five directions, each with focus, use case, company type, and lander messaging.' },
    { id:'D7', slug:'assessment',     name:'Assessment & measurement', verb:'Measuring', cluster:'decide', temp:'warm', doc:'docs/07-assessment-and-measurement.md',
      epigram:'Theses and hypotheses from the transcript, the M-* metric system, and the R-* requirement set mapped to partner incentives.' },
    { id:'D1', slug:'icp',            name:'ICPs',                 verb:'Choosing',  cluster:'decide', temp:'warm', doc:'docs/01-icp.md',
      epigram:'Three profiles, re-ranked against the rules.' },
    { id:'D2', slug:'lanes-doc',      name:'Lanes',                verb:'Dividing',  cluster:'build',  temp:'warm', doc:'docs/02-lanes.md',
      epigram:'Five lanes plus the resources scan. Owners marked TBD until assigned.' },
    { id:'D3', slug:'workflow',       name:'Workflow',             verb:'Shipping',  cluster:'build',  temp:'warm', doc:'docs/03-workflow.md',
      epigram:'Repo layout, the pipeline skeleton, DevX, and the install loop.' },
    { id:'D4', slug:'resources',      name:'Resources & credits',  verb:'Provisioning', cluster:'build', temp:'warm', doc:'docs/04-resources.md',
      epigram:'Every partner, credit, MCP, and which 3PT slot it fills.' },
    { id:'DB', slug:'brainstorming',  name:'Brainstorming transcript', verb:'Recording', cluster:'record', temp:'cold', doc:'brainstorming.md',
      epigram:'Raw session notes, as spoken, append-only. Assessed in D7.' },
    { id:'DS', slug:'sources',        name:'Resource guide (verbatim)', verb:'Citing',   cluster:'record', temp:'cold', doc:'docs/sources/hackathon-resource-guide.md',
      epigram:'The official partner resource guide, pulled 2026-09-26. Upstream is the Google Doc.' },
    { id:'DG', slug:'glossary',       name:'Glossary',             verb:'Naming',    cluster:'record', temp:'cold', doc:'docs/glossary.md',
      epigram:'Install loop, backfeed, furnace, left and right sides of the triangle.' },
    { id:'D9', slug:'provenance',     name:'Provenance DSL',       verb:'Tracing',   cluster:'record', temp:'warm', doc:'docs/09-provenance.md',
      epigram:'Segment markers in the transcript, @cites everywhere else, one tool that refuses broken pointers.' },
    { id:'DR', slug:'charter',        name:'README',               verb:'Entering',  cluster:'record', temp:'cold', doc:'README.md',
      epigram:'The repo front door.' }
  ];

  /* Lanes — AUTHORED defaults from docs/02-lanes.md. The lane board overlays owner, status and
     next action from localStorage. status ladder: open → active → done | blocked */
  T.PEOPLE = ['TBD','Patrick','Yash','Both'];
  T.STATUS = {
    open:    { glyph:'○', label:'open',    weight:0,    cls:'s0' },
    active:  { glyph:'◐', label:'active',  weight:0.5,  cls:'s2' },
    done:    { glyph:'●', label:'done',    weight:1,    cls:'s3' },
    blocked: { glyph:'—', label:'blocked', weight:null, cls:'s4' }
  };
  T.STATUS_ORDER = ['open','active','done','blocked'];
  T.LANES = [
    { key:'repo',      n:1, name:'Repo setup',             owner:'Patrick', status:'active',
      deliverable:'Public repo, agent context, docs of record, Atlas Sandbox project + cluster, .env.example',
      next:'Flip repo to public. Create the Atlas Sandbox project. Add Yash as collaborator.' },
    { key:'icp',       n:2, name:'ICP definition',         owner:'TBD',     status:'active',
      deliverable:'One demo persona chosen; docs/01-icp.md and 07-icp-directions.md agreed',
      next:'Walk the ICP explorer together; pick the direction that holds under every preset.' },
    { key:'context',   n:3, name:'Agent contextualization',owner:'TBD',     status:'open',
      deliverable:'Every agent loads the same definitions; MongoDB Agent Skills installed; MCP servers connected on both machines',
      next:'Install MongoDB Agent Skills; connect MCP Server to the sandbox cluster.' },
    { key:'workflow',  n:4, name:'Workflow & pipeline',    owner:'TBD',     status:'open',
      deliverable:'Codebase conventions, DevX, Plan → Build → Instrument skeleton writing to Atlas, install loop design',
      next:'Stand up the Atlas collections (policies, checkpoints, media_index, transcripts, measurements).' },
    { key:'swift',     n:5, name:'Swift app basis',        owner:'TBD',     status:'open',
      deliverable:'Minimal SwiftUI inspector wired to Atlas, install loop running between both machines',
      next:'Deliberately not started until Lane 4 writes to Atlas.' },
    { key:'resources', n:6, name:'Resources scan',         owner:'Both',    status:'done',
      deliverable:'Partners, MCPs, credits, and the mapping onto 3PT slots',
      next:'Redeem codes as they arrive by email / Discord (from 10:30 AM).' },
    { key:'hub',       n:7, name:'Hub workspace',          owner:'Patrick', status:'active',
      deliverable:'Gated Cloudflare Pages hub over the docs of record, lane board, ICP explorer, CI',
      next:'Set ACCESS_PASS + GitHub secrets; add Yash to the gate allowlist.' }
  ];

  /* ICP directions — the option algebra. Scores are AUTHORED estimates (0–5) per criterion;
     rank = Σ(w·s) / (Σw × 5) is DERIVED at render time. Qualitative briefs live in
     docs/07-icp-directions.md — the doc is the source of record, this is the scoring layer. */
  T.CRITERIA = [
    { key:'fit1',   label:'Fit to Statement One',      tip:'How visibly the harness rewriting its own rules, context policies and tool access shows up in this direction.' },
    { key:'rule',   label:'Distance from banned list',tip:'5 = nobody could mistake it for an image analyzer, a dashboard, or basic RAG.' },
    { key:'demo',   label:'Demo-able by 5 PM',         tip:'Can a 3-minute live demo with Atlas as memory exist today.' },
    { key:'depth',  label:'Technical depth story',     tip:'Implementation difficulty as judges score it: more than a few prompts away.' },
    { key:'impact', label:'Real pain, will pay',       tip:'Does the company type have the problem now and a budget for it.' },
    { key:'media',  label:'Media-heavy & repetitive',  tip:'Volume of media plus repetition — the fuel the harness learns from.' },
    { key:'data',   label:'Sample data today',         tip:'Can we get realistic files into Atlas in the next two hours.' },
    { key:'story',  label:'Lander clarity',            tip:'Can the headline, subhead and three value props be written without a paragraph of setup.' },
    { key:'expand', label:'Expansion path',            tip:'How naturally this ICP leads to the adjacent ones.' }
  ];
  T.DIRECTIONS = [
    { key:'interior',     name:'Interior design studio',         who:'Yash',    company:'10–40 person residential/commercial interiors studio producing renders, CAD, mood boards, FF&E schedules',
      headline:'Your studio already drew that wall. 3PT remembers.',
      scores:{ fit1:4, rule:4, demo:3, depth:4, impact:4, media:5, data:3, story:5, expand:4 } },
    { key:'construction', name:'Construction GC / specialty sub', who:'Patrick', company:'General contractor or specialty subcontractor with daily site photos, submittals, RFIs, as-builts, and drone captures',
      headline:'Every site photo becomes a lesson your next job already knows.',
      scores:{ fit1:4, rule:4, demo:2, depth:4, impact:5, media:4, data:2, story:4, expand:4 } },
    { key:'agency',       name:'Advertising & marketing agency',  who:'Yash',    company:'Creative-ops team at an agency or in-house brand studio with large creative libraries and performance data',
      headline:'A creative library that learns what your team keeps remaking.',
      scores:{ fit1:3, rule:2, demo:3, depth:3, impact:4, media:5, data:4, story:4, expand:3 } },
    { key:'architecture', name:'Architecture / AEC practice',     who:'Both',    company:'Architecture practice bridging design and construction: BIM models, drawing sets, renders, site documentation',
      headline:'From concept render to as-built, one harness that keeps learning your practice.',
      scores:{ fit1:4, rule:4, demo:2, depth:4, impact:4, media:5, data:2, story:4, expand:5 } },
    { key:'pipeline',     name:'Media-pipeline engineering team', who:'Both',    company:'ML / data engineers who run classification, segmentation, extraction pipelines over large image corpora and want their own harness',
      headline:'The harness that builds and rebuilds your media pipeline.',
      scores:{ fit1:5, rule:5, demo:4, depth:5, impact:3, media:4, data:4, story:2, expand:3 } }
  ];
  /* Named option vectors — a preset is a record, rendered into live dials. Weights 0–5. */
  T.PRESETS = {
    'Judges today':   { fit1:5, rule:5, demo:5, depth:4, impact:3, media:2, data:3, story:2, expand:1 },
    'Venture story':  { fit1:2, rule:2, demo:1, depth:2, impact:5, media:4, data:1, story:5, expand:5 },
    'Feasibility':    { fit1:3, rule:4, demo:5, depth:2, impact:2, media:2, data:5, story:2, expand:1 },
    'Balanced':       { fit1:3, rule:3, demo:3, depth:3, impact:3, media:3, data:3, story:3, expand:3 }
  };

  /* helpers */
  T.doc = function(id){ for (var i=0;i<T.DOCS.length;i++) if (T.DOCS[i].id===id||T.DOCS[i].slug===id) return T.DOCS[i]; return null; };
  T.rank = function(scores, w){ var num=0, den=0; for (var k in w) { if (!(k in scores)) continue; num += w[k]*scores[k]; den += w[k]; } return den ? num/(den*5) : 0; };
  T.load = function(key, fallback){ try{ var v=localStorage.getItem(T.NS+key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } };
  T.save = function(key, val){ try{ localStorage.setItem(T.NS+key, JSON.stringify(val)); }catch(e){} };
  T.esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  T.until = function(iso){ var ms = new Date(iso) - new Date(); var neg = ms<0; ms=Math.abs(ms); var h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4); return { neg:neg, h:h, m:m, text:(neg?'−':'')+(h?h+'h ':'')+m+'m' }; };

  (typeof globalThis!=='undefined'?globalThis:window).T = T;
})();
