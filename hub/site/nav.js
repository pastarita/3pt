/* 3PT · shared nav shell — the single source of IA.
   Desktop (>900px): fixed left rail grouped by phase, custom SVG glyph per leaf, collapsible
   (persisted as tpt_nav). Mobile (≤900px): sticky header + hamburger. Hidden on print.
   Adding a page = ONE entry in GROUPS below (+ a glyph, + a hub card).
   Hrefs ALWAYS carry .html and NEVER branch on the page's own location (see skill → Link resolution).
   Node-safe: exports globalThis.TPTNAV and returns before any DOM work when `document` is absent,
   so tools/check-nav.mjs can import it. */
(function(){
  var G = (typeof globalThis!=='undefined'?globalThis:window);
  if (G.TPTNAV) return;

  function g(d){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';}
  /* one unique hand-drawn glyph per leaf — this IS the project's iconography */
  var GLYPH = {
    'index':          g('<path d="M12 3.5l8.5 15h-17Z"/><circle cx="12" cy="3.5" r="1.4" fill="currentColor"/><circle cx="20.5" cy="18.5" r="1.4" fill="currentColor"/><circle cx="3.5" cy="18.5" r="1.4" fill="currentColor"/>'),
    'vision':         g('<path d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5S3 12 3 12Z"/><path d="M12 3v2.5M12 18.5V21"/><circle cx="12" cy="12" r="2.4"/>'),
    'goal':           g('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M12 3.5v3M20.5 12h-3"/>'),
    'rules':          g('<path d="M6 3h12v18H6Z"/><path d="M9 8h6M9 11.5h6M9 15h3"/><path d="M15.5 14.5l1.5 1.5 3-3"/>'),
    'submission':     g('<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 9l8 5 8-5"/><path d="M9 21h6"/>'),
    'use-case':       g('<path d="M3 20h18"/><path d="M5 20V9l7-5 7 5v11"/><path d="M9 20v-6h6v6"/>'),
    'checklist':      g('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z"/><path d="M9 12l2 2 4-4"/>'),
    'decisions':      g('<path d="M12 4v16"/><path d="M5 8l7-4 7 4"/><path d="M4 14h5l1.5 3h3L15 14h5"/><circle cx="12" cy="20" r="1.4" fill="currentColor"/>'),
    'icp-explorer':   g('<path d="M4 20V10M9 20V5M14 20v-8M19 20V7"/><path d="M2.5 20h19"/><circle cx="9" cy="5" r="1.3" fill="currentColor"/>'),
    'icp-directions': g('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
    'icp':            g('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.5-4 3-6 6-6s5.5 2 6 6"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15 18.5c.3-2.5 1.4-4 3.5-4 1.2 0 2.1.5 2.7 1.3"/>'),
    'lanes':          g('<path d="M4 4v16M10 4v16M16 4v16M22 4v16"/><path d="M6 8h2M12 12h2M18 16h2" stroke-width="2.4"/>'),
    'lanes-doc':      g('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="7" cy="6" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5"/><circle cx="17" cy="18" r="1.5"/>'),
    'workflow':       g('<path d="M4 6h5v5H4ZM15 6h5v5h-5ZM9.5 15h5v5h-5Z"/><path d="M9 8.5h6M6.5 11v2.5a1.5 1.5 0 0 0 1.5 1.5h1.5M17.5 11v2.5a1.5 1.5 0 0 1-1.5 1.5h-1.5"/>'),
    'resources':      g('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
    'assessment':     g('<path d="M4 20h16"/><path d="M6 16l4-5 3 3 5-7"/><circle cx="18" cy="7" r="1.4" fill="currentColor"/><path d="M4 4v16"/>'),
    'brainstorming':  g('<path d="M12 3a6 6 0 0 1 3.5 10.9V16h-7v-2.1A6 6 0 0 1 12 3Z"/><path d="M9.5 19h5M10.5 21.5h3"/><path d="M10 9.5c.5-1.5 3.5-1.5 4 0"/>'),
    'sources':        g('<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4"/><path d="M8 12h8M8 15.5h8"/><path d="M3 8v13h12" stroke-dasharray="2 2"/>'),
    'changelog':      g('<path d="M4 4h16v16H4Z"/><path d="M8 9h8M8 12.5h8M8 16h5"/><path d="M12 2v4"/>'),
    'timeline':       g('<path d="M12 3v18"/><circle cx="12" cy="6.5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="17.5" r="1.8" fill="currentColor"/><path d="M14.5 6.5h5M4.5 12h5M14.5 17.5h5"/>'),
    'provenance':     g('<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M7.6 16.4L16.4 7.6M8.2 18h7.6"/><path d="M6 15.8V9a3 3 0 0 1 3-3h6.8"/>'),
    'glossary':       g('<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z"/><path d="M5 18a2 2 0 0 1 2-2h11"/><path d="M9 8h5M9 11h5"/>'),
    'charter':        g('<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4"/><path d="M9 11h7M9 14.5h7M9 18h4"/>'),
    'direction':      g('<path d="M4 19.5l8-14 8 14Z"/><path d="M12 16.5v-6M9.5 13l2.5-2.5 2.5 2.5"/>'),
    'how-it-works':   g('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.8 3.8v3.4h-3.4"/><circle cx="8.6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3"/><circle cx="15.4" cy="12" r="1.3" fill="currentColor"/>'),
    'architecture':   g('<path d="M3 6h5v5H3ZM9.5 3h5v5h-5ZM16 6h5v5h-5Z"/><path d="M5.5 11v3.5h13V11"/><path d="M12 8v6.5"/><path d="M8 18h8M6 21h12" stroke-dasharray="2 2"/>'),
    'strands':        g('<path d="M4 12c2-5 5-5 8 0s6 5 8 0"/><path d="M4 12c2 5 5 5 8 0s6-5 8 0"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>'),
    'strands-diagrams': g('<path d="M4 12c2-5 5-5 8 0s6 5 8 0"/><path d="M5 5h4v4H5ZM15 15h4v4h-4Z"/><path d="M9 7h6M9 17h6" stroke-dasharray="2 2"/>'),
    'architecture-doc': g('<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4"/><path d="M8 12h3v3H8ZM13 12h3v3h-3Z"/><path d="M11 13.5h2"/>'),
    'setup':          g('<path d="M12 3.5l8.5 15h-17Z"/><circle cx="12" cy="13" r="2.6"/><path d="M12 10.4V3.5M13.8 14.6l6.7 3.9M10.2 14.6l-6.7 3.9"/>'),
    'setup-doc':      g('<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4"/><path d="M8 12h8M8 15.5h5"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/>'),
    'components':     g('<rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="4" rx="1.5"/><rect x="13" y="10" width="8" height="10" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/>'),
    'icons':          g('<path d="M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4Z"/><circle cx="17" cy="17" r="3"/><path d="M7 7h0M17 7h0" stroke-width="2.4"/>'),
    'strands-journey': g('<path d="M3 12h18"/><circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/><path d="M6 12V6.5h4M12 12v5.5h4M18 12V6.5"/><path d="M18 4.5v.01" stroke-width="2.4"/>'),
    'strands-questions': g('<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4"/><path d="M9.8 11.2a2.2 2.2 0 1 1 3.3 1.9c-.8.5-1.1.9-1.1 1.7"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>'),
    'sketches':       g('<path d="M4 18l4-10 4 10"/><path d="M14 8h6M14 12h6M14 16h4"/><path d="M3 21h18" stroke-dasharray="2 2"/>'),
    'design-spec':    g('<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4"/><path d="M8 12h3v3H8Z"/><path d="M13 12h3M13 15h3M8 18h8"/>'),
    'design-system':  g('<path d="M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4Z"/><circle cx="16.5" cy="16.5" r="3.5"/><path d="M6 8.5l2-2 2 2M15 6.5h3"/>'),
    'tour':           g('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 9.5v5l4-2.5Z" fill="currentColor"/><path d="M3 8.5a9 9 0 0 0 0 7M21 8.5a9 9 0 0 1 0 7"/>'),
    'app':            g('<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 8h18"/><rect x="6" y="11" width="5" height="5"/><path d="M14 12h4M14 15h3"/>'),
    'ci':             g('<path d="M4 6h6v6H4ZM14 6h6v6h-6ZM9 15h6v6H9Z"/><path d="M10 9h4M7 12v3h5M17 12v3h-5"/><circle cx="12" cy="18" r="1" fill="currentColor"/>'),
    'sim':            g('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5Z"/>'),
    'view':           g('<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/>')
  };

  /* Cluster registry — mirrors T.CLUSTERS keys in 3pt-data.js. The Shell keeps its own copy
     so it can render before the Model loads; keys MUST match (checked by tools/check-nav.mjs). */
  var CLUSTERS = {
    orient: { label:'Orient', color:'#8b7cf6' },
    decide: { label:'Decide', color:'#3aa6d9' },
    build:  { label:'Build',  color:'#e0a33a' },
    record: { label:'Record', color:'#7d8a99' }
  };

  /* Sidebar entries: [slug, label, id?]. id is the spoken ordinal rendered in the row.
     REGISTERING A LEAF = ONE ENTRY HERE. */
  /* document twins of the orient leaves share the leaf's glyph */
  ['vision','goal','rules','checklist','submission'].forEach(function(k){ GLYPH[k+'-doc'] = GLYPH[k]; });

  var GROUPS = [
    ['',       [['index','Hub']]],
    ['orient', [['charter','README','DR'], ['vision','Vision'], ['goal','Goal'], ['use-case','Use case'], ['rules','Rules & judging'], ['checklist','Open-source checklist'], ['submission','Submission'],
                ['vision-doc','Vision doc','D0'], ['goal-doc','Goal & use case doc','D6'], ['rules-doc','Rules doc','D5'], ['checklist-doc','Checklist doc','DL'], ['submission-doc','Submission doc','DU']]],
    ['decide', [['decisions','Group decisions','DQ'], ['direction','Direction'], ['design-system','Design system','DD'], ['design-spec','Design system spec','DK'], ['sketches','Sketch gallery'], ['icons','Icons'], ['components','Components'], ['icp-explorer','ICP explorer'], ['icp-directions','ICP directions','D8'], ['assessment','Assessment','D7'], ['icp','ICPs','D1']]],
    ['build', [['tour','Product tour & demo'], ['app','App prototype'], ['sim','Simulator'], ['lanes','Lane board'], ['setup','Setup cascade'], ['setup-doc','Setup cascade doc','DP'], ['lanes-doc','Lanes','D2'], ['workflow','Workflow','D3'], ['ci','CI & deployment','DC'], ['how-it-works','How it works'], ['architecture','Architecture'], ['architecture-doc','Architecture doc','DA'], ['strands','Strands archaeology','DT'], ['strands-diagrams','Strands, drawn','DW'], ['strands-journey','Strands, answered'], ['strands-questions','Strands questions','DJ'], ['resources','Resources & credits','D4']]],
    ['record', [['changelog','Changelog'], ['timeline','Timeline'], ['brainstorming','Brainstorming','DB'], ['provenance','Provenance DSL','D9'], ['sources','Resource guide','DS'], ['glossary','Glossary','DG']]]
  ];
  /* ROUTE: slugs that are not their own .html file. Documents route through the Viewer. */
  var ROUTE = {
    'ci':             'view.html?f=docs/13-ci-and-deployment.md',
    'design-spec':    'view.html?f=docs/19-design-system-spec.md',
    'setup-doc':      'view.html?f=docs/14-setup-cascade.md',
    'vision-doc':     'view.html?f=docs/00-vision.md',
    'goal-doc':       'view.html?f=docs/06-goal-and-use-case.md',
    'rules-doc':      'view.html?f=docs/05-rules.md',
    'checklist-doc':  'view.html?f=docs/15-open-source-checklist.md',
    'submission-doc': 'view.html?f=docs/18-submission.md',
    'decisions':      'view.html?f=docs/12-decisions.md',
    'icp-directions': 'view.html?f=docs/08-icp-directions.md',
    'assessment':     'view.html?f=docs/07-assessment-and-measurement.md',
    'brainstorming':  'view.html?f=brainstorming.md',
    'sources':        'view.html?f=docs/sources/hackathon-resource-guide.md',
    'icp':            'view.html?f=docs/01-icp.md',
    'lanes-doc':      'view.html?f=docs/17-term-2-lanes.md',
    'workflow':       'view.html?f=docs/03-workflow.md',
    'architecture-doc': 'view.html?f=docs/10-architecture.md',
    'strands':        'view.html?f=docs/12-strands-archaeology.md',
    'strands-diagrams': 'view.html?f=docs/13-strands-diagrams.md',
    'strands-questions': 'view.html?f=docs/18-strands-questions.md',
    'resources':      'view.html?f=docs/04-resources.md',
    'glossary':       'view.html?f=docs/glossary.md',
    'charter':        'view.html?f=README.md',
    'provenance':     'view.html?f=docs/09-provenance.md'
  };
  /* PUBLISHED: every surface of this project that exists outside the repo, with its state. AUTHORED;
     the steward edits it at each checkpoint (docs/17 §1 K2). state: live | gated | public | open | pending */
  var PUBLISHED = [
    { k:'hub',    label:'Hub',            url:'https://3pt.pages.dev',                                              state:'gated',   note:'Access · PIN' },
    { k:'repo',   label:'Repo',           url:'https://github.com/pastarita/3pt',                                   state:'public',  note:'MIT' },
    { k:'atlas',  label:'Atlas Sandbox',  url:'',                                                                   state:'live',    note:'Cluster0 · M10 · user pending' },
    { k:'demo',   label:'Demo link',      url:'https://3pt-web.pages.dev',                                          state:'public',  note:'ungated' },
    { k:'api',    label:'Harness API',    url:'https://3pt-harness.3pt-worker.workers.dev',                                        state:'public',  note:'Worker' },
    { k:'video',  label:'Video',          url:'',                                                                   state:'pending', note:'T5 · 60 s' },
    { k:'form',   label:'Submission',     url:'https://cerebralvalley.ai/e/mongodb-nyc-hackathon/hackathon/submit', state:'open',    note:'due 17:00 ET' }
  ];
  var PUBSTATE = { live:['●','#3fb886'], public:['●','#3fb886'], gated:['◐','#e0a33a'], open:['◐','#e0a33a'], pending:['○','#6b7684'] };

  var PATH  = {};  /* slug → 'nested/dir/' for leaves below the site root (none yet) */
  var FRESH = { 'how-it-works':1, 'vision':1, 'goal':1, 'use-case':1, 'rules':1, 'tour':1, 'app':1, 'sim':1, 'direction':1, 'design-system':1, 'icp-explorer':1, 'lanes':1, 'icp-directions':1, 'timeline':1, 'decisions':1, 'ci':1, 'icons':1, 'components':1, 'setup':1, 'checklist':1, 'charter':1, 'submission':1, 'sketches':1, 'strands-journey':1 }; /* retire at next check-in */

  /* ALWAYS emit .html. Never derive from the page's own URL scheme or host. */
  function href(s){
    if (ROUTE[s]) return './'+ROUTE[s];
    var d = PATH[s]||'';
    return /\/$/.test(d) ? './'+d+'index.html' : './'+d+s+'.html';
  }

  G.TPTNAV = { GROUPS:GROUPS, GLYPH:GLYPH, CLUSTERS:CLUSTERS, ROUTE:ROUTE, PATH:PATH, FRESH:FRESH, PUBLISHED:PUBLISHED, href:href };
  if (typeof document === 'undefined') return;   /* node: registry only */

  /* current-page detection: viewer routes match on pathname+search, else on the bare slug */
  var file = (location.pathname.split('/').pop()||'index.html');
  var cur = file.replace(/\.html$/,'')||'index';
  if (cur==='view') {
    var q = new URLSearchParams(location.search).get('f')||'';
    for (var k in ROUTE) if (ROUTE[k]==='view.html?f='+q) cur = k;
  }
  var TITLE = {}; GROUPS.forEach(function(gr){ gr[1].forEach(function(p){ TITLE[p[0]]=p[1]; }); });

  var css =
    "#tptnav{position:fixed;left:0;top:0;bottom:0;width:206px;transition:width .15s;background:#0b0e12;border-right:1px solid #1e252e;z-index:100000;display:flex;flex-direction:column;font:600 12.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;overflow-y:auto}"
   +"body{margin-left:206px!important;transition:margin-left .15s}"
   +"html.navmin #tptnav{width:52px}html.navmin body{margin-left:52px!important}"
   +"html.navmin #tptnav .nv-b,html.navmin #tptnav .nv-sub,html.navmin #tptnav .nv-g,html.navmin #tptnav .nv-links a span,html.navmin #tptnav .nv-ft{display:none}"
   +"html.navmin #tptnav .nv-links a{justify-content:center;padding:11px 0}"
   +"#tptnav .nv-b{color:#ff6b4a;font-weight:800;font-size:11px;letter-spacing:.18em;text-transform:uppercase;padding:16px 16px 3px;white-space:nowrap}"
   +"#tptnav .nv-sub{color:#6b7684;font-weight:700;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:0 16px 13px;border-bottom:1px solid #1e252e;margin-bottom:4px;white-space:nowrap}"
   +"#tptnav .nv-g{font-weight:800;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:14px 16px 5px;white-space:nowrap;opacity:.95}"
   +"#tptnav .nv-links{display:flex;flex-direction:column}"
   +"#tptnav .nv-links a{color:#a3adbb;text-decoration:none;padding:8px 16px;display:flex;align-items:center;gap:10px;white-space:nowrap;border:0;border-bottom:0;background:transparent;font:600 12.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}"
   +"#tptnav .nv-links a svg{width:17px;height:17px;flex:none;opacity:.9}"
   +"#tptnav .nv-links a .id{font:700 9px/1 ui-monospace,Menlo,monospace;color:#6b7684;letter-spacing:.06em;min-width:16px}"
   +"#tptnav .nv-links a:hover{background:rgba(255,255,255,.06);color:#fff}"
   +"#tptnav .nv-links a.on{color:#fff;background:rgba(255,255,255,.08);box-shadow:inset 3px 0 0 #ff6b4a}"
   +"#tptnav .nv-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#ff6b4a;vertical-align:middle;margin-left:6px}"
   +"#tptnav .nv-sp{flex:1;min-height:10px}"
   +"#tptnav .nv-min{border:none;background:none;color:#6b7684;cursor:pointer;font:800 13px/1 inherit;padding:10px 16px;text-align:left}"
   +"#tptnav .nv-min:hover{color:#fff}html.navmin #tptnav .nv-min{text-align:center;padding:10px 0}"
   +"#tptnav .nv-ft{font-size:9.5px;color:#4c5663;padding:12px 16px;border-top:1px solid #1e252e;letter-spacing:.08em;text-transform:uppercase}"
   +"#tptnav .nv-burger,#tptnav .nv-cur{display:none}"
   +"@media(max-width:900px){"
   +"#tptnav{position:sticky;top:0;bottom:auto;width:auto;height:48px;flex-direction:row;align-items:center;padding:0 4px 0 14px;overflow:visible;border-right:0;border-bottom:1px solid #1e252e}"
   +"body{margin-left:0!important}"
   +"#tptnav .nv-b{padding:0;font-size:10.5px}#tptnav .nv-sub,#tptnav .nv-min,#tptnav .nv-ft{display:none}"
   +"#tptnav .nv-g{padding:12px 18px 4px}"
   +"#tptnav .nv-cur{display:block;color:#fff;font-weight:800;font-size:13px;margin-left:10px;padding-left:10px;border-left:1px solid rgba(255,255,255,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
   +"#tptnav .nv-burger{display:flex;align-items:center;justify-content:center;margin-left:auto;width:48px;height:48px;border:none;background:none;color:#eef4ee;font-size:20px;cursor:pointer}"
   +"#tptnav .nv-wrap{position:absolute;top:48px;left:0;right:0;background:#0b0e12;box-shadow:0 10px 24px rgba(0,0,0,.5);display:none;padding:0 0 12px;z-index:100001;max-height:calc(100vh - 48px);overflow-y:auto}"
   +"#tptnav.open .nv-wrap{display:block}#tptnav .nv-links a{padding:13px 18px;font-size:14px}"
   +"}"
   +"#tptpub{position:sticky;top:0;z-index:99999;display:flex;align-items:center;gap:4px;padding:0 14px;height:34px;background:rgba(11,14,18,.92);backdrop-filter:blur(6px);border-bottom:1px solid #1e252e;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:#a3adbb;overflow-x:auto;white-space:nowrap;scrollbar-width:none}"
   +"#tptpub .pb-t{color:#6b7684;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;margin-right:8px;flex:none}"
   +"#tptpub a,#tptpub span.pb-i{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:6px;color:#a3adbb;text-decoration:none;flex:none}"
   +"#tptpub a:hover{background:rgba(255,255,255,.06);color:#fff}#tptpub span.pb-i{opacity:.75}"
   +"#tptpub i{font-style:normal;font-size:12px;line-height:1}#tptpub b{font-weight:700;color:#e6e9ee}#tptpub span.pb-i b{color:#a3adbb}#tptpub small{font-size:9.5px;color:#6b7684}"
   +"#tptpub .pb-n{margin-left:auto;color:#4c5663;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;flex:none;padding-left:12px}"
   +"@media(max-width:900px){#tptpub{top:48px}}"
   +"@media print{#tptnav,#tptpub{display:none!important}body{margin-left:0!important}}";

  function run(){
    if (document.getElementById('tptnav')) return;
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var nav=document.createElement('nav'); nav.id='tptnav';
    var links='';
    GROUPS.forEach(function(gr){
      var c=CLUSTERS[gr[0]]||{};
      if (gr[0]) links+='<div class="nv-g" style="color:'+(c.color||'#6b7684')+'">'+(c.label||gr[0])+'</div>';
      links+='<div class="nv-links">';
      gr[1].forEach(function(p){
        links+='<a class="'+(p[0]===cur?'on':'')+'" href="'+href(p[0])+'">'+(GLYPH[p[0]]||'')
          +(p[2]?'<span class="id">'+p[2]+'</span>':'')+'<span>'+p[1]+(FRESH[p[0]]?'<i class="nv-dot"></i>':'')+'</span></a>';
      });
      links+='</div>';
    });
    nav.innerHTML='<div class="nv-b">3PT</div><div class="nv-sub">Three Point Harness</div>'
      +'<span class="nv-cur">'+(TITLE[cur]||cur)+'</span>'
      +'<button class="nv-burger" aria-label="Menu" aria-expanded="false">☰</button>'
      +'<div class="nv-wrap">'+links+'</div><div class="nv-sp"></div>'
      +'<button class="nv-min" title="Collapse / expand sidebar">⇤⇥</button>'
      +'<div class="nv-ft">Hackathon · Sep 26 2026</div>';
    document.body.insertBefore(nav, document.body.firstChild);
    /* the Published bar: what exists outside the repo, and its state, on every leaf */
    var pub=document.createElement('div'); pub.id='tptpub'; pub.setAttribute('role','navigation'); pub.setAttribute('aria-label','Published surfaces');
    pub.innerHTML='<span class="pb-t">Published</span>'+PUBLISHED.map(function(p){ var st=PUBSTATE[p.state]||PUBSTATE.pending;
      var inner='<i style="color:'+st[1]+'">'+st[0]+'</i><b>'+p.label+'</b><small>'+p.state+(p.note?' · '+p.note:'')+'</small>';
      return p.url ? '<a href="'+p.url+'" target="_blank" rel="noopener">'+inner+'</a>' : '<span class="pb-i">'+inner+'</span>'; }).join('')
      +'<span class="pb-n">authored · nav.js PUBLISHED</span>';
    nav.parentNode.insertBefore(pub, nav.nextSibling);
    try{ if (localStorage.getItem('tpt_nav')==='min') document.documentElement.classList.add('navmin'); }catch(e){}
    nav.querySelector('.nv-min').addEventListener('click',function(){
      var m=document.documentElement.classList.toggle('navmin');
      try{ m?localStorage.setItem('tpt_nav','min'):localStorage.removeItem('tpt_nav'); }catch(e){}
    });
    var burger=nav.querySelector('.nv-burger');
    burger.addEventListener('click',function(e){ e.stopPropagation(); var o=nav.classList.toggle('open'); burger.setAttribute('aria-expanded',o); burger.textContent=o?'✕':'☰'; });
    document.addEventListener('click',function(e){ if(nav.classList.contains('open')&&!nav.contains(e.target)){ nav.classList.remove('open'); burger.textContent='☰'; burger.setAttribute('aria-expanded','false'); } });
  }
  document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',run) : run();
})();
