/* 3PT · simulation Model for the demo. Acme Builders, 20 projects, 2019 → 2026, at most 4 live at once.
   AUTHORED example data, generated from a fixed seed so every browser and every run sees the
   same firm. The shape mirrors the MongoDB collections the harness will use:
     projects · photos (sampled) · weeks (per-project weekly metrics) · versions (harness_versions)
   One chronological pass computes everything, because what the harness learns on one project
   changes the numbers on the next one. Playback only reveals state up to the sim date.
   Node-safe: sets globalThis.SIM and touches no DOM, so a seed script can import it later. */
(function(){
  var G = (typeof globalThis!=='undefined'?globalThis:window);
  if (G.SIM) return;

  function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  var R = rng(20260926);
  var DAY=864e5, WEEK=7*DAY;
  var T0 = Date.UTC(2019,0,7);                 /* Monday, first sim week */
  var TODAY = Date.UTC(2026,8,26);             /* the demo's "today" */
  var NWEEKS = Math.ceil((Date.UTC(2027,0,4)-T0)/WEEK);

  /* ---------- the firm ---------- */
  var ROLES = [
    {id:'super',  name:'Superintendent',    where:'on site, phone'},
    {id:'pm',     name:'Project manager',   where:'office, laptop'},
    {id:'owner',  name:'Owner / executive', where:'weekly, any device'},
    {id:'pe',     name:'Project engineer',  where:'office, laptop'},
    {id:'trade',  name:'Plumbing foreman',  where:'on site, phone', trade:'plumbing'},
    {id:'safety', name:'Safety manager',    where:'on site, tablet'}
  ];
  /* type → size template. units = rooms, suites or bays that get walls closed. */
  var TYPES = {
    tower:     {label:'Residential building', levels:[6,20], units:8,  weeks:[70,96],  perWeek:260},
    hotel:     {label:'Hotel',             levels:[6,18], units:12, weeks:[64,84],  perWeek:240},
    clinic:    {label:'Health center',     levels:[3,14], units:10, weeks:[44,64],  perWeek:150},
    school:    {label:'School',            levels:[3,10], units:12, weeks:[50,68],  perWeek:170},
    office:    {label:'Office building',   levels:[3,12], units:4,  weeks:[36,52],  perWeek:110},
    retail:    {label:'Retail',            levels:[2,5],  units:6,  weeks:[30,44],  perWeek:90},
    warehouse: {label:'Warehouse',         levels:[2,6],  units:10, weeks:[36,50],  perWeek:80},
    parking:   {label:'Parking garage',    levels:[3,8],  units:6,  weeks:[40,56],  perWeek:100}
  };
  /* 20 real new-building filings from NYC Open Data (DOB Job Application Filings, ic3t-wcy2).
     Kept: street, neighborhood, building class → type, stories, floor area, job number.
     Dropped: house numbers and every personal name. Acme Builders and all dates are AUTHORED:
     the firm "wins" these jobs in this order and the scheduler below sets the dates. */
  var LIST = [
    {"name": "Broadway Residences", "type": "tower", "street": "Broadway", "nta": "SoHo-TriBeCa-Civic Center-Little Italy", "borough": "Manhattan", "stories": 14, "sqft": 0, "job": "102284430", "filed": "03/20/2001"},
    {"name": "E 26 St Health Center", "type": "clinic", "street": "E 26 St", "nta": "Murray Hill-Kips Bay", "borough": "Manhattan", "stories": 14, "sqft": 0, "job": "102996670", "filed": "11/08/2001"},
    {"name": "West 158th St School", "type": "school", "street": "West 158th St", "nta": "Washington Heights (South)", "borough": "Manhattan", "stories": 6, "sqft": 210835, "job": "103880374", "filed": "06/18/2009"},
    {"name": "Morningside Ave Offices", "type": "office", "street": "Morningside Ave", "nta": "Morningside Heights", "borough": "Manhattan", "stories": 8, "sqft": 0, "job": "103019421", "filed": "10/29/2001"},
    {"name": "East Broadway Retail", "type": "retail", "street": "East Broadway", "nta": "Chinatown-Two Bridges", "borough": "Manhattan", "stories": 2, "sqft": 0, "job": "102481244", "filed": "02/12/2001"},
    {"name": "Greenwich St Hotel", "type": "hotel", "street": "Greenwich St", "nta": "Tribeca-Civic Center", "borough": "Manhattan", "stories": 7, "sqft": 0, "job": "103488735", "filed": "06/23/2003"},
    {"name": "West 145th St Warehouse", "type": "warehouse", "street": "West 145th St", "nta": "Central Harlem North-Polo Grounds", "borough": "Manhattan", "stories": 6, "sqft": 77762, "job": "121188696", "filed": "07/26/2018"},
    {"name": "Elizabeth St Garage", "type": "parking", "street": "Elizabeth St", "nta": "SoHo-Little Italy-Hudson Square", "borough": "Manhattan", "stories": 4, "sqft": 0, "job": "103299048", "filed": "10/28/2002"},
    {"name": "Third Ave Residences", "type": "tower", "street": "Third Ave", "nta": "East Harlem South", "borough": "Manhattan", "stories": 6, "sqft": 0, "job": "102489781", "filed": "03/02/2001"},
    {"name": "Wadsworth Ave Health Center", "type": "clinic", "street": "Wadsworth Ave", "nta": "Washington Heights (South)", "borough": "Manhattan", "stories": 9, "sqft": 32500, "job": "120015713", "filed": "04/17/2009"},
    {"name": "East 15th St School", "type": "school", "street": "East 15th St", "nta": "Hudson Yards-Chelsea-Flatiron-Union Square", "borough": "Manhattan", "stories": 8, "sqft": 92800, "job": "103890461", "filed": "05/30/2012"},
    {"name": "St Nicholas Ave Offices", "type": "office", "street": "St Nicholas Ave", "nta": "Washington Heights (South)", "borough": "Manhattan", "stories": 6, "sqft": 0, "job": "103986616", "filed": "06/30/2005"},
    {"name": "East 117th St Retail", "type": "retail", "street": "East 117th St", "nta": "East Harlem (North)", "borough": "Manhattan", "stories": 4, "sqft": 521537, "job": "104161835", "filed": "08/01/2005"},
    {"name": "West 28th St Hotel", "type": "hotel", "street": "West 28th St", "nta": "Midtown South-Flatiron-Union Square", "borough": "Manhattan", "stories": 17, "sqft": 0, "job": "103687690", "filed": "01/27/2004"},
    {"name": "West 109th St Residences", "type": "tower", "street": "West 109th St", "nta": "Morningside Heights", "borough": "Manhattan", "stories": 7, "sqft": 0, "job": "102836184", "filed": "02/08/2000"},
    {"name": "West 41st St Health Center", "type": "clinic", "street": "West 41st St", "nta": "Clinton", "borough": "Manhattan", "stories": 12, "sqft": 54441, "job": "121188614", "filed": "07/09/2018"},
    {"name": "10th Ave School", "type": "school", "street": "10th Ave", "nta": "Inwood", "borough": "Manhattan", "stories": 6, "sqft": 108152, "job": "104214155", "filed": "10/22/2021"},
    {"name": "Delancy St Residences", "type": "tower", "street": "Delancy St", "nta": "Chinatown", "borough": "Manhattan", "stories": 17, "sqft": 0, "job": "102491590", "filed": "04/03/2001"},
    {"name": "Park Ave Offices", "type": "office", "street": "Park Ave", "nta": "East Harlem (North)", "borough": "Manhattan", "stories": 4, "sqft": 0, "job": "104138443", "filed": "06/14/2005"},
    {"name": "Sullivan St Residences", "type": "tower", "street": "Sullivan St", "nta": "West Village", "borough": "Manhattan", "stories": 7, "sqft": 0, "job": "102501810", "filed": "07/06/2001"},
  ];

  var PHASES = [
    ['Site work',  .08, ['site','concrete']],
    ['Structure',  .24, ['concrete','steel']],
    ['Framing',    .12, ['framing']],
    ['Rough-in',   .18, ['plumbing','electrical','hvac']],
    ['Close-in',   .15, ['drywall','insulation']],
    ['Finishes',   .16, ['finishes','paint']],
    ['Closeout',   .07, ['finishes','exterior']]
  ];
  var COVER = {tower:'exterior',hotel:'exterior',clinic:'concrete',school:'framing',office:'steel',retail:'finishes',warehouse:'steel',parking:'concrete'};

  function pick(a){ return a[Math.floor(R()*a.length)]; }
  function between(a){ return a[0]+Math.floor(R()*(a[1]-a[0]+1)); }

  /* the scheduler. The last 4 jobs are pinned so that on demo day (TODAY) the firm has 4 live jobs
     in 4 different phases. The first 16 start about every 4 months, but never while 4 jobs are live. */
  var MAXLIVE=4, TODAY_W=Math.round((TODAY-T0)/WEEK);
  var PIN = {17:0.86, 18:0.70, 19:0.53, 20:0.04};   /* share of the job done on demo day */
  function sizeOf(row){ var t=TYPES[row.type], levels=Math.max(t.levels[0],Math.min(row.stories, t.levels[1]));
    return {levels:levels, weeks:Math.round(between(t.weeks)*(0.85+0.3*(levels-t.levels[0])/Math.max(1,t.levels[1]-t.levels[0])))}; }
  function make(row,i,w0,sz){ var t=TYPES[row.type], acc=0;
    var phases=PHASES.map(function(ph){ var n=Math.max(2,Math.round(ph[1]*sz.weeks)); var o={name:ph[0], from:w0+acc, to:w0+acc+n-1, trades:ph[2]}; acc+=n; return o; });
    return { id:'p'+(i+1<10?'0':'')+(i+1), n:i+1, name:row.name, type:row.type, typeLabel:t.label, street:row.street, neighborhood:row.nta, borough:row.borough,
             source:{dataset:'NYC DOB Job Application Filings', job:row.job, stories:row.stories, zoning_sqft:row.sqft},
             levels:sz.levels, unitsPerLevel:t.units, units:sz.levels*t.units, perWeek:t.perWeek, startWeek:w0, endWeek:w0+acc-1, phases:phases, cover:COVER[row.type],
             weeks:[], photos:[], retro:null }; }
  var sizes=LIST.map(sizeOf), placed=[];
  LIST.forEach(function(row,i){ if(PIN[i+1]!=null) placed.push(make(row,i,TODAY_W-Math.round(PIN[i+1]*sizes[i].weeks),sizes[i])); });
  function liveAt(x){ return placed.filter(function(p){return p.startWeek<=x && p.endWeek>=x;}).length; }
  var nextWant=Math.round((Date.UTC(2019,1,4)-T0)/WEEK);
  LIST.forEach(function(row,i){
    if(PIN[i+1]!=null) return;
    var w0=nextWant, n=sizes[i].weeks;
    for(;;){ var ok=true; for (var x=w0;x<w0+n+8;x++){ if(liveAt(x)>=MAXLIVE){ ok=false; break; } } if(ok) break; w0++; }
    placed.push(make(row,i,w0,sizes[i]));
    nextWant = w0 + 15 + Math.floor(R()*8);
  });
  var projects=placed.sort(function(a,b){return a.n-b.n;});

  function weekDate(w){ return T0 + w*WEEK; }
  function phaseAt(p,w){ for (var i=0;i<p.phases.length;i++) if (w>=p.phases[i].from && w<=p.phases[i].to) return p.phases[i]; return null; }

  /* ---------- what the harness can do, and when it learns it ----------
     Each capability has a plain-words trigger on a firm-wide counter. The first week the counter
     crosses the threshold, a new harness version is saved. */
  var CAPS = [
    {id:'fields',   when:function(c){return c.photos>=15000;},            v:{changes:['Added fields: unit, level, trade'], why:'15,000 photos filed with only a date and a description'}},
    {id:'wall',     when:function(c){return c.failed>=300;},              v:{changes:['Added field: open or closed wall','Read older photos again, once'], why:'300 searches for "before drywall" came back wrong'}},
    {id:'wide',     when:function(c){return c.caps.wall && c.w-c.caps.wall.w>=8;}, v:{changes:['Tried: send 20 photos to the model per question instead of 8'], why:'Answers were slow to improve'}, rollback:3},
    {id:'remind',   when:function(c){return c.reopened>=6;},             v:{changes:['Wrote a tool: find units with no open-wall photo','Reminder before drywall starts in a unit'], why:'6 walls reopened to find a pipe'}},
    {id:'pack',     when:function(c){return c.packMin>=200*60;},          v:{changes:['Automated the Friday owner photo pack'], why:'200 hours spent building owner packs by hand'}},
    {id:'issue',    when:function(c){return c.lateWater>=8;},            v:{changes:['Added field: issue (water stain, crack, damage)','Flag water photos the day they arrive'], why:'8 water problems found only at closeout'}},
    {id:'screens',  when:function(c){return c.liveWeeks>=700;},          v:{changes:['Learned a screen for 4 roles: superintendent, PM, owner, engineer'], why:'700 project-weeks of use, by role'}},
    {id:'bursts',   when:function(c){return c.stored>=150000;},          v:{changes:['Stopped keeping duplicate burst photos after 24 hours'], why:'150,000 photos stored, 18% near duplicates'}},
    {id:'hazard',   when:function(c){return c.w>=Math.round((Date.UTC(2025,5,2)-T0)/WEEK)+10;}, v:{changes:['Added flag: open edge, missing rail','Learned a screen for the safety manager'], why:'Safety manager joined in June 2025 and asked 30 hazard questions'}},
    {id:'closeout', when:function(c){return c.closed>=12;},              v:{changes:['Automated the closeout photo set per unit'], why:'12 closeouts built by hand'}}
  ];

  var versions=[{v:0, w:0, date:weekDate(0), changes:['Generic start: describe each image, its date and its source'], why:'Install', cap:null}];
  var c={w:0, photos:0, failed:0, reopened:0, packMin:0, lateWater:0, liveWeeks:0, stored:0, closed:0, caps:{}};
  var firm=[];   /* per global week: firm-wide snapshot for the rails and the chart */
  var pid=0;

  for (var w=0; w<NWEEKS; w++){
    c.w=w;
    /* learn first: a capability learned this week helps from this week on */
    CAPS.forEach(function(cap){
      if (c.caps[cap.id] || !cap.when(c)) return;
      var ver={v:versions.length, w:w, date:weekDate(w), changes:cap.v.changes, why:cap.v.why, cap:cap.id};
      versions.push(ver); c.caps[cap.id]={w:w};
      if (cap.rollback){ ver.rolledBackWeek=w+cap.rollback; }
    });
    var has=function(id){ return !!c.caps[id]; };
    var live=0, photosWk=0;
    projects.forEach(function(p){
      if (w<p.startWeek || w>p.endWeek) return;
      live++; c.liveWeeks++;
      var ph=phaseAt(p,w), idx=w-p.startWeek;
      var n=Math.round(p.perWeek*(0.7+R()*0.6)*(ph.name==='Site work'||ph.name==='Closeout'?0.6:1));
      var pMiss = has('remind')?0.02:(has('wall')?0.14:0.22);
      var closing = ph.name==='Close-in' ? Math.max(1,Math.round(p.units/(ph.to-ph.from+1))) : 0;
      var missing=0; for (var k=0;k<closing;k++) if (R()<pMiss) missing++;
      var reopened=0; for (k=0;k<missing;k++) if (R()<0.25) reopened++;
      var water = (ph.name==='Close-in'||ph.name==='Finishes') && R()<0.12 ? 1:0;
      var searches=4+Math.floor(R()*6), failRate=has('wall')?(has('issue')?0.06:0.12):0.35;
      var failed=Math.round(searches*failRate);
      var packMin = has('pack')?0:45;
      var burst = has('bursts')?0.82:1;
      var wk={w:w, phase:ph.name, photos:n, stored:Math.round(n*burst), closing:closing, missing:missing, reopened:reopened, water:water,
              waterEarly: water && has('issue') ? 1:0, searches:searches, failed:failed, packMin:packMin};
      p.weeks.push(wk);
      c.photos+=n; c.stored+=wk.stored; c.failed+=failed; c.reopened+=reopened; c.packMin+=packMin;
      if (water && !has('issue')) c.lateWater+= (R()<0.6?1:0);
      photosWk+=n;
      /* sampled snapshots: 4 per project per week, enough for playback and the app */
      for (k=0;k<4;k++){
        var trade=pick(ph.trades), lvl=1+Math.floor(R()*p.levels), u=lvl*100+1+Math.floor(R()*p.unitsPerLevel);
        var wall = (trade==='plumbing'||trade==='electrical'||trade==='hvac'||trade==='framing')?'open':(trade==='drywall'||trade==='finishes'||trade==='paint'||trade==='insulation'?'closed':null);
        var photo={id:'IMG_'+(10000+(pid++)), p:p.id, w:w, day:Math.floor(R()*5), trade:trade, level:lvl, unit:(trade==='site'||trade==='exterior')?null:u, wall:wall};
        var pool=G.MEDIA&&G.MEDIA[trade]; if(pool&&pool.length) photo.file=pool[pid%pool.length];   /* a real, openly licensed photo */
        if (k===0 && water) photo.water=true;
        if (k===1 && (trade==='framing'||trade==='steel') && R()<0.08) photo.hazard=pick(['open edge, no rail','missing toe board','ladder not tied off']);
        p.photos.push(photo);
      }
    });
    projects.forEach(function(p){
      if (w===p.endWeek){
        c.closed++;
        var sum=function(f){ return p.weeks.reduce(function(a,x){return a+x[f];},0); };
        var learned=versions.filter(function(v){return v.w>=p.startWeek && v.w<=p.endWeek && v.cap;});
        p.retro={
          facts:[
            [Math.round(sum('packMin')/60),'hours building owner packs by hand'],
            [sum('missing'),'units closed with no open-wall photo'],
            [sum('reopened'),'walls reopened later'],
            [sum('failed'),'searches that found nothing useful']
          ],
          photos:sum('photos'),
          lessons: learned.length ? learned.map(function(v){return v.changes[0];}) : ['No new lessons. The harness already covered this job.']
        };
      }
    });
    firm.push({w:w, live:live, photos:c.photos, stored:c.stored, v:versions.length-1, reopened:c.reopened, failed:c.failed, closed:c.closed});
  }

  /* hours saved by each capability, per live-project week, used by "time savers" (AUTHORED rates) */
  var SAVINGS = {pack:0.75, remind:1.2, wall:0.8, issue:0.4, closeout:0.5, bursts:0};

  /* ---------- queries the pages use ---------- */
  function weekOf(t){ return Math.floor((t-T0)/WEEK); }
  function status(p,w){ return w<p.startWeek?'planned':(w>p.endWeek?'closed':'live'); }
  function currentVersion(w){
    var cur=versions[0];
    versions.forEach(function(v){ if (v.w<=w && !(v.rolledBackWeek!=null && v.rolledBackWeek<=w)) cur=v; });
    return cur;
  }
  function versionsUpTo(w){ return versions.filter(function(v){return v.w<=w;}); }
  function capsAt(w){ var o={}; versions.forEach(function(v){ if(v.cap && v.w<=w && !(v.rolledBackWeek!=null && v.rolledBackWeek<=w)) o[v.cap]=true; }); return o; }
  function photosUpTo(p,w){ return p.photos.filter(function(x){return x.w<=w;}); }
  function statsUpTo(p,w){
    var o={photos:0,missing:0,reopened:0,failed:0,packMin:0,water:0}; p.weeks.forEach(function(x){ if(x.w<=w){ for (var k in o) o[k]+=x[k]||0; } }); return o;
  }
  function hoursSavedUpTo(w){
    var h=0; versions.forEach(function(v){ if(!v.cap || SAVINGS[v.cap]==null || v.w>w) return;
      projects.forEach(function(p){ p.weeks.forEach(function(x){ if(x.w>=v.w && x.w<=w) h+=SAVINGS[v.cap]; }); }); });
    return Math.round(h);
  }

  G.SIM = { T0:T0, WEEK:WEEK, TODAY:TODAY, TODAY_WEEK:weekOf(TODAY), NWEEKS:NWEEKS, ROLES:ROLES, TYPES:TYPES,
            MAXLIVE:MAXLIVE, projects:projects, versions:versions, firm:firm, SAVINGS:SAVINGS,
            weekDate:weekDate, weekOf:weekOf, phaseAt:phaseAt, status:status, currentVersion:currentVersion,
            versionsUpTo:versionsUpTo, capsAt:capsAt, photosUpTo:photosUpTo, statsUpTo:statsUpTo, hoursSavedUpTo:hoursSavedUpTo };
})();
