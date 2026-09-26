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
    { id:'DL', slug:'checklist',      name:'Open-source checklist', verb:'Clearing',  cluster:'orient', temp:'hot',  doc:'docs/15-open-source-checklist.md',
      epigram:'Admissibility, hygiene, the submission package. Every row wears a status and names the command that checks it.' },
    { id:'DQ', slug:'decisions',      name:'Group decisions',      verb:'Deciding',  cluster:'decide', temp:'hot',  doc:'docs/12-decisions.md',
      epigram:'Nine domains, a few questions each, a default if time runs out, and a blank line for the answer.' },
    { id:'D8', slug:'icp-directions', name:'ICP directions',       verb:'Exploring', cluster:'decide', temp:'warm', doc:'docs/08-icp-directions.md',
      epigram:'Five directions, each with focus, use case, company type, and lander messaging.' },
    { id:'DD', slug:'design-system', name:'Design system',        verb:'Styling',   cluster:'decide', temp:'hot',  doc:'design-system.html',
      epigram:'Six pieces, three canonical directions, the invariants, and the promenade by which the design system for the whole monorepo gets decided.' },
    { id:'D7', slug:'assessment',     name:'Assessment & measurement', verb:'Measuring', cluster:'decide', temp:'warm', doc:'docs/07-assessment-and-measurement.md',
      epigram:'Theses and hypotheses from the transcript, the M-* metric system, and the R-* requirement set mapped to partner incentives.' },
    { id:'D1', slug:'icp',            name:'ICPs',                 verb:'Choosing',  cluster:'decide', temp:'warm', doc:'docs/01-icp.md',
      epigram:'Three profiles, re-ranked against the rules.' },
    { id:'D2', slug:'lanes-doc',      name:'Lanes',                verb:'Dividing',  cluster:'build',  temp:'warm', doc:'docs/17-term-2-lanes.md',
      epigram:'Term 2: six lanes to 5 PM with a gate each, the checkpoint criterion, and what each principal needs. L1–L7 closed.' },
    { id:'D3', slug:'workflow',       name:'Workflow',             verb:'Shipping',  cluster:'build',  temp:'warm', doc:'docs/03-workflow.md',
      epigram:'Repo layout, the pipeline skeleton, DevX, and the install loop.' },
    { id:'DA', slug:'architecture-doc', name:'Architecture',        verb:'Structuring', cluster:'build', temp:'hot', doc:'docs/10-architecture.md',
      epigram:'Three lanes (ui, harness, infra), Turborepo inside each, batteries injected at the edge; eight Mermaid perspectives and the extension recipes.' },
    { id:'DC', slug:'ci',             name:'CI & deployment',      verb:'Shipping',  cluster:'build',  temp:'hot',  doc:'docs/13-ci-and-deployment.md',
      epigram:'Build and deploy infrastructure, the topology, what each credit can actually fund, the herald that guards branching, and the target resolver.' },
    { id:'DP', slug:'setup-doc',      name:'Setup cascade',        verb:'Standing up', cluster:'build', temp:'hot',  doc:'docs/14-setup-cascade.md',
      epigram:'Eight slots, provider options per slot, signup and key links, the env keys and scripted step each choice drives; the proposed gateway battery.' },
    { id:'DT', slug:'strands',        name:'Strands archaeology',  verb:'Grounding',  cluster:'build', temp:'hot', doc:'docs/12-strands-archaeology.md',
      epigram:'Build on Strands, rebuild nothing: source register, capability ledger, strike list, and the handles we speak.' },
    { id:'DW', slug:'strands-diagrams', name:'Strands, drawn',    verb:'Learning',   cluster:'build', temp:'hot', doc:'docs/13-strands-diagrams.md',
      epigram:'Ten Mermaid diagrams of the Strands systems we build on: packages, layers, the loop and its hooks, stop reasons, routing, persistence, control, multi-agent, evals and the optimizer, the ten seams.' },
    { id:'DJ', slug:'strands-questions', name:'Strands questions', verb:'Answering', cluster:'build', temp:'hot', doc:'docs/16-strands-questions.md',
      epigram:'Four questions of the Strands basis (configure, fine-tune, self-improve, media workflow), each answered and pinned to the docs, the code, and Strands; the gaps the pointers expose.' },
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

  /* Lanes — AUTHORED defaults from docs/17-term-2-lanes.md §5 (term 2, opened 14:15 ET). The lane board overlays
     owner, status and next action from localStorage. status ladder: open → active → done | blocked */
  T.PEOPLE = ['TBD','Patrick','Yash','Both'];
  T.STATUS = {
    open:    { glyph:'○', label:'open',    weight:0,    cls:'s0' },
    active:  { glyph:'◐', label:'active',  weight:0.5,  cls:'s2' },
    done:    { glyph:'●', label:'done',    weight:1,    cls:'s3' },
    blocked: { glyph:'—', label:'blocked', weight:null, cls:'s4' }
  };
  T.STATUS_ORDER = ['open','active','done','blocked'];
  T.LANES = [
    { key:'t1-atlas',   n:1, name:'Loop on Atlas',           owner:'Patrick', status:'blocked',
      deliverable:'3pt loop with ATLAS_URI writes cp/1 to checkpoints in the Sandbox cluster; rollback returns v0. Earns Technical Demo 35%. Slot 15:15',
      next:'Create the Sandbox project and M0 cluster from the sandbox email link; put ATLAS_URI in .env; run the loop.' },
    { key:'t2-photos',  n:2, name:'Photos through the loop', owner:'Yash',    status:'open',
      deliverable:'media_index seeded from the 117 photos; one Instrument pass rewrites a context policy over them. Earns Impact 20%. Slot 15:45',
      next:'Wait for T1 collections; seed from scripts/mock/export.mjs; run one Instrument pass and keep the diff.' },
    { key:'t3-surface', n:3, name:'The judges\' surface',    owner:'Yash',    status:'open',
      deliverable:'App prototype or Simulator reads harness versions from Atlas; approve and roll back work; demo link opens without login. Slot 16:00',
      next:'Point the Simulator at Atlas instead of the mock; deploy an ungated preview for the demo link.' },
    { key:'t4-story',   n:4, name:'The difficulty story',    owner:'Patrick', status:'active',
      deliverable:'Strands journey answers the four questions with pointers and passes hub check; one-page Q&A crib. Earns Implementation Difficulty 30%. Slot 15:30',
      next:'Finish the journey leaf under budget; write the Q&A crib: state machine, checkpointing, policy compiler, negotiation.' },
    { key:'t5-pitch',   n:5, name:'Demo, video, pitch',      owner:'Both',    status:'open',
      deliverable:'Demo script from the Direction shot list; 60-second video with audio; description text; Decided lines in docs/12; rehearsed twice. Slot 16:30',
      next:'Write the script now; shoot after T1\'s gate; fill Decided: in docs/12-decisions.md §1, §2, §9.' },
    { key:'t6-green',   n:6, name:'Green main, hygiene',     owner:'Patrick', status:'active',
      deliverable:'Yash\'s commits pulled, skill drift resolved, dirty tree committed in segments, make check green, CI secrets set, checklist rows ticked, photo credits. Slot 16:15',
      next:'Pull origin/main; reconcile the vendored skill; commit the tree by lane; fix the lockfile or keep strands excluded; set the two Cloudflare secrets.' }
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
