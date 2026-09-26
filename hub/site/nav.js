/* 3PT · shared nav shell — the single source of IA.
   Desktop (>900px): fixed left rail grouped by phase, custom SVG glyph per leaf, collapsible
   (persisted as tpt_nav). The brand block and the footer are pinned; only the link list (.nv-scroll)
   scrolls, with a thin themed scrollbar, edge fades that appear only when there is more, the scroll
   offset remembered across leaves (tpt_nav_scroll, per tab) and the current leaf brought into view.
   The Published bar (#tptpub) is the outermost strip: fixed across the full viewport width, above the rail
   and the page, on every leaf; the rail and body are offset by its height.
   Mobile (≤900px): sticky header + hamburger under the strip. Hidden on print.
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
    /* the mark: a three-point harness — two shoulder straps and a lap strap, one buckle, three anchor points */
    'index':          g('<path d="M12 4.5l7.5 13h-15Z"/><path d="M12 4.5v10.2"/><rect x="9.6" y="15" width="4.8" height="4.6" rx="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="4.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="19.5" cy="17.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="17.5" r="1.5" fill="currentColor" stroke="none"/>'),
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
    'results':        g('<path d="M4 20h16"/><path d="M6.5 20v-5M11 20v-8M15.5 20v-11"/><path d="M5 11l5-4 3.5 2.5L19 4"/><path d="M15.5 4H19v3.5"/>'),
    'how-it-works':   g('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.8 3.8v3.4h-3.4"/><circle cx="8.6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3"/><circle cx="15.4" cy="12" r="1.3" fill="currentColor"/>'),
    'architecture':   g('<path d="M3 6h5v5H3ZM9.5 3h5v5h-5ZM16 6h5v5h-5Z"/><path d="M5.5 11v3.5h13V11"/><path d="M12 8v6.5"/><path d="M8 18h8M6 21h12" stroke-dasharray="2 2"/>'),
    'strands':        g('<path d="M4 12c2-5 5-5 8 0s6 5 8 0"/><path d="M4 12c2 5 5 5 8 0s6-5 8 0"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>'),
    'strands-diagrams': g('<path d="M4 12c2-5 5-5 8 0s6 5 8 0"/><path d="M5 5h4v4H5ZM15 15h4v4h-4Z"/><path d="M9 7h6M9 17h6" stroke-dasharray="2 2"/>'),
    'system-map':     g('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>'),
    'system-ladder':  g('<path d="M7 3v18M17 3v18"/><path d="M7 7h10M7 12h10M7 17h10"/><circle cx="12" cy="7" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="17" r="1.4"/>'),
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
    'view':           g('<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/>'),
    'canvas':         g('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 11h8M11 4v14M11 11h10"/><circle cx="7" cy="7.5" r="1.2" fill="currentColor"/>'),
    'talking-points': g('<path d="M4 5h16v10H9l-5 4z"/><circle cx="8.5" cy="10" r="1.1" fill="currentColor"/><circle cx="12" cy="10" r="1.1" fill="currentColor"/><circle cx="15.5" cy="10" r="1.1" fill="currentColor"/>'),
    'the-cut':        g('<path d="M4 6h16M4 12h11M4 18h7"/><path d="M17 15l2 2 3-3"/><circle cx="20" cy="6" r="1.4" fill="currentColor"/>'),
    'fold':           g('<path d="M7 3h8l4 4v6"/><path d="M15 3v4h4"/><path d="M5 9h8l3 3v9H5Z"/><path d="M8 15h6M8 18h4"/>')
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
    ['',       [['index','Hub'], ['canvas','Canvas'], ['results','Results']]],   /* Canvas: every surface on one board, the screen to drive while talking */   /* Results rides at the top: the judges' first stop after the hub */
    ['orient', [['charter','README','DR'], ['the-cut','Start here','DY'], ['vision','Vision'], ['goal','Goal'], ['use-case','Use case'], ['rules','Rules & judging'], ['checklist','Open-source checklist'], ['submission','Submission'],
                ['vision-doc','Vision doc','D0'], ['goal-doc','Goal doc','D6'], ['rules-doc','Rules doc','D5'], ['checklist-doc','Checklist doc','DL'], ['submission-doc','Submission doc','DU']]],
    ['decide', [['decisions','Group decisions','DQ'], ['direction','Direction'], ['design-system','Design system','DD'], ['design-spec','Design system spec','DK'], ['sketches','Sketch gallery'], ['icons','Icons'], ['components','Components'], ['icp-explorer','ICP explorer'], ['icp-directions','ICP directions','D8'], ['assessment','Assessment','D7'], ['icp','ICPs','D1']]],
    ['build', [['talking-points','Talking points','DH'], ['tour','Product tour & demo'], ['app','App prototype'], ['sim','Simulator'], ['lanes','Lane board'], ['setup','Setup cascade'], ['setup-doc','Setup cascade doc','DP'], ['lanes-doc','Lanes','D2'], ['workflow','Workflow','D3'], ['ci','CI & deployment','DC'], ['how-it-works','How it works'], ['architecture','Architecture'], ['architecture-doc','Architecture doc','DA'], ['strands','Strands archaeology','DT'], ['strands-diagrams','Strands, drawn','DW'], ['system-map','System map','DE'], ['system-ladder','System ladder','DF'], ['strands-journey','Strands, answered'], ['strands-questions','Strands questions','DJ'], ['resources','Resources & credits','D4']]],
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
    'system-map':     'view.html?f=docs/20-system-map.md',
    'system-ladder':  'view.html?f=docs/22-system-ladder.md',
    'strands-questions': 'view.html?f=docs/18-strands-questions.md',
    'resources':      'view.html?f=docs/04-resources.md',
    'glossary':       'view.html?f=docs/glossary.md',
    'charter':        'view.html?f=README.md',
    'the-cut':        'view.html?f=docs/21-the-cut.md',
    'talking-points': 'view.html?f=docs/23-interview-talking-points.md',
    'provenance':     'view.html?f=docs/09-provenance.md'
  };
  /* PUBLISHED: every surface of this project that exists outside the repo, with its state. AUTHORED;
     the steward edits it at each checkpoint (docs/17 §1 K2). state: live | gated | public | open | pending */
  var PUBLISHED = [
    { k:'hub',    label:'Hub',            url:'https://3pt.pages.dev',                                              state:'gated',   note:'Access · PIN' },
    { k:'repo',   label:'Repo',           url:'https://github.com/pastarita/3pt',                                   state:'public',  note:'MIT' },
        { k:'atlas',  label:'Atlas Sandbox',  url:'https://cloud.mongodb.com/v2/6ab80ef67d3d0c27d97a4b0e#/explorer/6ab80efdaf16c2903a9a9acb/3pt/checkpoints/find', state:'live', note:'Cluster0 · M10 · checkpoints' },
    { k:'demo',   label:'Demo link',      url:'https://3pt-web.pages.dev',                                          state:'public',  note:'ungated' },
    { k:'api',    label:'Harness API',    url:'https://3pt-harness.3pt-worker.workers.dev',                                        state:'public',  note:'Worker' },
    { k:'video',  label:'Video',          url:'https://youtu.be/MxAMXWKRcvc',                                       state:'public',  note:'60 s' },
    { k:'form',   label:'Submission',     url:'https://cerebralvalley.ai/e/mongodb-nyc-hackathon/hackathon/submit', state:'open',    note:'17:00 ET' }
  ];
  var PUBSTATE = { live:['●','#3fb886'], public:['●','#3fb886'], gated:['◐','#e0a33a'], open:['◐','#e0a33a'], pending:['○','#6b7684'] };

  var PATH  = {};  /* slug → 'nested/dir/' for leaves below the site root (none yet) */
  var FRESH = { 'results':1, 'how-it-works':1, 'vision':1, 'goal':1, 'use-case':1, 'rules':1, 'tour':1, 'app':1, 'sim':1, 'direction':1, 'design-system':1, 'icp-explorer':1, 'lanes':1, 'icp-directions':1, 'timeline':1, 'decisions':1, 'ci':1, 'icons':1, 'components':1, 'setup':1, 'checklist':1, 'charter':1, 'submission':1, 'sketches':1, 'strands-journey':1 }; /* retire at next check-in */

  /* FOLD: entries of a group that sit inside one accordion instead of the open list. The five Orient
     document twins fold under "Documents": the leaf is the way in, the document is the record behind it.
     Open when the current page is inside it, else as last left (tpt_nav_fold_<cluster>). Slugs stay in
     GROUPS (one Register; the lint walks GROUPS unchanged and checks every folded slug is registered). */
  var FOLD = {
    orient: { label:'Documents', slugs:['vision-doc','goal-doc','rules-doc','checklist-doc','submission-doc'] }
  };

  /* ALWAYS emit .html. Never derive from the page's own URL scheme or host. */
  function href(s){
    if (ROUTE[s]) return './'+ROUTE[s];
    var d = PATH[s]||'';
    return /\/$/.test(d) ? './'+d+'index.html' : './'+d+s+'.html';
  }

  G.TPTNAV = { GROUPS:GROUPS, GLYPH:GLYPH, CLUSTERS:CLUSTERS, ROUTE:ROUTE, PATH:PATH, FRESH:FRESH, FOLD:FOLD, PUBLISHED:PUBLISHED, href:href };
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
    "#tptnav{position:fixed;left:0;top:34px;bottom:0;width:206px;transition:width .15s;background:#0b0e12;border-right:1px solid #1e252e;z-index:100000;display:flex;flex-direction:column;font:600 12.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;overflow:hidden}"
   +"body{margin-left:206px!important;padding-top:34px!important;transition:margin-left .15s}"
   +"html.navmin #tptnav{width:52px}html.navmin body{margin-left:52px!important}"
   +"html.navmin #tptnav .nv-b span,html.navmin #tptnav .nv-sub,html.navmin #tptnav .nv-g,html.navmin #tptnav .nv-links a span,html.navmin #tptnav .nv-ft{display:none}"
   +"html.navmin #tptnav .nv-links a{justify-content:center;padding:11px 0}"
   /* the scroll region: the one part of the rail that moves. Pinned brand above, pinned footer below. */
   +"#tptnav .nv-scroll{position:relative;flex:1 1 auto;min-height:0;display:flex;flex-direction:column}"
   +"#tptnav .nv-wrap{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#2a333e transparent;scrollbar-gutter:stable;padding-bottom:10px}"
   +"#tptnav .nv-wrap::-webkit-scrollbar{width:8px}#tptnav .nv-wrap::-webkit-scrollbar-track{background:transparent}"
   +"#tptnav .nv-wrap::-webkit-scrollbar-thumb{background:#2a333e;border-radius:8px;border:2px solid #0b0e12}"
   +"#tptnav:hover .nv-wrap::-webkit-scrollbar-thumb,#tptnav .nv-wrap:focus-within::-webkit-scrollbar-thumb{background:#3d4855}"
   +"#tptnav:hover .nv-wrap{scrollbar-color:#3d4855 transparent}"
   +"#tptnav .nv-scroll::before,#tptnav .nv-scroll::after{content:'';position:absolute;left:0;right:8px;height:22px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:1}"
   +"#tptnav .nv-scroll::before{top:0;background:linear-gradient(#0b0e12,rgba(11,14,18,0))}"
   +"#tptnav .nv-scroll::after{bottom:0;background:linear-gradient(rgba(11,14,18,0),#0b0e12)}"
   +"#tptnav .nv-scroll.more-top::before,#tptnav .nv-scroll.more-bot::after{opacity:1}"
   +"#tptnav .nv-links a.on{scroll-margin:40px 0}"
   +"#tptnav .nv-fold{margin:2px 0 0}#tptnav .nv-fold summary{list-style:none;cursor:pointer;color:#6b7684;padding:8px 16px;display:flex;align-items:center;gap:10px;white-space:nowrap;font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;user-select:none}"
   +"#tptnav .nv-fold summary::-webkit-details-marker{display:none}#tptnav .nv-fold summary:hover{color:#fff;background:rgba(255,255,255,.04)}"
   +"#tptnav .nv-fold summary svg{width:17px;height:17px;flex:none;opacity:.8}#tptnav .nv-fold summary .nv-n{font-weight:600;color:#4c5663;margin-left:auto}"
   +"#tptnav .nv-fold summary .nv-chev{width:12px;height:12px;flex:none;transition:transform .15s;opacity:.7}#tptnav .nv-fold[open] summary .nv-chev{transform:rotate(90deg)}"
   +"#tptnav .nv-fold .nv-links{margin-left:24px;border-left:1px solid #1e252e}#tptnav .nv-fold .nv-links a{padding:7px 12px 7px 14px;font-size:12px}"
   +"#tptnav .nv-fold.has-on:not([open]) summary{color:#a3adbb;box-shadow:inset 3px 0 0 rgba(255,107,74,.55)}"
   +"html.navmin #tptnav .nv-fold summary{justify-content:center;padding:11px 0}html.navmin #tptnav .nv-fold summary span,html.navmin #tptnav .nv-fold summary .nv-chev{display:none}"
   +"html.navmin #tptnav .nv-fold .nv-links{margin-left:0;border-left:0}"
   +"html.navmin #tptnav .nv-wrap{scrollbar-width:none}html.navmin #tptnav .nv-wrap::-webkit-scrollbar{width:0}"
   +"#tptnav .nv-b{color:#ff6b4a;font-weight:800;font-size:11px;letter-spacing:.18em;text-transform:uppercase;padding:16px 16px 3px;white-space:nowrap;display:flex;align-items:center;gap:7px}"
   +"#tptnav .nv-b svg{width:16px;height:16px;flex:none;color:#a3adbb}html.navmin #tptnav .nv-b{display:flex;justify-content:center;padding:14px 0 3px}html.navmin #tptnav .nv-b svg{display:block}"
   +"#tptnav .nv-sub{color:#6b7684;font-weight:700;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:0 16px 13px;border-bottom:1px solid #1e252e;margin-bottom:4px;white-space:nowrap}"
   +"#tptnav .nv-g{font-weight:800;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:14px 16px 5px;white-space:nowrap;opacity:.95}"
   +"#tptnav .nv-links{display:flex;flex-direction:column}"
   +"#tptnav .nv-links a{color:#a3adbb;text-decoration:none;padding:8px 16px;display:flex;align-items:center;gap:10px;white-space:nowrap;border:0;border-bottom:0;background:transparent;font:600 12.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}"
   +"#tptnav .nv-links a svg{width:17px;height:17px;flex:none;opacity:.9}"
   +"#tptnav .nv-links a:hover{background:rgba(255,255,255,.06);color:#fff}"
   +"#tptnav .nv-links a.on{color:#fff;background:rgba(255,255,255,.08);box-shadow:inset 3px 0 0 #ff6b4a}"
   +"#tptnav .nv-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#ff6b4a;vertical-align:middle;margin-left:6px}"
   +"#tptnav .nv-sp{flex:none;height:6px}"
   +"#tptnav .nv-min{border:none;background:none;color:#6b7684;cursor:pointer;font:800 13px/1 inherit;padding:10px 16px;text-align:left}"
   +"#tptnav .nv-min:hover{color:#fff}html.navmin #tptnav .nv-min{text-align:center;padding:10px 0}"
   +"#tptnav .nv-ft{font-size:9.5px;color:#4c5663;padding:12px 16px;border-top:1px solid #1e252e;letter-spacing:.08em;text-transform:uppercase}"
   +"#tptnav .nv-burger,#tptnav .nv-cur{display:none}"
   +"@media(max-width:900px){"
   +"#tptnav{position:sticky;top:30px;bottom:auto;width:auto;height:48px;flex-direction:row;align-items:center;padding:0 4px 0 14px;overflow:visible;border-right:0;border-bottom:1px solid #1e252e}"
   +"body{margin-left:0!important}"
   +"#tptnav .nv-b{padding:0;font-size:10.5px}#tptnav .nv-sub,#tptnav .nv-min,#tptnav .nv-ft{display:none}"
   +"#tptnav .nv-g{padding:12px 18px 4px}"
   +"#tptnav .nv-cur{display:block;color:#fff;font-weight:800;font-size:13px;margin-left:10px;padding-left:10px;border-left:1px solid rgba(255,255,255,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
   +"#tptnav .nv-burger{display:flex;align-items:center;justify-content:center;margin-left:auto;width:48px;height:48px;border:none;background:none;color:#eef4ee;font-size:20px;cursor:pointer}"
   +"#tptnav .nv-scroll{display:contents}#tptnav .nv-scroll::before,#tptnav .nv-scroll::after{display:none}"
   +"#tptnav .nv-wrap{position:absolute;top:48px;left:0;right:0;background:#0b0e12;box-shadow:0 10px 24px rgba(0,0,0,.5);display:none;padding:0 0 12px;z-index:100001;max-height:calc(100vh - 48px);overflow-y:auto;flex:none}"
   +"#tptnav.open .nv-wrap{display:block}#tptnav .nv-links a{padding:13px 18px;font-size:14px}"
   +"}"
   +"#tptpub{position:fixed;top:0;left:0;right:0;z-index:100001;display:flex;align-items:center;gap:4px;padding:0 14px;height:34px;background:rgba(11,14,18,.96);backdrop-filter:blur(6px);border-bottom:1px solid #1e252e;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:#a3adbb;overflow-x:auto;white-space:nowrap;scrollbar-width:none}"
   +"#tptpub .pb-b{color:#ff6b4a;font-weight:800;font-size:10px;letter-spacing:.18em;margin-right:6px;flex:none}"
+"#tptpub .pb-t{color:#6b7684;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;margin-right:8px;flex:none}"
   +"#tptpub a,#tptpub span.pb-i{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:6px;color:#a3adbb;text-decoration:none;flex:none}"
   +"#tptpub a:hover{background:rgba(255,255,255,.06);color:#fff}#tptpub span.pb-i{opacity:.75}"
   +"#tptpub i{font-style:normal;font-size:12px;line-height:1}#tptpub b{font-weight:700;color:#e6e9ee}#tptpub span.pb-i b{color:#a3adbb}#tptpub small{font-size:9.5px;color:#6b7684}"
   +"#tptpub .pb-n{margin-left:auto;color:#4c5663;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;flex:none;padding-left:12px}"
   +"@media(max-width:900px){#tptpub{height:30px}#tptnav{top:30px}body{padding-top:30px!important}}"
   +"@media print{#tptnav,#tptpub{display:none!important}body{margin-left:0!important;padding-top:0!important}}";

  function run(){
    if (document.getElementById('tptnav')) return;
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var nav=document.createElement('nav'); nav.id='tptnav';
    var links='';
    GROUPS.forEach(function(gr){
      var c=CLUSTERS[gr[0]]||{};
      if (gr[0]) links+='<div class="nv-g" style="color:'+(c.color||'#6b7684')+'">'+(c.label||gr[0])+'</div>';
      var fold=FOLD[gr[0]], inFold={}, folded='', hasOn=false;
      if (fold) fold.slugs.forEach(function(k){ inFold[k]=1; });
      /* p[2] is the document's Register id. It stays in GROUPS as data (the Viewer strip, the index cards and the
         docs cite it) but the rail no longer prints it: only documents carry one, so the labels fell out of line. */
      function row(p){ return '<a class="'+(p[0]===cur?'on':'')+'" href="'+href(p[0])+'"'+(p[2]?' data-reg="'+p[2]+'"':'')+'>'+(GLYPH[p[0]]||'')
          +'<span>'+p[1]+(FRESH[p[0]]?'<i class="nv-dot"></i>':'')+'</span></a>'; }
      links+='<div class="nv-links">';
      gr[1].forEach(function(p){ if (inFold[p[0]]) { folded+=row(p); if (p[0]===cur) hasOn=true; } else links+=row(p); });
      links+='</div>';
      if (fold && folded) {
        var open=hasOn; try{ var fs=localStorage.getItem('tpt_nav_fold_'+gr[0]); if(!hasOn&&fs) open=(fs==='open'); }catch(e){}
        links+='<details class="nv-fold'+(hasOn?' has-on':'')+'" data-fold="'+gr[0]+'"'+(open?' open':'')+'><summary>'+GLYPH.fold
          +'<span>'+fold.label+'</span><span class="nv-n">'+fold.slugs.length+'</span>'
          +'<svg class="nv-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></summary>'
          +'<div class="nv-links">'+folded+'</div></details>';
      }
    });
    nav.innerHTML='<div class="nv-b">'+GLYPH.index+'<span>3PT</span></div><div class="nv-sub">Three Point Harness</div>'
      +'<span class="nv-cur">'+(TITLE[cur]||cur)+'</span>'
      +'<button class="nv-burger" aria-label="Menu" aria-expanded="false">☰</button>'
      +'<div class="nv-scroll"><div class="nv-wrap">'+links+'</div></div><div class="nv-sp"></div>'
      +'<button class="nv-min" title="Collapse / expand sidebar">⇤⇥</button>'
      +'<div class="nv-ft">Hackathon · Sep 26 2026</div>';
    document.body.insertBefore(nav, document.body.firstChild);
    /* the Published bar: what exists outside the repo, and its state, on every leaf */
    var pub=document.createElement('div'); pub.id='tptpub'; pub.setAttribute('role','navigation'); pub.setAttribute('aria-label','Published surfaces');
    pub.innerHTML='<span class="pb-b">3PT</span><span class="pb-t">Published</span>'+PUBLISHED.map(function(p){ var st=PUBSTATE[p.state]||PUBSTATE.pending;
      var inner='<i style="color:'+st[1]+'">'+st[0]+'</i><b>'+p.label+'</b><small>'+p.state+(p.note?' · '+p.note:'')+'</small>';
      return p.url ? '<a href="'+p.url+'" target="_blank" rel="noopener">'+inner+'</a>' : '<span class="pb-i">'+inner+'</span>'; }).join('')
      +'<span class="pb-n">authored · nav.js PUBLISHED</span>';
    document.body.insertBefore(pub, document.body.firstChild);
    try{ if (localStorage.getItem('tpt_nav')==='min') document.documentElement.classList.add('navmin'); }catch(e){}
    nav.querySelector('.nv-min').addEventListener('click',function(){
      var m=document.documentElement.classList.toggle('navmin');
      try{ m?localStorage.setItem('tpt_nav','min'):localStorage.removeItem('tpt_nav'); }catch(e){}
    });
    /* the scroll region: fades track the offset; the offset survives a leaf change (per tab); the current
       leaf is scrolled into view when it is off-screen, so a deep entry never lands hidden under the footer */
    var sc=nav.querySelector('.nv-scroll'), wrap=nav.querySelector('.nv-wrap');
    function fades(){ var t=wrap.scrollTop, m=wrap.scrollHeight-wrap.clientHeight; sc.classList.toggle('more-top',t>2); sc.classList.toggle('more-bot',m-t>2); }
    var tick=null;
    wrap.addEventListener('scroll',function(){ fades(); if(tick) return; tick=setTimeout(function(){ tick=null; try{ sessionStorage.setItem('tpt_nav_scroll',String(wrap.scrollTop)); }catch(e){} },80); },{passive:true});
    function place(){
      try{ var s=sessionStorage.getItem('tpt_nav_scroll'); if(s!==null) wrap.scrollTop=+s; }catch(e){}
      var on=wrap.querySelector('a.on');
      if(on){ var r=on.getBoundingClientRect(), w=wrap.getBoundingClientRect(); if(r.top<w.top+8||r.bottom>w.bottom-8) wrap.scrollTop=on.offsetTop-(wrap.clientHeight-on.offsetHeight)/2; }   /* not scrollIntoView: that would also move the page off its #anchor */
      fades();
    }
    place(); window.addEventListener('resize',fades);
    Array.prototype.forEach.call(nav.querySelectorAll('.nv-fold'),function(d){ d.addEventListener('toggle',function(){ fades(); try{ localStorage.setItem('tpt_nav_fold_'+d.getAttribute('data-fold'), d.open?'open':'shut'); }catch(e){} }); });
    var burger=nav.querySelector('.nv-burger');
    burger.addEventListener('click',function(e){ e.stopPropagation(); var o=nav.classList.toggle('open'); burger.setAttribute('aria-expanded',o); burger.textContent=o?'✕':'☰'; });
    document.addEventListener('click',function(e){ if(nav.classList.contains('open')&&!nav.contains(e.target)){ nav.classList.remove('open'); burger.textContent='☰'; burger.setAttribute('aria-expanded','false'); } });
  }
  document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',run) : run();
})();
