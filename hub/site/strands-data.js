/* 3PT · Strands questions register — the pointer index behind strands-journey.html.
   Source of record: docs/18-strands-questions.md (written together on 2026-09-26; keep in step).
   Every pointer is [label, href, kind]. kind: doc (view.html?f=…#heading-slug), leaf (x.html#id),
   code (GitHub blob with a line range, symbol named in the label), strands (upstream URL), seg
   (a brainstorming segment). Tallies on the leaf are DERIVED from this file, never typed.
   Node-safe: extends globalThis.T (3pt-data.js loads first). Lints: tools/check-view.mjs verifies
   every view.html?f=…#anchor and every leaf #id here lands. */
(function(){
  var G = (typeof globalThis!=='undefined'?globalThis:window); G.T = G.T || {}; var T = G.T;
  var GH = 'https://github.com/pastarita/3pt/blob/main/';
  var D12 = 'view.html?f=docs/12-strands-archaeology.md#', D13 = 'view.html?f=docs/13-strands-diagrams.md#',
      D00 = 'view.html?f=docs/00-vision.md#', D06 = 'view.html?f=docs/06-goal-and-use-case.md#',
      D07 = 'view.html?f=docs/07-assessment-and-measurement.md#', D10 = 'view.html?f=docs/10-architecture.md#',
      D03 = 'view.html?f=docs/03-workflow.md#', D15 = 'view.html?f=docs/18-strands-questions.md#';
  var S = 'https://github.com/strands-agents/harness-sdk', SD = 'https://strandsagents.com/docs/api/typescript/', SB = 'https://strandsagents.com/blog/';
  var STR = GH+'harness/packages/strands/src/index.ts#L', CORE = GH+'harness/packages/core/src/index.ts#L';
  function doc(l,h){return [l,h,'doc'];} function code(l,h){return [l,h,'code'];} function st(l,h){return [l,h,'strands'];} function leaf(l,h){return [l,h,'leaf'];}
  var SRC = doc('§1 sources', D12+'1-source-register'), LED = function(l){ return doc(l, D12+'2-capability-ledger'); };

  T.STRANDS_Q = [
    { id:'q1', n:1, slug:'configure', q:'How can we configure Strands?', layer:'createHarness · ModelRouter · AgentConfig', doc: D15+'1-how-can-we-configure-strands',
      segs:['s4.04'],
      cols:['Layer','Corpus','Codebase','Strands','Extend'],
      rows:[
        ['Harness options: instructions · builtinTools · interventions · session · memory · skills · plugins · mcpServers · contextManager · caching · effort',
          [doc('S2 S4', D12+'1-source-register'), LED('L1 L3 L4 L5 L20'), doc('13 §2 layers', D13+'2-the-layers-sdk-harness-cli-3pt')],
          [code('harnessOptions() L41–62', STR+'41-L62')],
          [st('harness-ts README', S+'/tree/main/harness-ts'), st('index.ts · models.ts', S+'/tree/main/harness-ts/src')],
          'pin @strands-agents/harness ~0.1; compile once disk allows (docs/12 §6)'],
        ['Model and router: model \'provider/name\' | ModelRouter(candidates, {strategy, maxSwitches}) · effort',
          [doc('S5', D12+'1-source-register'), LED('L2'), doc('13 §5 routing', D13+'5-model-resolution-and-the-router')],
          [code('Route · DEFAULT_ROUTES L12–25', STR+'12-L25'), code('routerSpec() L64–70', STR+'64-L70')],
          [st('ModelRouter', SD+'ModelRouter/')],
          'routerFor() is a comment until the SDK installs; first candidate must be a provider we hold a key for (S21)'],
        ['Agent passthrough: storage · sessionManager · memoryManager · checkpointing · conversationManager · retryStrategy',
          [doc('S6 S8', D12+'1-source-register'), LED('L7 L11'), doc('13 §6 persistence', D13+'6-persistence-storage-sessions-snapshots-memory')],
          [code('AtlasStorage L72–81', STR+'72-L81')],
          [st('AgentConfig', SD+'AgentConfig/'), st('Storage', SD+'Storage/')],
          'pass AtlasStorage as session.storage and AgentConfig.storage (L7, L22)'],
        ['Tool grants as data: builtinTools map · interventions ask | smart | text | .cedar | handler | layered',
          [LED('L4'), doc('12 §4 per-stage table', D12+'what-each-stages-harness-is-concretely'), doc('13 §7 control', D13+'7-control-interventions-steering-guardrails'), doc('10 §4.3 grants', D10+'43-batteries-tool-grants-stages')],
          [code('grants() L28–38', STR+'28-L38'), code('policies/v0.json', GH+'harness/policies/v0.json'), code('Policy L28–40', CORE+'28-L40')],
          [st('interventions ladder (README)', S+'/tree/main/harness-ts#interventions')],
          'write harness/policies/gates/build.cedar (named in grants(), not on disk)'],
        ['The document itself: Policy {rules, contextPolicy, toolGrants} and the handles we say',
          [doc('12 §3 lexicon', D12+'3-lexicon-the-semantic-basis'), leaf('sketch f1 · policy packet', 'sketches.html#f1')],
          [code('seedPolicy() L122–140', CORE+'122-L140'), code('topology.json', GH+'harness/packages/strands/topology.json'), code('policies/README.md', GH+'harness/policies/README.md')],
          [st('strands CLI · /export', S+'/tree/main/strands-cli')],
          'add routes: Routes to Policy so Instrument can rewrite them (docs/12 §3 assumes policy.routes)']
      ]},
    { id:'q2', n:2, slug:'tune', q:'How can we fine-tune Strands?', layer:'Formula · Trainer · evals · steering', doc: D15+'2-how-can-we-fine-tune-strands',
      segs:['s1.02','s1.03','s2.03'],
      cols:['Rung','Corpus','Codebase','Strands','Extend'],
      rows:[
        ['Dials, no training: effort · caching auto · contextManager auto | agentic · ClassifierStrategy · 1500-token tool-result truncation · summarize at 85%',
          [doc('S4 S5 S17', D12+'1-source-register'), LED('L2 L5')],
          [code('DEFAULT_ROUTES effort L21–25', STR+'21-L25'), code('contextManager · caching L58–59', STR+'58-L59')],
          [st('introducing harness (blog)', SB+'introducing-strands-harness/')],
          'read AgentConfig for the limitTurns / limitTotalTokens option names when compiling (L10)'],
        ['Steering: steer_before_tool / steer_after_model → Proceed | Guide; 100% pass at 66% fewer input tokens than SOP prompting (600 runs)',
          [doc('S13', D12+'1-source-register'), LED('L13'), doc('13 §7', D13+'7-control-interventions-steering-guardrails')],
          [],
          [st('steering (blog)', SB+'steering-accuracy-beats-prompts-workflows/')],
          'Instrument standards as steering handlers in harness/packages/instrument; TS equivalent of the vended plugin to confirm'],
        ['Measure: Plugin.initAgent + addHook(AfterModelCall | AfterToolCall | AfterInvocation) → measurements',
          [doc('S12', D12+'1-source-register'), LED('L9'), doc('13 §3 hooks', D13+'3-one-invocation-the-agent-loop-with-its-hooks'), doc('07 §3.1 metric register', D07+'31-metric-register')],
          [code('measurementPlugin() L83–99', STR+'83-L99'), code('Measurement L42–50', CORE+'42-L50')],
          [st('Plugin', SD+'Plugin/')],
          'OTel → LangSmith over OTLP is SEED (L9)'],
        ['Evaluate: strands_evals Case · Experiment · evaluators · offline task functions over traces',
          [doc('S15', D12+'1-source-register'), LED('L15'), doc('13 §9 evals + optimizer', D13+'9-evaluation-and-the-optimizer-loop')],
          [code('Plan.evaluation[] L52–60', CORE+'52-L60')],
          [st('evals guide (blog)', SB+'evaluating-ai-agents-practical-guide-strands-evals/')],
          'harness/evals/ (Python) does not exist: Experiment from Plan.evaluation[], scores written as measurements'],
        ['Optimize: Formula → RewardFunction → FormulaOptimizer → Trainer.fit(); only SystemPromptFormula ships',
          [doc('S14', D12+'1-source-register'), LED('L14'), doc('12 §5 sizing', D12+'5-what-is-genuinely-net-new-sized'), doc('13 §9', D13+'9-evaluation-and-the-optimizer-loop')],
          [],
          [st('harness optimizer (blog)', SB+'introducing-harness-optimizer/')],
          'PolicyFormula: tunable rules · toolGrants · routes; reward = M-19 harness_health with weights in policies.health_weights'],
        ['Today\'s stand-in: rewritePolicy(prev, findings, tag) appends findings as rules and bumps the version',
          [doc('07 §3.2 sprint selector', D07+'32-sprint-mode-selection-rule-initial-policy-instrument-may-rewrite-it')],
          [code('rewritePolicy() L4–12', GH+'harness/packages/instrument/src/index.ts#L4-L12')],
          [],
          'rewrite toolGrants and routes too; M-11 counts the diff, M-14 attributes it']
      ]},
    { id:'q3', n:3, slug:'self-improve', q:'How is Strands open to self-improvement?', layer:'hooks · Storage · checkpoint · rewritePolicy', doc: D15+'3-how-is-strands-open-to-self-improvement',
      segs:['s1.02','s1.04','s1.20','s1.29'],
      cols:['Seam','Corpus','Codebase','Strands','Extend'],
      rows:[
        ['See: Plugin hooks on every model call, tool call, invocation',
          [doc('S12', D12+'1-source-register'), LED('L9'), doc('13 §3', D13+'3-one-invocation-the-agent-loop-with-its-hooks'), doc('13 §4 stop reasons', D13+'4-stop-reasons-as-a-state-machine')],
          [code('measurementPlugin() L83–99', STR+'83-L99')],
          [st('Plugin', SD+'Plugin/'), st('StopReason', SD+'StopReason/')],
          'record M-STOP counts Plan can read when choosing a Fix sprint'],
        ['Rebuild: createHarness(options) is data in, assembled Agent out',
          [doc('12 §0 the finding', D12+'0-the-finding-that-changes-the-plan'), doc('S2 S17', D12+'1-source-register')],
          [code('harnessOptions() L41–62', STR+'41-L62')],
          [st('harness-ts README', S+'/tree/main/harness-ts')],
          '—'],
        ['Remember: Storage {write read delete list namespace? search?}; snapshots with immutable UUID v7 history',
          [doc('S8 S10', D12+'1-source-register'), LED('L7 L22'), doc('13 §6', D13+'6-persistence-storage-sessions-snapshots-memory')],
          [code('AtlasStorage L72–81', STR+'72-L81'), code('COLLECTIONS L11–19', CORE+'11-L19')],
          [st('Storage', SD+'Storage/'), st('session management', 'https://strandsagents.com/docs/user-guide/sdk/agents/session-management/')],
          'wire AtlasStorage: it has six methods and no caller'],
        ['Pause and roll back: checkpointing: true · stop_reason checkpoint · resume from Checkpoint{position, cycle_index}',
          [doc('S11', D12+'1-source-register'), LED('L11'), doc('10 §4.7 rollback in git', D10+'47-checkpoints-and-rollback-in-git')],
          [code('Checkpoint L62–71', CORE+'62-L71'), code('instrumentStage L14–', GH+'harness/packages/instrument/src/index.ts#L14-L36'), code('policies/README.md', GH+'harness/policies/README.md')],
          [st('checkpoint (python, experimental)', 'https://strandsagents.com/docs/api/python/strands.experimental.checkpoint.checkpoint/')],
          'checkpoint = (snapshot id, git tag cp/n, policy version); code writes one of the three today'],
        ['Carry: MemoryStore {search add addMessages initialize getTools}; memory: {stores}',
          [doc('S9', D12+'1-source-register'), LED('L8'), doc('13 §6', D13+'6-persistence-storage-sessions-snapshots-memory')],
          [],
          [st('MemoryStore', SD+'MemoryStore/')],
          'AtlasMemoryStore over transcripts + Vector Search, Voyage embeddings in add()'],
        ['Train: Formula · RewardFunction · Trainer.fit() over the configuration',
          [doc('S14', D12+'1-source-register'), LED('L14'), doc('13 §9', D13+'9-evaluation-and-the-optimizer-loop')],
          [],
          [st('harness optimizer (blog)', SB+'introducing-harness-optimizer/')],
          'PolicyFormula (Python), see question 2'],
        ['Inspect: Graph persists orchestrator state, per-node results, node transitions',
          [doc('S10 S20', D12+'1-source-register'), LED('L19'), doc('13 §8 multi-agent', D13+'8-multi-agent-subagents-graph-swarm-a2a')],
          [code('runIteration() L113–120', CORE+'113-L120')],
          [st('TypeScript v1 (blog)', SB+'strands-agents-typescript-v1/')],
          'runIteration stays as orchestration; a Graph of three harness agents replaces it (L19)'],
        ['The closing edge (ours): rewritePolicy() → policies v<n+1> → next harnessOptions()',
          [doc('00 loops inside the loop', D00+'loops-inside-the-loop'), doc('06 why self-improving', D06+'recap-why-this-is-self-improving'), doc('07 §3 principle', D07+'3-the-measurement-system'), doc('10 §4.2 one iteration', D10+'42-one-iteration'), doc('12 §4 topology', D12+'4-topology'), doc('12 strike list', D12+'strike-list-things-we-now-do-not-build'), leaf('sketch f2 · the backfeed edge', 'sketches.html#f2'), leaf('sketch f8 · evolution', 'sketches.html#f8')],
          [code('rewritePolicy() L4–12', GH+'harness/packages/instrument/src/index.ts#L4-L12'), code('Policy.provenance L39', CORE+'39')],
          [],
          'rewrite grants and routes, not only rules; write the git tag and the v<n>.json mirror from code']
      ]},
    { id:'q4', n:4, slug:'media', q:'How does the 3PT workflow look for media-heavy content?', layer:'left side · jobs · M-5 … M-10', doc: D15+'4-how-does-the-3pt-workflow-look-for-media-heavy-content',
      segs:['s1.06','s1.07','s1.13','s1.21'],
      cols:['Step','Corpus','Codebase','Strands','Extend'],
      rows:[
        ['Plan reads: checkpoints, measurements, and the media state (tiers · transcripts · jobs); picks a sprint mode',
          [doc('00 two sides of the triangle', D00+'two-sides-of-the-triangle'), leaf('sketch f4 · Plan\'s hand-offs', 'sketches.html#f4')],
          [code('selectMode() L4–10', GH+'harness/packages/plan/src/index.ts#L4-L10'), code('COLLECTIONS L11–19', CORE+'11-L19')],
          [],
          'AtlasMemoryStore so Plan searches prior retrospectives and transcripts (L8)'],
        ['Build edits: a Strands harness with shell·read·write·edit and the media tools granted; pipelines live in the repo',
          [doc('12 §4 per-stage table', D12+'what-each-stages-harness-is-concretely'), LED('L6 L21'), doc('10 §4.3 grants', D10+'43-batteries-tool-grants-stages')],
          [code('seedPolicy() grants L132–136', CORE+'132-L136'), code('grants() L28–38', STR+'28-L38')],
          [st('tool({ inputSchema: z.object })', SB+'strands-agents-typescript-v1/')],
          'index · transcribe · tier become tool()s in @3pt/media, granted by name'],
        ['Worker drains: tick() derives one job per asset; jobFor() → transcribe if no transcript, else tier if chooseTier() disagrees',
          [doc('10 §4.6 triangle → directories', D10+'46-the-triangle-mapped-to-directories'), doc('10 §5 recipe: a left-side job', D10+'5-extension-recipes')],
          [code('chooseTier · needsTranscript · jobFor L4–17', GH+'harness/packages/media/src/index.ts#L4-L17'), code('tick() L5–14', GH+'harness/apps/worker/src/index.ts#L5-L14'), code('Job L83–91', CORE+'83-L91')],
          [],
          'migrate has no derivation; the worker writes no measurements'],
        ['Read once: extract context from an image once, store the transcript, re-read only deliberately',
          [doc('00 scope', D00+'scope-for-the-hackathon'), doc('00 problems', D00+'problems-we-are-addressing-statement-of-need'), doc('07 M-5 M-6 M-7', D07+'31-metric-register')],
          [code('read-once in every stage prompt L51', STR+'51'), code('MediaAsset L73–81', CORE+'73-L81'), code('Policy.contextPolicy L33–37', CORE+'33-L37')],
          [],
          'M-7 guards hollow reuse: deliberate re-reads that disagree with the transcript'],
        ['Tier: hot vs cold under hotTierBudgetMB; recency now, relevance later',
          [doc('07 M-8 M-9 M-10', D07+'31-metric-register'), doc('06 use case', D06+'use-case-an-interior-design-firm')],
          [code('chooseTier() L4–7', GH+'harness/packages/media/src/index.ts#L4-L7'), code('blob battery SKILL.md', GH+'infra/batteries/blob/SKILL.md')],
          [],
          'relevance-driven promotion from transcript hits; M-17 bytes per retained context'],
        ['Instrument rewrites: M-5 … M-10, M-17 in → contextPolicy and stream budgets (M-15) out; migrations run from the new policy',
          [doc('06 recap', D06+'recap-why-this-is-self-improving'), doc('07 §3.1', D07+'31-metric-register'), doc('03 the workload the loop operates on', D03+'the-initialized-pipeline-plan-build-instrument-skeleton'), leaf('sketch f5 · the rail', 'sketches.html#f5'), leaf('sketch f6 · replay over media', 'sketches.html#f6'), leaf('direction · stress test', 'direction.html#stress')],
          [code('rewritePolicy() L4–12', GH+'harness/packages/instrument/src/index.ts#L4-L12')],
          [],
          'the worker must emit M-5…M-10 before Instrument can rewrite from them']
      ]}
  ];

  T.STRANDS_GAPS = [
    ['Policy has no routes field; docs/12 §3 assumes policy.routes', '@3pt/core vs DEFAULT_ROUTES in @3pt/strands', 'L2'],
    ['@3pt/strands is excluded from the workspace, so nothing is compiler-verified', 'pnpm-workspace.yaml · docs/12 §6', 'L1–L9'],
    ['routerFor() is a comment', 'strands/src/index.ts L64–70', 'L2'],
    ['harness/policies/gates/build.cedar is named, not written', 'grants() L34', 'L4'],
    ['AtlasStorage has no caller', 'strands/src/index.ts L74', 'L7 L22'],
    ['AtlasMemoryStore, PolicyFormula, harness/evals/ do not exist', 'docs/12 §5', 'L8 L14 L15'],
    ['media tools are functions, not tool()s; the worker writes no measurements', '@3pt/media · apps/worker', 'L6 L21'],
    ['the checkpoint writes one of its three parts', 'instrumentStage', 'L11']
  ];

  /* DERIVED tallies */
  T.strandsTally = function(){
    var files = {}, byKind = {doc:0, leaf:0, code:0, strands:0}, segs = {};
    T.STRANDS_Q.forEach(function(q){
      q.segs.forEach(function(s){ segs[s] = 1; });
      q.rows.forEach(function(r){ [r[1], r[2], r[3]].forEach(function(ps){ ps.forEach(function(p){ byKind[p[2]]++; files[p[1].split('#')[0]] = 1; }); }); });
    });
    var total = byKind.doc + byKind.leaf + byKind.code + byKind.strands;
    return { total: total, byKind: byKind, files: Object.keys(files).length, segs: Object.keys(segs).length, questions: T.STRANDS_Q.length, gaps: T.STRANDS_GAPS.length,
      perQ: T.STRANDS_Q.map(function(q){ var n = 0; q.rows.forEach(function(r){ n += r[1].length + r[2].length + r[3].length; }); return n; }) };
  };
})();
